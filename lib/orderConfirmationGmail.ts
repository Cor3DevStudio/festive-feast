/**
 * Order confirmation email via Gmail SMTP (nodemailer).
 * Used by Vercel `api/send-order-confirmation` and the Vite dev middleware.
 *
 * Env: GMAIL_USER, GMAIL_APP_PASSWORD (Google Account → App Passwords)
 * Optional: STORE_NAME, SITE_PUBLIC_URL
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export type EnvGetter = (key: string) => string | undefined;

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPhp(cents: number): string {
  const n = cents / 100;
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function makeEnvGetter(override?: Record<string, string | undefined>): EnvGetter {
  return (key: string) => override?.[key] ?? process.env[key];
}

interface OrderRow {
  id: string;
  user_id: string;
  status: string | null;
  total_cents: number;
  payment_method: string | null;
  shipping_name: string | null;
  shipping_email: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_province: string | null;
  shipping_postal_code: string | null;
}

interface LineRow {
  product_id: string;
  product_name: string | null;
  size: string | null;
  quantity: number | null;
  unit_price_cents: number | null;
}

export async function sendOrderConfirmationViaGmail(
  admin: SupabaseClient,
  orderId: string,
  userId: string,
  getEnv: EnvGetter = makeEnvGetter(),
): Promise<{ ok: true } | { error: string; status: number }> {
  const gmailUser = getEnv("GMAIL_USER")?.trim();
  const gmailPass = getEnv("GMAIL_APP_PASSWORD")?.trim();
  if (!gmailUser || !gmailPass) {
    return {
      error:
        "Server missing GMAIL_USER or GMAIL_APP_PASSWORD. Use a Google App Password (not your normal Gmail password).",
      status: 500,
    };
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, user_id, status, total_cents, payment_method, shipping_name, shipping_email, shipping_phone, shipping_address, shipping_city, shipping_province, shipping_postal_code",
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { error: "Order not found", status: 404 };
  }

  const o = order as OrderRow;
  if (o.user_id !== userId) {
    return { error: "Forbidden", status: 403 };
  }

  const toEmail = (o.shipping_email ?? "").trim();
  if (!toEmail) {
    return { error: "Order has no customer email", status: 400 };
  }

  const { data: linesRaw, error: linesError } = await admin
    .from("order_items")
    .select("product_id, product_name, size, quantity, unit_price_cents")
    .eq("order_id", orderId);

  if (linesError) {
    return { error: linesError.message, status: 500 };
  }

  const lines = (linesRaw ?? []) as LineRow[];
  const storeName = getEnv("STORE_NAME")?.trim() || "Christmas Decors PH";
  const siteUrl = (getEnv("SITE_PUBLIC_URL") ?? getEnv("VITE_SITE_URL") ?? "").replace(/\/$/, "");

  const orderRef = String(o.id).slice(0, 8).toUpperCase();
  const paymentNote =
    o.payment_method === "qrph"
      ? "Complete your payment by scanning the QR Ph code on the next screen (if you have not paid yet)."
      : o.payment_method === "paymongo"
        ? "If you chose card or wallet checkout, finish payment in the PayMongo flow when prompted."
        : "";

  const rowsHtml = lines
    .map((line) => {
      const name = escHtml(line.product_name ?? line.product_id ?? "Item");
      const size = escHtml(line.size ?? "—");
      const qty = line.quantity ?? 0;
      const unit = formatPhp(line.unit_price_cents ?? 0);
      const lineTotal = formatPhp((line.unit_price_cents ?? 0) * qty);
      return `<tr>
          <td style="padding:10px;border-bottom:1px solid #eee">${name}</td>
          <td style="padding:10px;border-bottom:1px solid #eee">${size}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${qty}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${unit}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${lineTotal}</td>
        </tr>`;
    })
    .join("");

  const shipBlock = [
    o.shipping_name,
    o.shipping_address,
    [o.shipping_city, o.shipping_province, o.shipping_postal_code].filter(Boolean).join(", "),
    o.shipping_phone ? `Phone: ${o.shipping_phone}` : "",
  ]
    .filter(Boolean)
    .map((l) => escHtml(String(l)))
    .join("<br/>");

  const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:640px;margin:0 auto;padding:24px">
  <h1 style="color:#b91c1c;font-size:22px;margin:0 0 8px">Order received — ${escHtml(storeName)}</h1>
  <p style="margin:0 0 16px;color:#444">Salamat! We received your order <strong>#${orderRef}</strong>.</p>
  ${paymentNote ? `<p style="margin:0 0 16px;padding:12px;background:#fff7ed;border-radius:8px;color:#9a3412">${escHtml(paymentNote)}</p>` : ""}
  <p style="margin:0 0 8px;font-weight:600">Ship to</p>
  <p style="margin:0 0 20px;color:#333">${shipBlock}</p>
  <p style="margin:0 0 8px;font-weight:600">Items</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead>
      <tr style="background:#f4f4f5;text-align:left">
        <th style="padding:10px">Product</th>
        <th style="padding:10px">Size</th>
        <th style="padding:10px;text-align:center">Qty</th>
        <th style="padding:10px;text-align:right">Unit</th>
        <th style="padding:10px;text-align:right">Line</th>
      </tr>
    </thead>
    <tbody>${rowsHtml || "<tr><td colspan='5' style='padding:12px'>No line items</td></tr>"}</tbody>
  </table>
  <p style="margin:20px 0 0;font-size:18px;font-weight:700">Total: ${formatPhp(o.total_cents)}</p>
  <p style="margin:24px 0 0;font-size:12px;color:#71717a">Status: <strong>${escHtml(o.status ?? "pending")}</strong>
  · Payment: ${escHtml(o.payment_method ?? "—")}</p>
  ${siteUrl ? `<p style="margin:16px 0 0"><a href="${siteUrl.replace(/"/g, "")}" style="color:#b91c1c">Visit our shop</a></p>` : ""}
  <p style="margin:32px 0 0;font-size:11px;color:#a1a1aa">This message was sent because you placed an order at ${escHtml(storeName)}.</p>
</body></html>`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${storeName.replace(/"/g, "")}" <${gmailUser}>`,
      to: toEmail,
      replyTo: gmailUser,
      subject: `${storeName} — Order #${orderRef} confirmed`,
      html,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `Failed to send email: ${msg}`, status: 502 };
  }

  return { ok: true };
}
