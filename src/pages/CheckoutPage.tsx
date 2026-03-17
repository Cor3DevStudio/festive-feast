import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import { getProductImage } from "@/data/productImages";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const paymentMethods = [
  { value: "paymongo", label: "PayMongo (card online)", desc: "Pay with credit/debit card, GCash, Maya, GrabPay via PayMongo." },
  { value: "qrph", label: "QR Ph (scan to pay)", desc: "Scan to pay with your bank or e-wallet." },
  { value: "cod", label: "Cash on delivery", desc: "Pay in cash when you receive your order." },
  { value: "bank", label: "Bank transfer", desc: "We'll send you our bank details after you place the order." },
];

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState("paymongo");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => {
      clearCart();
      navigate("/order-success");
    }, 1500);
  }

  function handleChange(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-12">
        <h1 className="font-display text-2xl font-semibold text-foreground">Checkout</h1>

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
