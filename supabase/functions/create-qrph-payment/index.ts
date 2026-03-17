// Supabase Edge Function: creates PayMongo Payment Intent + QR Ph, returns QR image.
// Set secrets: PAYMONGO_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY (for updating order).
// Invoke with: { order_id, amount_cents, billing: { name, email, phone?, address? } }
// Authorization header must be the Supabase JWT (user token).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYMONGO_BASE = "https://api.paymongo.com/v1";
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

interface Billing {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface ReqBody {
  order_id: string;
  amount_cents: number;
  billing: Billing;
}

function paymongoFetch(
  path: string,
  secretKey: string,
  options: RequestInit = {}
): Promise<Response> {
  const auth = btoa(secretKey + ":");
  return fetch(PAYMONGO_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + auth,
      ...(options.headers as Record<string, string>),
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!secretKey || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server missing PAYMONGO_SECRET_KEY or Supabase config" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;
    const { order_id, amount_cents, billing } = body;
    if (!order_id || amount_cents == null || !billing?.name || !billing?.email) {
      return new Response(
        JSON.stringify({ error: "Missing order_id, amount_cents, or billing (name, email)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(token);
    if (userError || !user) {
      const message = userError?.message?.includes("JWT")
        ? "Invalid or expired session. Please log in again."
        : "Unauthorized";
      return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select("id, user_id, status, payment_intent_id")
      .eq("id", order_id)
      .single();
    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.payment_intent_id) {
      return new Response(
        JSON.stringify({ error: "Order already has a payment intent" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amount = Math.round(Number(amount_cents));
    if (amount < 100) {
      return new Response(
        JSON.stringify({ error: "Amount must be at least 100 centavos (₱1)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createPiRes = await paymongoFetch("/payment_intents", secretKey, {
      method: "POST",
      body: JSON.stringify({
        data: {
          attributes: {
            amount,
            currency: "PHP",
            payment_method_allowed: ["qrph"],
            description: `Order ${order_id.slice(0, 8)}`,
          },
        },
      }),
    });
    if (!createPiRes.ok) {
      const errText = await createPiRes.text();
      return new Response(
        JSON.stringify({ error: "PayMongo payment intent failed", detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const piData = await createPiRes.json();
    const paymentIntentId = piData?.data?.id;
    if (!paymentIntentId) {
      return new Response(
        JSON.stringify({ error: "Invalid PayMongo response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const billingAttrs: Record<string, unknown> = {
      name: billing.name,
      email: billing.email,
    };
    if (billing.phone) billingAttrs.phone = billing.phone;
    if (billing.address)
      billingAttrs.address = {
        line1: billing.address,
        city: "",
        state: "",
        postal_code: "",
        country: "PH",
      };

    const createPmRes = await paymongoFetch("/payment_methods", secretKey, {
      method: "POST",
      body: JSON.stringify({
        data: {
          attributes: {
            type: "qrph",
            billing: billingAttrs,
          },
        },
      }),
    });
    if (!createPmRes.ok) {
      const errText = await createPmRes.text();
      return new Response(
        JSON.stringify({ error: "PayMongo payment method failed", detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const pmData = await createPmRes.json();
    const paymentMethodId = pmData?.data?.id;
    if (!paymentMethodId) {
      return new Response(
        JSON.stringify({ error: "Invalid PayMongo payment method response" }),
        { status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const attachRes = await paymongoFetch(
      `/payment_intents/${paymentIntentId}/attach`,
      secretKey,
      {
        method: "POST",
        body: JSON.stringify({
          data: { attributes: { payment_method: paymentMethodId } },
        }),
      }
    );
    if (!attachRes.ok) {
      const errText = await attachRes.text();
      return new Response(
        JSON.stringify({ error: "PayMongo attach failed", detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const attachData = await attachRes.json();
    const qrImageUrl =
      attachData?.data?.attributes?.next_action?.code?.image_url ?? null;

    await adminClient
      .from("orders")
      .update({ payment_intent_id: paymentIntentId })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({
        payment_intent_id: paymentIntentId,
        qr_image_url: qrImageUrl,
        order_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
