import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/data/products";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface OrderItemLine {
  id: string;
  product_id: string;
  product_name: string | null;
  size: string;
  quantity: number;
  unit_price_cents: number;
}

interface OrderWithLines {
  id: string;
  user_id: string;
  status: string;
  total_cents: number;
  payment_method: string | null;
  shipping_name: string | null;
  shipping_email: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_province: string | null;
  shipping_postal_code: string | null;
  created_at: string;
  order_items: OrderItemLine[] | null;
}

interface ProductDetail {
  id: string;
  name: string;
  category: string;
  materials: string | null;
  dimensions: string | null;
  images: string[] | null;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300";
    case "paid":
      return "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300";
    case "processing":
      return "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300";
    case "shipped":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300";
    case "delivered":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300";
    default:
      return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700/50 dark:text-zinc-300";
  }
}

function AdminOrdersContent() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderWithLines[]>([]);
  const [productMap, setProductMap] = useState<Record<string, ProductDetail>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailOrder, setDetailOrder] = useState<OrderWithLines | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        status,
        total_cents,
        payment_method,
        shipping_name,
        shipping_email,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_province,
        shipping_postal_code,
        created_at,
        order_items (
          id,
          product_id,
          product_name,
          size,
          quantity,
          unit_price_cents
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      toast({ title: "Could not load orders", description: error.message, variant: "destructive" });
      setOrders([]);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as OrderWithLines[];
    setOrders(rows);

    const ids = [...new Set(rows.flatMap((o) => (o.order_items ?? []).map((l) => l.product_id)))];
    if (ids.length > 0) {
      const { data: prods, error: pErr } = await supabase
        .from("products")
        .select("id, name, category, materials, dimensions, images")
        .in("id", ids);
      if (!pErr && prods) {
        const m: Record<string, ProductDetail> = {};
        (prods as ProductDetail[]).forEach((p) => {
          m[p.id] = p;
        });
        setProductMap(m);
      }
    } else {
      setProductMap({});
    }

    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const blob = [
        o.id,
        o.user_id,
        o.shipping_name,
        o.shipping_email,
        o.shipping_phone,
        o.status,
        ...(o.order_items ?? []).map((l) => [l.product_name, l.product_id, l.size].join(" ")),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [orders, search]);

  const card =
    "rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800/90 dark:bg-[#121214]";

  return (
    <>
      <div className={card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Orders</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Customer orders with line items and product details (lantern specs, materials, size).
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, order id, product…"
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none ring-[#f43f5e]/40 focus:border-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading orders…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Items</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-0"> </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const lines = o.order_items ?? [];
                  const itemSummary =
                    lines.length === 0
                      ? "—"
                      : lines
                          .slice(0, 2)
                          .map((l) => `${l.product_name ?? l.product_id} (${l.size})`)
                          .join(", ") + (lines.length > 2 ? ` +${lines.length - 2}` : "");
                  return (
                    <tr key={o.id} className="border-b border-zinc-200/80 dark:border-zinc-800/70">
                      <td className="py-3 pr-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                        {formatDateTime(o.created_at)}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                        {o.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{o.shipping_name ?? "—"}</p>
                        <p className="text-xs text-zinc-500">{o.shipping_email ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4 max-w-[220px] truncate text-zinc-700 dark:text-zinc-300" title={itemSummary}>
                        {itemSummary}
                      </td>
                      <td className="py-3 pr-4 font-mono-price text-zinc-900 dark:text-zinc-100">
                        {formatPrice(o.total_cents / 100)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusTone(o.status))}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 pr-0">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setDetailOrder(o)} className="gap-1">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-500">No orders match your search.</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!detailOrder} onOpenChange={(open) => !open && setDetailOrder(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {detailOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{detailOrder.id.slice(0, 8).toUpperCase()}</DialogTitle>
                <DialogDescription>
                  Placed {formatDateTime(detailOrder.created_at)} · Payment: {detailOrder.payment_method ?? "—"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Customer</h3>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{detailOrder.shipping_name ?? "—"}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{detailOrder.shipping_email ?? "—"}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{detailOrder.shipping_phone ?? "—"}</p>
                  <p className="mt-2 text-xs text-zinc-500">User ID: {detailOrder.user_id}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Ship to</h3>
                  <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                    {[detailOrder.shipping_address, detailOrder.shipping_city, detailOrder.shipping_province]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{detailOrder.shipping_postal_code ?? ""}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Items ordered</h3>
                <ul className="mt-3 space-y-4">
                  {(detailOrder.order_items ?? []).map((line) => {
                    const p = productMap[line.product_id];
                    const img = p?.images?.[0];
                    const lineTotal = ((line.unit_price_cents ?? 0) * (line.quantity ?? 0)) / 100;
                    return (
                      <li
                        key={line.id}
                        className="flex gap-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800/90"
                      >
                        {img ? (
                          <img
                            src={img}
                            alt=""
                            className="h-20 w-20 shrink-0 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-900"
                          />
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-900">
                            No img
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {line.product_name ?? p?.name ?? line.product_id}
                          </p>
                          {p?.category && (
                            <p className="text-xs text-zinc-500">
                              Category: <span className="capitalize">{p.category.replace(/-/g, " ")}</span>
                            </p>
                          )}
                          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                            Size: <strong>{line.size}</strong> · Qty: <strong>{line.quantity}</strong> · Unit:{" "}
                            {formatPrice((line.unit_price_cents ?? 0) / 100)}
                          </p>
                          {(p?.materials || p?.dimensions) && (
                            <div className="mt-2 rounded-lg bg-zinc-50 px-2 py-1.5 text-xs text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
                              {p.materials && <p>Materials: {p.materials}</p>}
                              {p.dimensions && <p>Dimensions: {p.dimensions}</p>}
                            </div>
                          )}
                          <p className="mt-2 font-mono-price text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Line total: {formatPrice(lineTotal)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="border-t border-zinc-200 pt-4 font-mono-price text-lg font-bold text-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
                Order total: {formatPrice(detailOrder.total_cents / 100)}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminShell>
      <AdminOrdersContent />
    </AdminShell>
  );
}
