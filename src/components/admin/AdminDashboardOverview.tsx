import { useId } from "react";
import { ChevronDown, Eye, Rocket } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/data/products";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PINK = "#f43f5e";
const ORANGE = "#f97316";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const CHART_TOOLTIP =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

interface AdminDashboardOverviewProps {
  /** Dashboard tab uses overview; Analytics tab reuses the same layout with detail tables at the bottom. */
  variant?: "overview" | "analytics";
  totalUsers: number;
  totalOrders: number;
  /** Third KPI tile (new signups / active buyers). */
  usersLast30Days: number;
  /** Right column “Users” headline number; defaults to `usersLast30Days` when omitted. */
  sidebarUsersCount?: number;
  ordersLast7Days: number;
  ordersPrev7Days: number;
  totalRevenueCents: number;
  revenueSeries: { label: string; revenue: number }[];
  ordersByDay: { label: string; orders: number }[];
  topProvinces: { name: string; count: number }[];
  newVsReturning: { name: string; value: number }[];
  paymentMix: { name: string; value: number }[];
  recentOrders: Array<{
    id: string;
    status: string;
    shipping_name: string | null;
    created_at: string;
  }>;
  formatDateTime: (v: string) => string;
  statusClass: (status: string) => string;
  /** Shown when `variant` is `analytics` (order status table). */
  statusBreakdown?: { status: string; count: number }[];
  maxStatusCount?: number;
  /** Shown when `variant` is `analytics` (revenue-by-month table). */
  revenueByMonthRows?: { monthKey: string; cents: number }[];
  maxRevenueCentsForMonthBar?: number;
  datePreset?: "7d" | "30d" | "90d" | "all";
  onDatePresetChange?: (next: "7d" | "30d" | "90d" | "all") => void;
  /** Shown under "Reports snapshot" to explain chart bucketing (daily vs weekly vs monthly). */
  revenueTrendHint?: string;
  /** Label for the orders bar chart (e.g. daily vs weekly buckets). */
  ordersBarCaption?: string;
  /** Gradient tile 1 (users / signups). */
  kpiUsersTitle?: string;
  /** Gradient tile 3 (new profiles vs active buyers). */
  kpiNewTitle?: string;
  usersMetricSubtitle?: string;
}

function pctChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function AdminDashboardOverview({
  variant = "overview",
  totalUsers,
  totalOrders,
  usersLast30Days,
  sidebarUsersCount,
  ordersLast7Days,
  ordersPrev7Days,
  totalRevenueCents,
  revenueSeries,
  ordersByDay,
  topProvinces,
  newVsReturning,
  paymentMix,
  recentOrders,
  formatDateTime,
  statusClass,
  statusBreakdown,
  maxStatusCount,
  revenueByMonthRows,
  maxRevenueCentsForMonthBar,
  datePreset = "30d",
  onDatePresetChange,
  revenueTrendHint,
  ordersBarCaption = "Orders per day",
  kpiUsersTitle = "All users",
  kpiNewTitle = "New (30d)",
  usersMetricSubtitle = "New profiles in the last 30 days",
}: AdminDashboardOverviewProps) {
  const sidebarUsers = sidebarUsersCount ?? usersLast30Days;
  const activeDatePreset = datePreset;
  const setDatePreset = (next: "7d" | "30d" | "90d" | "all") => {
    onDatePresetChange?.(next);
  };
  const revenueFillId = useId().replace(/:/g, "");
  const sessionGrowth = pctChange(ordersLast7Days, ordersPrev7Days);
  const pageGrowth = pctChange(
    Math.max(0, totalOrders - ordersLast7Days),
    Math.max(1, ordersLast7Days),
  );

  const donut1Total = newVsReturning.reduce((s, x) => s + x.value, 0) || 1;
  const donut2Total = paymentMix.reduce((s, x) => s + x.value, 0) || 1;
  const datePresetLabel =
    activeDatePreset === "7d"
      ? "Last 7 days"
      : activeDatePreset === "30d"
        ? "Last 30 days"
        : activeDatePreset === "90d"
          ? "Last 90 days"
          : "All time";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          {variant === "analytics" ? "Analytics" : "Dashboard"}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          {variant === "analytics"
            ? "Order pipeline, revenue trends, and distribution"
            : "Commerce performance and customer activity"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800/90 dark:bg-[#121214] sm:p-5">
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl bg-gradient-to-br from-[#f43f5e] to-rose-700 p-4 text-white shadow-lg shadow-rose-950/40">
                <p className="text-xs font-medium text-rose-100">{kpiUsersTitle}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{totalUsers.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-4 text-white shadow-lg shadow-orange-950/30">
                <p className="text-xs font-medium text-orange-100">Orders</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{totalOrders.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-lg shadow-emerald-950/30">
                <p className="text-xs font-medium text-emerald-100">{kpiNewTitle}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{usersLast30Days.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-4 text-white shadow-lg shadow-sky-950/30">
                <p className="text-xs font-medium text-sky-100">Revenue</p>
                <p className="mt-1 text-lg font-bold tabular-nums leading-tight">
                  {formatPrice(totalRevenueCents / 100)}
                </p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Reports snapshot</p>
                {revenueTrendHint ? (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">{revenueTrendHint}</p>
                ) : null}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300"
                  >
                    {datePresetLabel}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDatePreset("7d")}>Last 7 days</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDatePreset("30d")}>Last 30 days</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDatePreset("90d")}>Last 90 days</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDatePreset("all")}>All time</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={revenueFillId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PINK} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={PINK} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className={CHART_TOOLTIP}>
                          <p className="font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
                          <p className="text-[#f43f5e]">{formatPrice((payload[0].value as number) ?? 0)}</p>
                        </div>
                      ) : null
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={PINK}
                    strokeWidth={2}
                    fill={`url(#${revenueFillId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className="flex h-full min-h-[420px] flex-col rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800/90 dark:bg-[#121214] sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Users</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {sidebarUsers.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">{usersMetricSubtitle}</p>
              </div>
            </div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{ordersBarCaption}</p>
            <div className="h-[160px] w-full min-w-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByDay} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className={CHART_TOOLTIP}>
                          <p className="text-zinc-700 dark:text-zinc-300">Orders: {payload[0].value}</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="orders" radius={[6, 6, 0, 0]} fill={PINK} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">Top provinces</p>
            <div className="space-y-2">
              {topProvinces.length === 0 ? (
                <p className="text-sm text-zinc-600">No shipping data yet.</p>
              ) : (
                topProvinces.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800/80 dark:bg-zinc-900/40"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300">{row.name}</span>
                    <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{row.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800/90 dark:bg-[#121214]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">Orders (7d)</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{ordersLast7Days}</p>
              <p
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-xs font-semibold",
                  sessionGrowth >= 0 ? "text-emerald-400" : "text-red-400",
                )}
              >
                {sessionGrowth >= 0 ? "↑" : "↓"} {Math.abs(sessionGrowth)}% vs prior week
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-400">
              <Rocket className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800/90 dark:bg-[#121214]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">Catalog reach</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{totalOrders}</p>
              <p
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-xs font-semibold",
                  pageGrowth >= 0 ? "text-emerald-400" : "text-red-400",
                )}
              >
                {pageGrowth >= 0 ? "↑" : "↓"} {Math.abs(pageGrowth)}% backlog mix
              </p>
            </div>
            <div className="rounded-xl bg-rose-500/15 p-2 text-rose-400">
              <Eye className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800/90 dark:bg-[#121214]">
          <p className="mb-1 text-center text-xs font-medium text-zinc-500">New vs returning</p>
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={newVsReturning}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {[PINK, ORANGE, GREEN, BLUE].map((c, i) => (
                    <Cell key={i} fill={c} stroke="#121214" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className={CHART_TOOLTIP}>
                        <p>
                          {String(payload[0].name)}: {payload[0].value}
                        </p>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Total</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{donut1Total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800/90 dark:bg-[#121214]">
          <p className="mb-1 text-center text-xs font-medium text-zinc-500">Payment mix</p>
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMix}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {paymentMix.map((_, i) => (
                    <Cell
                      key={i}
                      fill={[ORANGE, BLUE, GREEN, PINK][i % 4]}
                      stroke="#121214"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className={CHART_TOOLTIP}>
                        <p>
                          {String(payload[0].name)}: {payload[0].value}
                        </p>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Total</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{donut2Total}</p>
            </div>
          </div>
        </div>
      </div>

      {variant === "analytics" &&
      statusBreakdown &&
      maxStatusCount != null &&
      revenueByMonthRows &&
      maxRevenueCentsForMonthBar != null ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800/90 dark:bg-[#121214]">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Order status breakdown</h3>
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
                  {statusBreakdown.map((s) => {
                    const widthPct = (s.count / maxStatusCount) * 100;
                    return (
                      <tr key={s.status} className="border-b border-zinc-200/80 dark:border-zinc-800/70">
                        <td className="py-3 pr-4 capitalize text-zinc-800 dark:text-zinc-200">{s.status}</td>
                        <td className="py-3 pr-4">
                          <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                              className="h-2.5 rounded-full bg-[#f43f5e]"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 pr-0 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                          {s.count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800/90 dark:bg-[#121214]">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Revenue by month</h3>
            <div className="mt-4 overflow-x-auto">
              {revenueByMonthRows.length > 0 ? (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                      <th className="py-3 pr-4">Month</th>
                      <th className="py-3 pr-4">Trend</th>
                      <th className="py-3 pr-0 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueByMonthRows.map(({ monthKey, cents }) => {
                      const widthPct = (cents / maxRevenueCentsForMonthBar) * 100;
                      return (
                        <tr key={monthKey} className="border-b border-zinc-200/80 dark:border-zinc-800/70">
                          <td className="py-3 pr-4 text-zinc-800 dark:text-zinc-200">{monthKey}</td>
                          <td className="py-3 pr-4">
                            <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
                              <div
                                className="h-2.5 rounded-full bg-emerald-500"
                                style={{ width: `${widthPct}%` }}
                              />
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
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800/90 dark:bg-[#121214]">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Recent orders</h3>
          <div className="mt-3 space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-zinc-600">No orders yet.</p>
            ) : (
              recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-900/40"
                >
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">#{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-zinc-500">
                      {o.shipping_name || "Customer"} · {formatDateTime(o.created_at)}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusClass(o.status))}>
                    {o.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
