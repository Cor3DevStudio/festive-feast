// Poll helper: checks order + PayMongo payment intent so the client can detect payment without a manual button.
// When the intent is succeeded, marks the order paid (idempotent; same as webhook outcome).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYMONGO_BASE = "https://api.paymongo.com/v1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

interface ReqBody {
  order_id: string;
  user_id?: string;
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
    const { order_id, user_id: bodyUserId } = body;
    if (!order_id) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    let userId: string;

    if (token === serviceRoleKey && bodyUserId) {
      userId = bodyUserId;
    } else {
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
      userId = user.id;
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
    if (order.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status === "paid") {
      return new Response(JSON.stringify({ paid: true, source: "order" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentIntentId = order.payment_intent_id;
    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: "Order has no payment intent yet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const piRes = await paymongoFetch(`/payment_intents/${paymentIntentId}`, secretKey, {
      method: "GET",
    });
    if (!piRes.ok) {
      const errText = await piRes.text();
      return new Response(
        JSON.stringify({ error: "Could not load payment status", detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const piJson = (await piRes.json()) as {
      data?: { attributes?: { status?: string } };
    };
    const piStatus = piJson?.data?.attributes?.status ?? "unknown";

    if (piStatus === "succeeded") {
      const { error: updErr } = await adminClient
        .from("orders")
        .update({ status: "paid" })
        .eq("id", order_id)
        .eq("user_id", userId);

      if (updErr) {
        console.error("check-qrph-payment order update:", updErr);
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ paid: true, source: "paymongo" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ paid: false, payment_intent_status: piStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
