import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { PH_PROVINCES } from "@/data/phProvinces";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import { getProductImage } from "@/data/productImages";
import { supabase } from "@/lib/supabase";
import { createQrPhPayment, checkQrPhPayment } from "@/lib/paymongo-qrph";
import { cartLineKey } from "@/lib/cartLineKey";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const paymentMethods = [
  { value: "qrph", label: "QR Ph — scan to pay", desc: "Scan the QR code with your bank app or e-wallet (GCash, Maya, etc.). Real payment via PayMongo." },
  { value: "paymongo", label: "PayMongo (card / online)", desc: "Pay with credit/debit card, GCash, Maya, GrabPay via PayMongo." },
  { value: "cod", label: "Cash on delivery", desc: "Pay in cash when your order arrives." },
  { value: "bank", label: "Bank transfer", desc: "We'll send you our bank details after you place the order." },
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  province: "",
  postalCode: "",
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

const inputCls = (hasError?: boolean) =>
  `mt-1.5 w-full rounded-md bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-accent ring-offset-2${hasError ? " ring-2 ring-destructive" : ""}`;

export default function CheckoutPage() {
  const { user, session, isAuthenticated, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { items, removeLines, cartLoading } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const lineKeysFromCart = (location.state as { lineKeys?: string[] } | null)?.lineKeys;

  const checkoutItems = useMemo(() => {
    if (!lineKeysFromCart?.length) return items;
    const set = new Set(lineKeysFromCart);
    return items.filter((i) => set.has(cartLineKey(i.product.id, i.size)));
  }, [items, lineKeysFromCart]);

  const checkoutSubtotal = useMemo(
    () => checkoutItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [checkoutItems]
  );
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState("qrph");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qrPhStep, setQrPhStep] = useState<{
    qrImageUrl: string;
    orderId: string;
    purchasedLines: Array<{ productId: string; size: string }>;
  } | null>(null);
  const [qrPaymentHint, setQrPaymentHint] = useState<string | null>(null);
  const qrPhStepRef = useRef(qrPhStep);
  qrPhStepRef.current = qrPhStep;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const prefillDone = useRef(false);

  useEffect(() => {
    if (!qrPhStep) {
      setQrPaymentHint(null);
      return;
    }
    let cancelled = false;
    const poll = async () => {
      const step = qrPhStepRef.current;
      if (!step || cancelled) return;
      const { data, error } = await checkQrPhPayment(step.orderId);
      if (cancelled) return;
      if (error) {
        console.warn("checkQrPhPayment:", error.message);
        return;
      }
      if (data?.paid) {
        cancelled = true;
        await removeLines(step.purchasedLines);
        setQrPhStep(null);
        navigate("/order-success", { state: { paymentMethod: "qrph", paymentConfirmed: true } });
        return;
      }
      const st = data?.payment_intent_status;
      if (st === "awaiting_next_action") {
        setQrPaymentHint("Scan the QR and complete payment in your bank or e-wallet app.");
      } else if (st === "processing") {
        setQrPaymentHint("Payment processing…");
      } else if (st && st !== "unknown") {
        setQrPaymentHint(null);
      }
    };
    void poll();
    const id = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [qrPhStep?.orderId, navigate, removeLines]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate("/login?returnTo=/checkout", { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  // Pre-fill email from auth user
  useEffect(() => {
    if (user?.email && !form.email) {
      setForm((p) => ({ ...p, email: user.email ?? "" }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Pre-fill name, phone, and shipping from saved profile (once)
  useEffect(() => {
    if (!profile || prefillDone.current) return;
    prefillDone.current = true;
    setForm((p) => ({
      ...p,
      name: p.name || profile.full_name || "",
      email: p.email || user?.email || "",
      phone: p.phone || profile.phone || "",
      street: p.street || profile.shipping_street || "",
      city: p.city || profile.shipping_city || "",
      province: p.province || profile.shipping_province || "",
      postalCode: p.postalCode || profile.shipping_postal_code || "",
    }));
  }, [profile, user?.email]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-20 text-center">
          <p className="text-muted-foreground">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-20 text-center">
          <p className="text-muted-foreground">Loading your cart…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            {lineKeysFromCart?.length
              ? "No matching items for checkout. Return to your cart and try again."
              : "Add some items before checking out."}
          </p>
          <Link to="/cart" className="mt-6 inline-block rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground">
            Back to cart
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.street.trim()) e.street = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.province.trim()) e.province = "Required";
    if (!form.postalCode.trim()) e.postalCode = "Required";
    else if (!/^\d{4}$/.test(form.postalCode.trim())) e.postalCode = "Must be a 4-digit postal code";
    return e;
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!user?.id) return;
    setLoading(true);

    try {
      const totalCents = Math.round(checkoutSubtotal * 100);
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          total_cents: totalCents,
          shipping_name: form.name,
          shipping_email: form.email,
          shipping_phone: form.phone,
          shipping_address: form.street,
          shipping_city: form.city,
          shipping_province: form.province,
          shipping_postal_code: form.postalCode,
          payment_method: payment,
        })
        .select("id")
        .single();

      if (orderError || !order) {
        const details = [orderError?.message, orderError?.details, orderError?.hint]
          .filter(Boolean)
          .join(" ");
        console.error("Order insert failed:", orderError);
        setErrors({
          payment: details
            ? `Could not create order: ${details}`
            : "Could not create order. Please try again.",
        });
        setLoading(false);
        return;
      }

      const { error: orderItemsError } = await supabase.from("order_items").insert(
        checkoutItems.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          size: item.size,
          quantity: item.quantity,
          unit_price_cents: Math.round(item.product.price * 100),
        }))
      );
      if (orderItemsError) {
        const details = [orderItemsError.message, orderItemsError.details, orderItemsError.hint]
          .filter(Boolean)
          .join(" ");
        console.error("Order items insert failed:", orderItemsError);
        setErrors({
          payment: details
            ? `Order created but adding items failed: ${details}`
            : "Order created but adding items failed. Please contact support.",
        });
        setLoading(false);
        return;
      }

      const purchasedLines = checkoutItems.map((i) => ({
        productId: i.product.id,
        size: i.size,
      }));

      if (payment === "qrph") {
        if (!session?.access_token) {
          setErrors({ payment: "Session expired. Please sign in again and retry." });
          setLoading(false);
          return;
        }
        const { data: qrData, error: qrError } = await createQrPhPayment({
          order_id: order.id,
          amount_cents: totalCents,
          billing: {
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
            street: form.street,
            city: form.city,
            province: form.province,
            postalCode: form.postalCode,
          },
        });
        if (qrError || !qrData?.qr_image_url) {
          setErrors({
            payment: qrError?.message ?? "Could not generate QR. Try another payment method or try again.",
          });
          setLoading(false);
          return;
        }
        setQrPhStep({ qrImageUrl: qrData.qr_image_url, orderId: order.id, purchasedLines });
        setLoading(false);
        return;
      }

      await removeLines(purchasedLines);
      navigate("/order-success", { state: { paymentMethod: payment } });
    } finally {
      setLoading(false);
    }
  }

  if (qrPhStep) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-6 py-8 max-w-md text-center">
          <div className="flex items-center justify-center gap-0.5 text-3xl font-bold tracking-tight">
            <span className="text-red-600">QR</span>
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mt-1" aria-hidden />
            <span className="text-blue-600">Ph</span>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mt-1 ml-0.5" aria-hidden />
          </div>
          <p className="mt-2 text-xl font-bold text-black">SCAN NA ALL!</p>
          <div className="mt-3 inline-block rounded-lg bg-amber-400 px-4 py-1.5">
            <span className="text-sm font-bold text-black">NO FEES</span>
          </div>

          <div className="mt-8 rounded-2xl bg-gray-100 p-6 inline-block">
            <p className="text-sm font-medium text-gray-700 mb-3">Christmas Decors PH</p>
            <img
              src={qrPhStep.qrImageUrl}
              alt="Scan to pay with QR Ph"
              className="w-56 h-56 mx-auto bg-white rounded-lg p-2"
            />
            <p className="mt-4 text-sm text-gray-600 italic">Basta kaya i-scan, pwede yan!</p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-blue-100 p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center text-blue-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-800">BANKS</span>
            </div>
            <div className="rounded-xl bg-red-100 p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-red-200 flex items-center justify-center text-red-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-800">E-WALLETS</span>
            </div>
            <div className="rounded-xl bg-green-100 p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-green-200 flex items-center justify-center text-green-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-800">AND MORE</span>
            </div>
          </div>

          <p className="mt-8 text-xs text-gray-500">
            Powered by <span className="font-semibold text-teal-700">paymongo</span>
          </p>

          <p className="mt-6 text-sm font-medium text-gray-800">
            Waiting for payment confirmation from PayMongo…
          </p>
          <p className="mt-2 text-xs text-gray-500">
            This page updates automatically when your payment is received. You can keep it open after you pay.
          </p>
          {qrPaymentHint && (
            <p className="mt-3 text-xs text-gray-600 max-w-sm mx-auto">{qrPaymentHint}</p>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-12">
        <h1 className="font-display text-2xl font-semibold text-foreground">Checkout</h1>

        {errors.payment && (
          <div className="mt-4 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3">
            <p className="text-sm text-destructive">{errors.payment}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">

            {/* Contact info */}
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">Contact information</h2>
              <Field label="Full name" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Juan dela Cruz"
                  className={inputCls(!!errors.name)}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Email address" error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="juan@example.com"
                    className={inputCls(!!errors.email)}
                  />
                </Field>
                <Field label="Phone number" error={errors.phone}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    className={inputCls(!!errors.phone)}
                  />
                </Field>
              </div>
            </div>

            {/* Shipping address */}
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">Shipping address</h2>
              <Field label="Street address / Barangay" error={errors.street}>
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  placeholder="123 Sampaguita St., Brgy. Masaya"
                  className={inputCls(!!errors.street)}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="City / Municipality" error={errors.city}>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Quezon City"
                    className={inputCls(!!errors.city)}
                  />
                </Field>
                <Field label="Postal code" error={errors.postalCode}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={form.postalCode}
                    onChange={(e) => handleChange("postalCode", e.target.value.replace(/\D/g, ""))}
                    placeholder="1100"
                    className={inputCls(!!errors.postalCode)}
                  />
                </Field>
              </div>
              <Field label="Province" error={errors.province}>
                <select
                  value={form.province}
                  onChange={(e) => handleChange("province", e.target.value)}
                  className={inputCls(!!errors.province)}
                >
                  <option value="">— Select province —</option>
                  {PH_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Payment method */}
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">Payment method</h2>
              {payment === "qrph" && (
                <p className="text-xs text-muted-foreground rounded-md border border-border bg-muted/40 px-3 py-2">
                  After you place the order, you&apos;ll see a <strong>QR Ph</strong> code on the next screen — scan it with your
                  bank or e-wallet app to pay (live PayMongo / QR Ph).
                </p>
              )}
              <div className="space-y-2">
                {paymentMethods.map((m) => (
                  <label
                    key={m.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      payment === m.value
                        ? "border-accent bg-accent/5"
                        : "border-border bg-muted/30 hover:bg-muted/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={m.value}
                      checked={payment === m.value}
                      onChange={() => setPayment(m.value)}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? "Processing…" : "Place order"}
            </button>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-muted p-6 lg:sticky lg:top-28">
              <h2 className="font-display text-lg font-semibold text-foreground">Order summary</h2>
              <div className="mt-4 space-y-4">
                {checkoutItems.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-3">
                    <img
                      src={getProductImage(item.product.id)}
                      alt={item.product.name}
                      className="h-14 w-14 rounded-md object-cover image-outline shrink-0"
                    />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-foreground">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.size} × {item.quantity}</p>
                    </div>
                    <span className="font-mono-price text-sm text-foreground">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-foreground/10 pt-4 flex justify-between">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-mono-price text-lg font-semibold text-foreground">{formatPrice(checkoutSubtotal)}</span>
              </div>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
