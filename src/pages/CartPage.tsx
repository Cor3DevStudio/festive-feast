import { Link } from "react-router-dom";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import { getProductImage } from "@/data/productImages";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Add some festive lights or parols from our shop.</p>
          <Link
            to="/shop"
            className="mt-6 inline-block rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Continue shopping
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
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Cart ({items.reduce((s, i) => s + i.quantity, 0)} items)
        </h1>

        <div className="mt-8 space-y-4">
          {items.map((item) => {
            const image = getProductImage(item.product.id);
            return (
              <div
                key={`${item.product.id}-${item.size}`}
                className="flex gap-5 rounded-lg bg-card p-4 shadow-card"
              >
                <img
                  src={image}
                  alt={item.product.name}
                  className="h-24 w-24 shrink-0 rounded-md object-cover image-outline"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link to={`/product/${item.product.slug}`} className="font-medium text-foreground hover:text-primary text-sm">
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.size}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-sm bg-muted text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono-price text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-sm bg-muted text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.product.id, item.size)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="font-mono-price text-sm font-medium text-foreground">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between rounded-lg bg-muted p-6">
          <span className="text-sm font-medium text-foreground">Subtotal</span>
          <span className="font-mono-price text-lg font-semibold text-foreground">{formatPrice(subtotal)}</span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/shop"
            className="rounded-md bg-muted px-6 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            Continue shopping
          </Link>
          <Link
            to="/checkout"
            className="rounded-md bg-primary px-8 py-3 text-center text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Proceed to checkout
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
