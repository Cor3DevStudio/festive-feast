import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Store,
  MessageCircle,
  Ticket,
  Truck,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart, type CartItem } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import { getProductImage } from "@/data/productImages";
import { cartLineKey } from "@/lib/cartLineKey";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const STORE = {
  name: "Christmas Decors PH",
  tag: "Preferred",
};

function CartPageContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    items,
    removeItem,
    updateQuantity,
    addItem,
    cartLoading,
  } = useCart();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Keep selection in sync when cart rows change (quantity sync, new lines default selected)
  useEffect(() => {
    const valid = new Set(items.map((i) => cartLineKey(i.product.id, i.size)));
    setSelected((prev) => {
      const next = new Set<string>();
      for (const k of prev) {
        if (valid.has(k)) next.add(k);
      }
      for (const k of valid) {
        if (!prev.has(k)) next.add(k);
      }
      return next;
    });
  }, [items]);

  const allKeys = useMemo(
    () => items.map((i) => cartLineKey(i.product.id, i.size)),
    [items]
  );

  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k));

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allKeys));
    }
  }, [allSelected, allKeys]);

  const toggleLine = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectedItems = useMemo(
    () => items.filter((i) => selected.has(cartLineKey(i.product.id, i.size))),
    [items, selected]
  );

  const selectedSubtotal = useMemo(
    () => selectedItems.reduce((s, i) => s + i.product.price * i.quantity, 0),
    [selectedItems]
  );

  const selectedQty = useMemo(
    () => selectedItems.reduce((s, i) => s + i.quantity, 0),
    [selectedItems]
  );

  const handleSizeChange = async (item: CartItem, newSize: string) => {
    if (newSize === item.size) return;
    const existing = items.find(
      (i) => i.product.id === item.product.id && i.size === newSize
    );
    const qty = item.quantity;
    await removeItem(item.product.id, item.size);
    if (existing) {
      await updateQuantity(item.product.id, newSize, existing.quantity + qty);
    } else {
      await addItem(item.product, newSize, qty);
    }
  };

  const goCheckout = () => {
    if (selected.size === 0) {
      toast({
        title: "Select items to checkout",
        description: "Tick the boxes next to the products you want to buy.",
        variant: "destructive",
      });
      return;
    }
    navigate("/checkout", {
      state: { lineKeys: Array.from(selected) },
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20 sm:pb-0">
      <Header />

      <main className="container mx-auto max-w-6xl px-3 py-6 sm:px-6">
        <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
          My purchase
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.reduce((s, i) => s + i.quantity, 0)} item(s) in your cart
        </p>

        {/* Table header — desktop */}
        <div className="mt-6 hidden rounded-t-lg border border-b-0 border-border bg-white px-4 py-3 text-xs font-medium text-muted-foreground lg:grid lg:grid-cols-[40px_1fr_100px_140px_100px_88px] lg:gap-3 lg:px-6">
          <div className="flex items-center justify-center">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              aria-label="Select all products"
            />
          </div>
          <div className="pl-2">Product</div>
          <div className="text-center">Unit price</div>
          <div className="text-center">Quantity</div>
          <div className="text-right">Total price</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Shop block */}
        <section
          className={`overflow-hidden border border-border bg-white shadow-sm ${
            items.length > 0 ? "lg:rounded-b-lg lg:border-t-0" : "rounded-lg"
          }`}
        >
          {/* Shop row */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/80 bg-white px-3 py-3 sm:px-4 lg:px-6">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              aria-label="Select all from this shop"
              className="shrink-0"
            />
            <Store className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-foreground">{STORE.name}</span>
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orange-700">
              {STORE.tag}
            </span>
            <Link
              to="/contact"
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Chat
            </Link>
          </div>

          {/* Promo strip */}
          <Link
            to="/shop"
            className="flex items-center justify-between gap-2 border-b border-orange-100 bg-orange-50/90 px-3 py-2 text-xs text-orange-900 sm:px-6"
          >
            <span className="flex items-center gap-1.5">
              <span className="font-semibold">Bundle:</span>
              Add more décor & lights — unlock festive savings on your order
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
          </Link>

          {/* Line items */}
          <div className="divide-y divide-border/80">
            {items.map((item) => {
              const key = cartLineKey(item.product.id, item.size);
              const lineTotal = item.product.price * item.quantity;
              const img = getProductImage(item.product.id);
              const isLineSelected = selected.has(key);

              return (
                <div key={key}>
                  {/* Mobile card */}
                  <div className="flex gap-3 p-3 sm:p-4 lg:hidden">
                    <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
                      <Checkbox
                        checked={isLineSelected}
                        onCheckedChange={() => toggleLine(key)}
                        aria-label={`Select ${item.product.name}`}
                      />
                      <Link to={`/product/${item.product.slug}`} className="shrink-0">
                        <img
                          src={img}
                          alt=""
                          className="h-20 w-20 rounded border border-border/60 object-cover"
                        />
                      </Link>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Link
                        to={`/product/${item.product.slug}`}
                        className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:text-primary"
                      >
                        {item.product.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Variation:</span>
                        <Select
                          value={item.size}
                          onValueChange={(v) => void handleSizeChange(item, v)}
                        >
                          <SelectTrigger className="h-8 w-[min(100%,220px)] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {item.product.sizes.map((sz) => (
                              <SelectItem key={sz} value={sz}>
                                {sz}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Unit</span>
                        <span className="font-mono-price">{formatPrice(item.product.price)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded border border-border bg-white">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-muted disabled:opacity-40"
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              updateQuantity(item.product.id, item.size, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-muted"
                            onClick={() =>
                              updateQuantity(item.product.id, item.size, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="font-mono-price text-base font-semibold text-orange-600">
                          {formatPrice(lineTotal)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => removeItem(item.product.id, item.size)}
                        >
                          Delete
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
                            >
                              Find similar
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem asChild>
                              <Link to={`/shop?category=${item.product.category}`}>
                                Same category
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/shop">Browse shop</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Desktop row */}
                  <div className="hidden grid-cols-[40px_1fr_100px_140px_100px_88px] items-center gap-3 px-6 py-4 lg:grid">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={isLineSelected}
                        onCheckedChange={() => toggleLine(key)}
                        aria-label={`Select ${item.product.name}`}
                      />
                    </div>
                    <div className="flex min-w-0 gap-3 pl-2">
                      <Link to={`/product/${item.product.slug}`} className="shrink-0">
                        <img
                          src={img}
                          alt=""
                          className="h-16 w-16 rounded border border-border/60 object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1 space-y-2">
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:text-primary"
                        >
                          {item.product.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Variation</span>
                          <Select
                            value={item.size}
                            onValueChange={(v) => void handleSizeChange(item, v)}
                          >
                            <SelectTrigger className="h-8 max-w-[220px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {item.product.sizes.map((sz) => (
                                <SelectItem key={sz} value={sz}>
                                  {sz}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="font-mono-price text-sm text-foreground">
                        {formatPrice(item.product.price)}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <div className="inline-flex items-center rounded border border-border bg-white">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center hover:bg-muted disabled:opacity-40"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(item.product.id, item.size, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center hover:bg-muted"
                          onClick={() =>
                            updateQuantity(item.product.id, item.size, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono-price text-sm font-semibold text-orange-600">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => removeItem(item.product.id, item.size)}
                      >
                        Delete
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
                          >
                            Find similar
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          <DropdownMenuItem asChild>
                            <Link to={`/shop?category=${item.product.category}`}>
                              Same category
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/shop">Browse shop</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shop footer tools */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border/80 bg-muted/20 px-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                disabled
                title="Coming soon"
              >
                <Ticket className="h-4 w-4" />
                Add shop voucher code
              </button>
              <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Truck className="h-4 w-4 shrink-0 text-primary" />
                <span>Standard shipping — rates calculated at checkout</span>
              </div>
            </div>
          )}
        </section>

        {/* Voucher + coins row (decorative) */}
        {items.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-dashed border-border bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">
              Platform voucher:{" "}
              <button type="button" className="font-medium text-primary hover:underline" disabled>
                Select or enter code
              </button>
            </span>
            <span className="text-xs text-muted-foreground">Loyalty rewards — coming soon</span>
          </div>
        )}

        {/* Summary (desktop/tablet) */}
        {items.length > 0 && (
          <div className="mt-6 flex items-center justify-end gap-6 rounded-lg border border-border bg-white px-6 py-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Merchandise subtotal ({selectedQty} items)</p>
              <p className="font-mono-price text-lg font-semibold text-orange-600">
                {formatPrice(selectedSubtotal)}
              </p>
            </div>
            <Button size="lg" className="min-w-[160px] bg-orange-600 hover:bg-orange-700" onClick={goCheckout}>
              Check out ({selectedQty})
            </Button>
          </div>
        )}
      </main>

      {/* Sticky bottom bar (mobile only) */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur supports-[padding:max(0px)]:pb-[max(12px,env(safe-area-inset-bottom))] sm:hidden">
          <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <Checkbox
                id="sticky-select-all"
                checked={allSelected}
                onCheckedChange={toggleAll}
              />
              <label htmlFor="sticky-select-all" className="text-sm text-foreground cursor-pointer">
                Select all
                <span className="text-muted-foreground"> ({items.length})</span>
              </label>
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                  Total ({selectedQty} items)
                </p>
                <p className="font-mono-price text-lg font-bold text-orange-600 sm:text-xl">
                  {formatPrice(selectedSubtotal)}
                </p>
              </div>
              <Button
                size="lg"
                className="bg-orange-600 px-6 hover:bg-orange-700 sm:min-w-[140px]"
                onClick={goCheckout}
              >
                Check out
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function CartPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { items, cartLoading } = useCart();

  if (!authLoading && isAuthenticated && cartLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header />
        <main className="container mx-auto px-6 py-20 text-center">
          <p className="text-muted-foreground">Loading your cart…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">Sign in to view your cart</h1>
          <p className="mt-2 text-muted-foreground">Your cart is saved to your account when you log in.</p>
          <Link
            to="/login?returnTo=/cart"
            className="mt-6 inline-block rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Log in
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0 && !cartLoading) {
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

  return <CartPageContent />;
}
