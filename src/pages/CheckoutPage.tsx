import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import { getProductImage } from "@/data/productImages";
import { supabase } from "@/lib/supabase";
import { createQrPhPayment } from "@/lib/paymongo-qrph";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const paymentMethods = [
  { value: "paymongo", label: "PayMongo (card online)", desc: "Pay with credit/debit card, GCash, Maya, GrabPay via PayMongo." },
  { value: "qrph", label: "QR Ph via PayMongo (scan to pay)", desc: "Scan the QR code with your bank or e-wallet (GCash, Maya, etc.) to pay." },
  { value: "cod", label: "Cash on delivery", desc: "Pay in cash when you receive your order." },
  { value: "bank", label: "Bank transfer", desc: "We'll send you our bank details after you place the order." },
];

export default function CheckoutPage() {
  const { user, session, isAuthenticated, loading: authLoading } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState("paymongo");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qrPhStep, setQrPhStep] = useState<{ qrImageUrl: string; orderId: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login?returnTo=/checkout", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Add some items before checking out.</p>
          <Link
            to="/shop"
            className="mt-6 inline-block rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground"
          >
            Continue shopping
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
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.address.trim()) e.address = "Required";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!user?.id) return;
    setLoading(true);
    try {
      const totalCents = Math.round(subtotal * 100);
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "pending",
          total_cents: totalCents,
          shipping_name: form.name,
          shipping_email: form.email,
          shipping_phone: form.phone,
          shipping_address: form.address,
          payment_method: payment,
        })
        .select("id")
        .single();
      if (orderError || !order) {
        setLoading(false);
        return;
      }
      await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          size: item.size,
          quantity: item.quantity,
          unit_price_cents: Math.round(item.product.price * 100),
        }))
      );

      if (payment === "qrph") {
        if (!session?.access_token) {
          setErrors({
            payment: "Session expired. Please sign in again and retry.",
          });
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
            address: form.address || undefined,
          },
        });
        if (qrError || !qrData?.qr_image_url) {
          setErrors({
            payment: qrError?.message ?? "Could not generate QR Ph. Try another payment method or try again.",
          });
          setLoading(false);
          return;
        }
        await clearCart();
        setQrPhStep({ qrImageUrl: qrData.qr_image_url, orderId: order.id });
        setLoading(false);
        return;
      }

      await clearCart();
      navigate("/order-success");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  }

  if (qrPhStep) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-6 py-8 max-w-md mx-auto text-center">
          {/* QR Ph logo */}
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

          {/* Dynamic QR from PayMongo */}
          <div className="mt-8 rounded-2xl bg-gray-100 p-6 inline-block">
            <p className="text-sm font-medium text-gray-700 mb-3">Christmas Decors PH</p>
            <img
              src={qrPhStep.qrImageUrl}
              alt="Scan to pay with QR Ph"
              className="w-56 h-56 mx-auto bg-white rounded-lg p-2"
            />
            <p className="mt-4 text-sm text-gray-600 italic">
              Basta kaya i-scan, pwede yan!
            </p>
          </div>

          {/* Payment options */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-blue-100 p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center text-blue-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <span className="text-xs font-semibold text-gray-800">BANKS</span>
            </div>
            <div className="rounded-xl bg-red-100 p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-red-200 flex items-center justify-center text-red-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <span className="text-xs font-semibold text-gray-800">E-WALLETS</span>
            </div>
            <div className="rounded-xl bg-green-100 p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-green-200 flex items-center justify-center text-green-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-xs font-semibold text-gray-800">AND MORE</span>
            </div>
          </div>

          <p className="mt-8 text-xs text-gray-500">
            Powered by <span className="font-semibold text-teal-700">paymongo</span>
          </p>

          <Link
            to="/order-success"
            className="mt-6 inline-block rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground"
          >
            I&apos;ve paid — continue
          </Link>
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
          <p className="mt-2 text-sm text-destructive">{errors.payment}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="font-display text-lg font-semibold text-foreground">Shipping & billing</h2>

            {(["name", "email", "phone", "address"] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-foreground capitalize">{field === "name" ? "Full name" : field}</label>
                <input
                  type={field === "email" ? "email" : "text"}
                  value={form[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  placeholder={
                    field === "name" ? "Juan dela Cruz" :
                    field === "email" ? "juan@example.com" :
                    field === "phone" ? "+63 9XX XXX XXXX" :
                    "Street, Barangay, City, Postal code"
                  }
                  className={`mt-1.5 w-full rounded-md bg-muted px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-accent ring-offset-2 ${
                    errors[field] ? "ring-2 ring-destructive" : ""
                  }`}
                />
                {errors[field] && <p className="mt-1 text-xs text-destructive">{errors[field]}</p>}
              </div>
            ))}

            {/* Payment */}
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">Payment method</h2>
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                className="mt-3 w-full rounded-md bg-muted px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent ring-offset-2"
              >
                {paymentMethods.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                {paymentMethods.find((m) => m.value === payment)?.desc}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? "Processing…" : "Place order"}
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-muted p-6 lg:sticky lg:top-28">
              <h2 className="font-display text-lg font-semibold text-foreground">Order summary</h2>
              <div className="mt-4 space-y-4">
                {items.map((item) => (
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
                <span className="font-mono-price text-lg font-semibold text-foreground">{formatPrice(subtotal)}</span>
              </div>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
