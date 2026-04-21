import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/data/products";
import { useProducts } from "@/context/ProductsContext";
import { getProductDisplayImageUrlById } from "@/lib/productDisplayImage";
import AccountLayout from "@/components/account/AccountLayout";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
}

interface Order {
  id: string;
  status: string;
  total_cents: number;
  payment_method: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  shipping_postal_code: string;
  created_at: string;
  order_items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:    { label: "Pending",    className: "bg-amber-100 text-amber-800" },
  paid:       { label: "Paid",       className: "bg-blue-100 text-blue-800" },
  processing: { label: "Processing", className: "bg-purple-100 text-purple-800" },
  shipped:    { label: "Shipped",    className: "bg-cyan-100 text-cyan-800" },
  delivered:  { label: "Delivered",  className: "bg-green-100 text-green-800" },
  cancelled:  { label: "Cancelled",  className: "bg-red-100 text-red-800" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "To pay" },
  { id: "paid", label: "Paid" },
  { id: "processing", label: "To ship" },
  { id: "shipped", label: "To receive" },
  { id: "delivered", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
] as const;

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function PaymentLabel({ method }: { method: string }) {
  const labels: Record<string, string> = {
    qrph: "QR Ph",
    paymongo: "PayMongo",
    cod: "Cash on delivery",
    bank: "Bank transfer",
  };
  return <span>{labels[method] ?? method}</span>;
}

export default function AccountOrdersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { getProductById } = useProducts();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login?returnTo=/account/orders", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return orders;
    return orders.filter((o) => o.status === activeFilter);
  }, [orders, activeFilter]);

  if (authLoading || !isAuthenticated) {
    return (
      <AccountLayout>
        <p className="text-muted-foreground">Loading…</p>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="max-w-4xl">
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-white px-5 py-4 shadow-sm">
          <Package className="h-6 w-6 text-orange-600" />
          <h1 className="text-lg font-semibold text-foreground">My purchase</h1>
        </div>

        <div className="mb-6 overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
          <div className="flex min-w-max items-center gap-2 px-3 py-3 sm:px-4">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                  activeFilter === f.id
                    ? "bg-orange-600 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg bg-muted animate-pulse h-24" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
              {orders.length === 0 ? "No orders yet" : "No orders in this tab"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {orders.length === 0
                ? "When you place an order, it will appear here."
                : "Try another tab to view your other purchases."}
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-block rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="max-h-[460px] space-y-4 overflow-y-auto pr-1">
            {filteredOrders.map((order) => {
              const date = new Date(order.created_at).toLocaleDateString("en-PH", {
                year: "numeric", month: "long", day: "numeric",
              });
              const isOpen = expanded === order.id;
              const firstItem = order.order_items[0];
              const firstImage = firstItem
                ? getProductDisplayImageUrlById(firstItem.product_id, getProductById)
                : null;
              const totalLineQty = order.order_items.reduce((sum, i) => sum + i.quantity, 0);
              const extraItemsCount = Math.max(0, order.order_items.length - 1);

              return (
                <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Header row */}
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-md border border-border/60 object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 shrink-0 rounded-md border border-border/60 bg-muted" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {firstItem?.product_name ?? "Order item"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {firstItem ? `${firstItem.size} × ${firstItem.quantity}` : "No items"}
                          {extraItemsCount > 0 ? `, +${extraItemsCount} more item${extraItemsCount > 1 ? "s" : ""}` : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono text-muted-foreground">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-muted-foreground">{date}</span>
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <p className="font-mono-price text-sm font-semibold text-foreground">
                        {formatPrice(order.total_cents / 100)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{totalLineQty} item(s)</p>
                      </div>
                      {isOpen
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t border-border px-5 py-5 space-y-5">
                      {/* Items */}
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Items</h3>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-foreground">
                                {item.product_name}
                                <span className="ml-2 text-muted-foreground text-xs">{item.size} × {item.quantity}</span>
                              </span>
                              <span className="font-mono-price text-foreground">
                                {formatPrice((item.unit_price_cents * item.quantity) / 100)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-semibold">
                          <span>Total</span>
                          <span className="font-mono-price">{formatPrice(order.total_cents / 100)}</span>
                        </div>
                      </div>

                      {/* Shipping & payment */}
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Ship to</h3>
                          <p className="text-foreground font-medium">{order.shipping_name}</p>
                          <p className="text-muted-foreground">{order.shipping_address}</p>
                          {order.shipping_city && (
                            <p className="text-muted-foreground">
                              {order.shipping_city}{order.shipping_province ? `, ${order.shipping_province}` : ""}
                              {order.shipping_postal_code ? ` ${order.shipping_postal_code}` : ""}
                            </p>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment</h3>
                          <p className="text-foreground"><PaymentLabel method={order.payment_method} /></p>
                          <p className="text-muted-foreground mt-0.5">
                            {order.status === "paid" || order.status === "shipped" || order.status === "delivered"
                              ? "Payment confirmed"
                              : order.status === "pending"
                              ? "Awaiting payment"
                              : order.status === "cancelled"
                              ? "Order cancelled"
                              : "Processing"}
                          </p>
                        </div>
                      </div>

                      {/* Status guidance */}
                      {(order.status === "pending" && order.payment_method === "bank") && (
                        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                          We will send you our bank details shortly at <strong>{order.shipping_name}</strong>'s email. Please complete payment within 24 hours.
                        </div>
                      )}
                      {order.status === "shipped" && (
                        <div className="rounded-md bg-cyan-50 border border-cyan-200 px-4 py-3 text-sm text-cyan-800">
                          Your order is on its way! We'll notify you once it's delivered.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
