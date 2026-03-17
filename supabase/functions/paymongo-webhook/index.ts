// PayMongo webhook: on payment.paid, update the order status.
// In PayMongo Dashboard → Webhooks, set URL to: https://<project-ref>.supabase.co/functions/v1/paymongo-webhook
// Subscribe to event: payment.paid
// Set secret PAYMONGO_WEBHOOK_SECRET if you use signature verification.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paymongo-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.text();
    const event = JSON.parse(body) as {
      data?: {
        attributes?: {
          type?: string;
          data?: {
            id?: string;
            type?: string;
            attributes?: {
              payment_intent_id?: string;
              status?: string;
            };
          };
        };
      };
    };

    const eventType = event?.data?.attributes?.type;
    if (eventType !== "payment.paid") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentData = event?.data?.attributes?.data;
    const paymentIntentId = paymentData?.attributes?.payment_intent_id;
    const paymentId = paymentData?.id ?? null;
    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: "No payment_intent_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server config missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const updatePayload: { status: string; paymongo_payment_id?: string } = { status: "paid" };
    if (paymentId) updatePayload.paymongo_payment_id = paymentId;
    const { error } = await admin
      .from("orders")
      .update(updatePayload)
      .eq("payment_intent_id", paymentIntentId);

    if (error) {
      console.error("Webhook order update error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
