import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Activity, BarChart3, LayoutDashboard, Users } from "lucide-react";
import { AdminDashboardOverview } from "@/components/admin/AdminDashboardOverview";
import { AdminShell } from "@/components/admin/AdminShell";
import type { AdminTab } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/data/products";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ProfileRow {
  id: string;
  full_name: string | null;
  username: string | null;
  is_admin: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  total_cents: number;
  payment_method: string | null;
  shipping_name: string | null;
  shipping_province: string | null;
  created_at: string;
}

interface OrderItemRow {
  product_id: string;
  product_name: string | null;
  quantity: number;
}

interface ProductRow {
  id: string;
  name: string;
  category: string;
  in_stock: boolean;
}

interface AuditRow {
  id: string;
  at: string;
  event: string;
  target: string;
  detail: string;
}

const FULFILLMENT_STATUSES = new Set(["paid", "processing", "shipped", "delivered"]);
const ALL_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;

type OverviewDatePreset = "7d" | "30d" | "90d" | "all";

function getOverviewCutoffMs(preset: OverviewDatePreset): number | null {
  if (preset === "7d") return Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (preset === "30d") return Date.now() - 30 * 24 * 60 * 60 * 1000;
  if (preset === "90d") return Date.now() - 90 * 24 * 60 * 60 * 1000;
  return null;
}

function buildOverviewRevenueSeries(
  orders: OrderRow[],
  preset: OverviewDatePreset,
): { label: string; revenue: number }[] {
  const fulfilled = orders.filter((o) => FULFILLMENT_STATUSES.has(o.status));
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (preset === "7d") {
    const out: { label: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const cents = fulfilled
        .filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= start && t < end;
        })
        .reduce((s, o) => s + o.total_cents, 0);
      out.push({
        label: d.toLocaleDateString("en-PH", { weekday: "short" }),
        revenue: cents / 100,
      });
    }
    return out;
  }

  if (preset === "30d") {
    const out: { label: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const cents = fulfilled
        .filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= start && t < end;
        })
        .reduce((s, o) => s + o.total_cents, 0);
      out.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        revenue: cents / 100,
      });
    }
    return out;
  }

  if (preset === "90d") {
    const out: { label: string; revenue: number }[] = [];
    for (let w = 12; w >= 0; w--) {
      const end = new Date(now);
      end.setDate(end.getDate() - (12 - w) * 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const t0 = start.getTime();
      const t1 = end.getTime() + 1;
      const cents = fulfilled
        .filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= t0 && t < t1;
        })
        .reduce((s, o) => s + o.total_cents, 0);
      out.push({
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        revenue: cents / 100,
      });
    }
    return out;
  }

  const map = new Map<string, number>();
  fulfilled.forEach((o) => {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + o.total_cents);
  });
  const out: { label: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cents = map.get(key) ?? 0;
    out.push({
      label: d.toLocaleString("en", { month: "short" }),
      revenue: cents / 100,
    });
  }
  return out;
}

function buildOverviewOrdersByDay(
  orders: OrderRow[],
  preset: OverviewDatePreset,
): { label: string; orders: number }[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (preset === "7d" || preset === "all") {
    const days: { label: string; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const count = orders.filter((o) => {
        const t = new Date(o.created_at).getTime();
        return t >= start && t < end;
      }).length;
      days.push({ label: d.toLocaleDateString("en-PH", { weekday: "short" }), orders: count });
    }
    return days;
  }

  if (preset === "30d") {
    const days: { label: string; orders: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 2);
      const start = d.getTime();
      const end = start + 2 * 24 * 60 * 60 * 1000;
      const count = orders.filter((o) => {
        const t = new Date(o.created_at).getTime();
        return t >= start && t < end;
      }).length;
      days.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        orders: count,
      });
    }
    return days;
  }

  const days: { label: string; orders: number }[] = [];
  for (let w = 12; w >= 0; w--) {
    const end = new Date(now);
    end.setDate(end.getDate() - (12 - w) * 7);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const t0 = start.getTime();
    const t1 = end.getTime() + 1;
    const count = orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= t0 && t < t1;
    }).length;
    days.push({
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      orders: count,
    });
  }
  return days;
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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function adminStatusTone(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    case "paid":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300";
    case "processing":
      return "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300";
    case "shipped":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300";
    case "delivered":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
    default:
      return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300";
  }
}

function AdminDashboardContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const activeTab: AdminTab = useMemo(() => {
    const t = searchParams.get("tab");
    if (t === "users" || t === "analytics" || t === "audit" || t === "overview") return t;
    return "overview";
  }, [searchParams]);

  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [usersQueryError, setUsersQueryError] = useState<string | null>(null);
  const [savingRoleUserId, setSavingRoleUserId] = useState<string | null>(null);
  const [usersSearch, setUsersSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditEventFilter, setAuditEventFilter] = useState<"all" | "USER_CREATED" | "ORDER_CREATED">("all");
  const [overviewDatePreset, setOverviewDatePreset] = useState<OverviewDatePreset>("30d");

  const fetchDashboardData = useCallback(async () => {
    setUsersQueryError(null);

    const ordersPromise = supabase
      .from("orders")
      .select("id, user_id, status, total_cents, payment_method, shipping_name, shipping_province, created_at")
      .order("created_at", { ascending: false });
    const orderItemsPromise = supabase
      .from("order_items")
      .select("product_id, product_name, quantity");
    const productsPromise = supabase
      .from("products")
      .select("id, name, category, in_stock");

    const primaryUsersRes = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
    const ordersRes = await ordersPromise;
    const orderItemsRes = await orderItemsPromise;
    const productsRes = await productsPromise;

    let userRows: ProfileRow[] = ((primaryUsersRes.data ?? []) as Array<Partial<ProfileRow>>).map((row) => ({
      id: String(row.id ?? ""),
      full_name: row.full_name ?? null,
      username: row.username ?? null,
      is_admin: row.is_admin === true,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
    }));
    let usersErrorMessage: string | null = primaryUsersRes.error?.message ?? null;

    if (usersErrorMessage) {
      setUsers([]);
      setUsersQueryError(usersErrorMessage);
    } else {
      setUsers(userRows);
    }

    if (ordersRes.error) {
      toast({
        title: "Failed to load orders",
        description: ordersRes.error.message,
        variant: "destructive",
      });
      setOrders([]);
    } else {
      setOrders((ordersRes.data as OrderRow[]) ?? []);
    }

    if (orderItemsRes.error) {
      toast({
        title: "Failed to load order items",
        description: orderItemsRes.error.message,
        variant: "destructive",
      });
      setOrderItems([]);
    } else {
      setOrderItems((orderItemsRes.data as OrderItemRow[]) ?? []);
    }

    if (productsRes.error) {
      toast({
        title: "Failed to load products",
        description: productsRes.error.message,
        variant: "destructive",
      });
      setProducts([]);
    } else {
      setProducts((productsRes.data as ProductRow[]) ?? []);
    }

  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  async function toggleAdminRole(targetUserId: string, nextIsAdmin: boolean) {
    setSavingRoleUserId(targetUserId);
    const { error } = await supabase.from("profiles").update({ is_admin: nextIsAdmin }).eq("id", targetUserId);

    if (error) {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setUsers((prev) => prev.map((u) => (u.id === targetUserId ? { ...u, is_admin: nextIsAdmin } : u)));
      toast({ title: `Role updated: ${nextIsAdmin ? "Admin" : "User"}` });
    }
    setSavingRoleUserId(null);
  }

  const totalUsers = users.length;
  const totalOrders = orders.length;
  const totalRevenueCents = orders
    .filter((o) => FULFILLMENT_STATUSES.has(o.status))
    .reduce((sum, o) => sum + o.total_cents, 0);

  const cutoff7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cutoff14 = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const ordersLast7Days = orders.filter((o) => new Date(o.created_at).getTime() >= cutoff7).length;
  const ordersPrev7Days = orders.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return t >= cutoff14 && t < cutoff7;
  }).length;
  const usersLast30Days = users.filter((u) => new Date(u.created_at ?? 0).getTime() >= cutoff30).length;

  const ordersByUserId = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      map.set(o.user_id, (map.get(o.user_id) ?? 0) + 1);
    });
    return map;
  }, [orders]);

  const overviewCutoffMs = useMemo(() => getOverviewCutoffMs(overviewDatePreset), [overviewDatePreset]);

  const overviewOrders = useMemo(() => {
    const c = overviewCutoffMs;
    if (c == null) return orders;
    return orders.filter((o) => new Date(o.created_at).getTime() >= c);
  }, [orders, overviewCutoffMs]);

  const overviewUsersInPeriod = useMemo(() => {
    const c = overviewCutoffMs;
    if (c == null) return users;
    return users.filter((u) => new Date(u.created_at ?? 0).getTime() >= c);
  }, [users, overviewCutoffMs]);

  const overviewRevenueSeries = useMemo(
    () => buildOverviewRevenueSeries(overviewOrders, overviewDatePreset),
    [overviewOrders, overviewDatePreset],
  );

  const overviewOrdersByDay = useMemo(
    () => buildOverviewOrdersByDay(overviewOrders, overviewDatePreset),
    [overviewOrders, overviewDatePreset],
  );

  const overviewTopProvinces = useMemo(() => {
    const m = new Map<string, number>();
    overviewOrders.forEach((o) => {
      const p = (o.shipping_province ?? "").trim() || "Unknown";
      m.set(p, (m.get(p) ?? 0) + 1);
    });
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [overviewOrders]);

  const overviewOrdersByUserId = useMemo(() => {
    const map = new Map<string, number>();
    overviewOrders.forEach((o) => {
      map.set(o.user_id, (map.get(o.user_id) ?? 0) + 1);
    });
    return map;
  }, [overviewOrders]);

  const overviewNewVsReturning = useMemo(() => {
    const single = users.filter((u) => (overviewOrdersByUserId.get(u.id) ?? 0) === 1).length;
    const multi = users.filter((u) => (overviewOrdersByUserId.get(u.id) ?? 0) > 1).length;
    const none = users.filter((u) => (overviewOrdersByUserId.get(u.id) ?? 0) === 0).length;
    const arr = [
      { name: "Single order", value: single },
      { name: "Repeat buyers", value: multi },
      { name: "No orders yet", value: none },
    ].filter((x) => x.value > 0);
    return arr.length ? arr : [{ name: "No activity", value: 1 }];
  }, [users, overviewOrdersByUserId]);

  const overviewPaymentMix = useMemo(() => {
    const m = new Map<string, number>();
    overviewOrders.forEach((o) => {
      const pm = (o.payment_method ?? "Unspecified").trim() || "Unspecified";
      m.set(pm, (m.get(pm) ?? 0) + 1);
    });
    const arr = Array.from(m.entries()).map(([name, value]) => ({ name, value }));
    return arr.length ? arr : [{ name: "No orders", value: 1 }];
  }, [overviewOrders]);

  const overviewTotalRevenueCents = useMemo(
    () =>
      overviewOrders
        .filter((o) => FULFILLMENT_STATUSES.has(o.status))
        .reduce((sum, o) => sum + o.total_cents, 0),
    [overviewOrders],
  );

  const overviewUniqueBuyers = useMemo(
    () => new Set(overviewOrders.map((o) => o.user_id)).size,
    [overviewOrders],
  );

  const overviewOrdersLast7Days = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return overviewOrders.filter((o) => new Date(o.created_at).getTime() >= cutoff).length;
  }, [overviewOrders]);

  const overviewOrdersPrev7Days = useMemo(() => {
    const cutoff7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const cutoff14 = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return overviewOrders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= cutoff14 && t < cutoff7;
    }).length;
  }, [overviewOrders]);

  const overviewRevenueTrendHint = useMemo(() => {
    if (overviewDatePreset === "7d") return "Daily revenue (last 7 days)";
    if (overviewDatePreset === "30d") return "Daily revenue (last 30 days)";
    if (overviewDatePreset === "90d") return "Weekly revenue (last 12 weeks)";
    return "Monthly revenue (last 12 months)";
  }, [overviewDatePreset]);

  const overviewOrdersBarCaption = useMemo(() => {
    if (overviewDatePreset === "30d") return "Orders (2-day buckets)";
    if (overviewDatePreset === "90d") return "Orders per week";
    return "Orders per day";
  }, [overviewDatePreset]);

  const overviewUsersMetricSubtitle = useMemo(() => {
    if (overviewDatePreset === "all") return "New profiles in the last 30 days";
    if (overviewDatePreset === "7d") return "New profiles in the selected range";
    if (overviewDatePreset === "30d") return "New profiles in the selected range";
    return "New profiles in the selected range";
  }, [overviewDatePreset]);

  const overviewRightColumnUsers = overviewDatePreset === "all" ? usersLast30Days : overviewUsersInPeriod.length;

  const filteredUsers = useMemo(() => {
    const q = usersSearch.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = !q || [u.full_name, u.username, u.id].some((v) => (v ?? "").toLowerCase().includes(q));
      const matchesRole =
        userRoleFilter === "all" ? true : userRoleFilter === "admin" ? u.is_admin : !u.is_admin;
      return matchesQuery && matchesRole;
    });
  }, [usersSearch, userRoleFilter, users]);

  const statusCounts = useMemo(
    () =>
      ALL_STATUSES.map((status) => ({
        status,
        count: orders.filter((o) => o.status === status).length,
      })),
    [orders],
  );

  const auditRows = useMemo<AuditRow[]>(() => {
    const userEvents: AuditRow[] = users.map((u) => ({
      id: `user-${u.id}`,
      at: u.created_at ?? "",
      event: "USER_CREATED",
      target: u.full_name || u.username || u.id.slice(0, 8),
      detail: u.is_admin ? "Created with admin access" : "Standard customer profile",
    }));

    const orderEvents: AuditRow[] = orders.map((o) => ({
      id: `order-${o.id}`,
      at: o.created_at,
      event: "ORDER_CREATED",
      target: `#${o.id.slice(0, 8).toUpperCase()}`,
      detail: `Status: ${o.status} • ${formatPrice(o.total_cents / 100)}`,
    }));

    return [...userEvents, ...orderEvents]
      .filter((e) => !!e.at)
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 80);
  }, [orders, users]);

  const filteredAuditRows = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditRows.filter((row) => {
      const matchesQuery =
        !q ||
        [row.event, row.target, row.detail, formatDateTime(row.at)]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesEvent = auditEventFilter === "all" ? true : row.event === auditEventFilter;
      return matchesQuery && matchesEvent;
    });
  }, [auditEventFilter, auditRows, auditSearch]);

  const revenueByMonth = useMemo(() => {
    const months = new Map<string, number>();
    orders
      .filter((o) => FULFILLMENT_STATUSES.has(o.status))
      .forEach((o) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months.set(key, (months.get(key) ?? 0) + o.total_cents);
      });

    return Array.from(months.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 6);
  }, [orders]);

  const maxStatusCount = useMemo(
    () => Math.max(1, ...statusCounts.map((s) => s.count)),
    [statusCounts],
  );
  const maxRevenueCents = useMemo(
    () => Math.max(1, ...revenueByMonth.map(([, cents]) => cents)),
    [revenueByMonth],
  );

  const fulfilledOrdersCount = useMemo(
    () => orders.filter((o) => FULFILLMENT_STATUSES.has(o.status)).length,
    [orders],
  );
  const cancelledOrdersCount = useMemo(
    () => orders.filter((o) => o.status === "cancelled").length,
    [orders],
  );
  const averageOrderValue = useMemo(
    () => (fulfilledOrdersCount > 0 ? totalRevenueCents / fulfilledOrdersCount / 100 : 0),
    [fulfilledOrdersCount, totalRevenueCents],
  );
  const repeatBuyerCount = useMemo(
    () => users.filter((u) => (ordersByUserId.get(u.id) ?? 0) > 1).length,
    [ordersByUserId, users],
  );
  const repeatBuyerRate = users.length > 0 ? (repeatBuyerCount / users.length) * 100 : 0;
  const fulfillmentRate = totalOrders > 0 ? (fulfilledOrdersCount / totalOrders) * 100 : 0;
  const cancellationRate = totalOrders > 0 ? (cancelledOrdersCount / totalOrders) * 100 : 0;
  const activeCatalogCount = useMemo(
    () => products.filter((p) => p.in_stock).length,
    [products],
  );

  const bestSellers = useMemo(() => {
    const byProduct = new Map<string, { productName: string; quantity: number }>();
    orderItems.forEach((line) => {
      const key = line.product_id;
      const current = byProduct.get(key);
      const name = line.product_name?.trim() || current?.productName || key;
      byProduct.set(key, {
        productName: name,
        quantity: (current?.quantity ?? 0) + (line.quantity ?? 0),
      });
    });
    return Array.from(byProduct.entries())
      .map(([productId, row]) => ({ productId, ...row }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
  }, [orderItems]);

  const nonMovingItems = useMemo(() => {
    const soldIds = new Set(orderItems.map((line) => line.product_id));
    return products
      .filter((p) => !soldIds.has(p.id))
      .slice(0, 8);
  }, [orderItems, products]);

  const cardShell =
    "rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800/90 dark:bg-[#121214]";
  const tabBtn = (id: AdminTab) =>
    cn(
      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
      activeTab === id
        ? "bg-[#f43f5e] text-white"
        : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800",
    );

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
        {(
          [
            ["overview", "Overview", LayoutDashboard, "/admin"],
            ["users", "Users", Users, "/admin?tab=users"],
            ["analytics", "Analytics", BarChart3, "/admin?tab=analytics"],
            ["audit", "Audit", Activity, "/admin?tab=audit"],
          ] as const
        ).map(([id, label, Icon, to]) => (
          <Link key={id} to={to} className={tabBtn(id)}>
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

          {activeTab === "overview" && (
            <AdminDashboardOverview
              totalUsers={overviewDatePreset === "all" ? totalUsers : overviewUsersInPeriod.length}
              totalOrders={overviewOrders.length}
              usersLast30Days={overviewDatePreset === "all" ? usersLast30Days : overviewUniqueBuyers}
              sidebarUsersCount={overviewRightColumnUsers}
              ordersLast7Days={overviewOrdersLast7Days}
              ordersPrev7Days={overviewOrdersPrev7Days}
              totalRevenueCents={overviewTotalRevenueCents}
              revenueSeries={overviewRevenueSeries}
              ordersByDay={overviewOrdersByDay}
              topProvinces={overviewTopProvinces}
              newVsReturning={overviewNewVsReturning}
              paymentMix={overviewPaymentMix}
              recentOrders={overviewOrders.slice(0, 6)}
              formatDateTime={formatDateTime}
              statusClass={adminStatusTone}
              datePreset={overviewDatePreset}
              onDatePresetChange={setOverviewDatePreset}
              revenueTrendHint={overviewRevenueTrendHint}
              ordersBarCaption={overviewOrdersBarCaption}
              kpiUsersTitle={overviewDatePreset === "all" ? "All users" : "Signups"}
              kpiNewTitle={overviewDatePreset === "all" ? "New (30d)" : "Active buyers"}
              usersMetricSubtitle={overviewUsersMetricSubtitle}
            />
          )}

          {activeTab === "users" && (
            <section className={cardShell}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Users</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-500">Filter users quickly by role and keyword.</p>
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <input
                  type="search"
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  placeholder="Search name, username, or id..."
                  className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none ring-[#f43f5e]/40 focus:border-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-700"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as "all" | "admin" | "user")}
                  className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none ring-[#f43f5e]/40 focus:border-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-zinc-700"
                >
                  <option value="all">All roles</option>
                  <option value="admin">Admins only</option>
                  <option value="user">Users only</option>
                </select>
              </div>

              {usersQueryError ? (
                <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-500">
                  Cannot load users list. Add an admin policy for `profiles` select/update first. Error:{" "}
                  {usersQueryError}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                        <th className="py-3 pr-4">Name</th>
                        <th className="py-3 pr-4">Username</th>
                        <th className="py-3 pr-4">Role</th>
                        <th className="py-3 pr-4">Orders</th>
                        <th className="py-3 pr-4">Joined</th>
                        <th className="py-3 pr-0">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-zinc-200/80 dark:border-zinc-800/70">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{u.full_name || "Unnamed user"}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">{u.id.slice(0, 8)}…</p>
                          </td>
                          <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">{u.username || "—"}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                u.is_admin ? "bg-violet-500/20 text-violet-300" : "bg-zinc-700/50 text-zinc-300",
                              )}
                            >
                              {u.is_admin ? "Admin" : "User"}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-zinc-800 dark:text-zinc-200">{ordersByUserId.get(u.id) ?? 0}</td>
                          <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-500">{formatDate(u.created_at)}</td>
                          <td className="py-3 pr-0">
                            <button
                              type="button"
                              disabled={savingRoleUserId === u.id || u.id === user?.id}
                              onClick={() => toggleAdminRole(u.id, !u.is_admin)}
                              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                              {savingRoleUserId === u.id ? "Saving..." : u.is_admin ? "Make user" : "Make admin"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-500">No matching users.</p>
                  )}
                </div>
              )}
            </section>
          )}

          {activeTab === "analytics" && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-2xl">Analytics</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500">Recommendations and product performance signals</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800/90 dark:bg-[#121214]">
                  <p className="text-xs font-medium text-zinc-500">Average order value</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(averageOrderValue)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800/90 dark:bg-[#121214]">
                  <p className="text-xs font-medium text-zinc-500">Fulfillment rate</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{fulfillmentRate.toFixed(1)}%</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800/90 dark:bg-[#121214]">
                  <p className="text-xs font-medium text-zinc-500">Repeat buyer rate</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{repeatBuyerRate.toFixed(1)}%</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800/90 dark:bg-[#121214]">
                  <p className="text-xs font-medium text-zinc-500">Cancellation rate</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{cancellationRate.toFixed(1)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className={cardShell}>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recommended actions</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">Push top sellers harder</p>
                      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                        {bestSellers.length} products are driving demand. Feature them in home banners and restock first.
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">Revive non-moving stock</p>
                      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                        {nonMovingItems.length} items have no order movement. Bundle, discount, or rotate creatives to test demand.
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">Reduce cancelled orders</p>
                      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                        Current cancellation rate is {cancellationRate.toFixed(1)}%. Audit failed payment and shipping confirmation steps.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={cardShell}>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Order pipeline snapshot</h3>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                          <th className="py-3 pr-4">Status</th>
                          <th className="py-3 pr-4">Distribution</th>
                          <th className="py-3 pr-0 text-right">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statusCounts.map((s) => {
                          const widthPct = (s.count / maxStatusCount) * 100;
                          return (
                            <tr key={s.status} className="border-b border-zinc-200/80 dark:border-zinc-800/70">
                              <td className="py-3 pr-4 capitalize text-zinc-800 dark:text-zinc-200">{s.status}</td>
                              <td className="py-3 pr-4">
                                <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                                  <div className="h-2.5 rounded-full bg-[#f43f5e]" style={{ width: `${widthPct}%` }} />
                                </div>
                              </td>
                              <td className="py-3 pr-0 text-right font-semibold text-zinc-900 dark:text-zinc-100">{s.count}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className={cardShell}>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Revenue by month</h3>
                  <div className="mt-4 overflow-x-auto">
                    {revenueByMonth.length > 0 ? (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                            <th className="py-3 pr-4">Month</th>
                            <th className="py-3 pr-4">Trend</th>
                            <th className="py-3 pr-0 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueByMonth.map(([monthKey, cents]) => {
                            const widthPct = (cents / maxRevenueCents) * 100;
                            return (
                              <tr key={monthKey} className="border-b border-zinc-200/80 dark:border-zinc-800/70">
                                <td className="py-3 pr-4 text-zinc-800 dark:text-zinc-200">{monthKey}</td>
                                <td className="py-3 pr-4">
                                  <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                                    <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${widthPct}%` }} />
                                  </div>
                                </td>
                                <td className="py-3 pr-0 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                                  {formatPrice(cents / 100)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-sm text-zinc-500 dark:text-zinc-500">No revenue data yet.</p>
                    )}
                  </div>
                </div>

                <div className={cardShell}>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Catalog movement health</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                      <span className="text-zinc-600 dark:text-zinc-400">In-stock catalog</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{activeCatalogCount}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                      <span className="text-zinc-600 dark:text-zinc-400">Items with movement</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{Math.max(0, activeCatalogCount - nonMovingItems.length)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                      <span className="text-zinc-600 dark:text-zinc-400">Non-moving items</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{nonMovingItems.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "audit" && (
            <section className={cardShell}>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Audit log</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                Timeline built from profile and order creation activity.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  type="search"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search event, target, detail, or time..."
                  className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none ring-[#f43f5e]/40 focus:border-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-700"
                />
                <select
                  value={auditEventFilter}
                  onChange={(e) => setAuditEventFilter(e.target.value as "all" | "USER_CREATED" | "ORDER_CREATED")}
                  className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none ring-[#f43f5e]/40 focus:border-zinc-400 focus:ring-2 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-zinc-700"
                >
                  <option value="all">All events</option>
                  <option value="USER_CREATED">User created</option>
                  <option value="ORDER_CREATED">Order created</option>
                </select>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                      <th className="py-3 pr-4">Time</th>
                      <th className="py-3 pr-4">Event</th>
                      <th className="py-3 pr-4">Target</th>
                      <th className="py-3 pr-0">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditRows.map((row) => (
                      <tr key={row.id} className="border-b border-zinc-200/80 dark:border-zinc-800/70">
                        <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-500">{formatDateTime(row.at)}</td>
                        <td className="py-3 pr-4 font-medium text-zinc-800 dark:text-zinc-200">{row.event}</td>
                        <td className="py-3 pr-4 text-zinc-800 dark:text-zinc-200">{row.target}</td>
                        <td className="py-3 pr-0 text-zinc-500 dark:text-zinc-500">{row.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAuditRows.length === 0 && (
                  <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-500">No activity yet.</p>
                )}
              </div>
            </section>
          )}
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <AdminDashboardContent />
    </AdminShell>
  );
}
