import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Boxes,
  ChevronDown,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type AdminTab = "overview" | "users" | "analytics" | "audit";

function parseDashboardTab(search: string): AdminTab {
  const t = new URLSearchParams(search).get("tab");
  if (t === "users" || t === "analytics" || t === "audit" || t === "overview") return t;
  return "overview";
}

interface AdminSidebarNavProps {
  onCloseMobile?: () => void;
}

const navBtn = (active: boolean) =>
  cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    active
      ? "bg-[#f43f5e] text-white shadow-sm shadow-rose-900/30"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100",
  );

const subLink = (active: boolean) =>
  cn(
    "flex w-full items-center gap-2 rounded-md py-2 pl-9 pr-3 text-sm",
    active ? "text-[#f43f5e]" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300",
  );

export function AdminSidebarLogo() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 px-5 dark:border-zinc-800/90">
      <span className="font-display text-xl font-bold tracking-tight text-[#f43f5e]">Festive Feast</span>
      <span className="rounded-md bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500">
        Admin
      </span>
    </div>
  );
}

export function AdminSidebarNav({ onCloseMobile }: AdminSidebarNavProps) {
  const location = useLocation();
  const tab = parseDashboardTab(location.search);
  const isItemsRoute = location.pathname.startsWith("/admin/items");
  const isCategoriesRoute = location.pathname.startsWith("/admin/categories");
  const isOrdersRoute = location.pathname.startsWith("/admin/orders");
  const isDashboardRoute = location.pathname === "/admin" || location.pathname === "/admin/";

  const close = () => onCloseMobile?.();

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        Application
      </p>
      <Link
        to="/admin"
        className={navBtn(isDashboardRoute && tab === "overview" && !isItemsRoute && !isOrdersRoute)}
        onClick={close}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        Dashboard
      </Link>
      <Link
        to="/admin?tab=analytics"
        className={navBtn(isDashboardRoute && tab === "analytics" && !isItemsRoute && !isOrdersRoute)}
        onClick={close}
      >
        <BarChart3 className="h-4 w-4 shrink-0" />
        Analytics
      </Link>

      <Collapsible defaultOpen className="group space-y-1">
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100">
          <span className="flex items-center gap-3">
            <ShoppingBag className="h-4 w-4 shrink-0" />
            Commerce
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-0.5 pl-2">
          <Link
            to="/admin"
            className={subLink(isDashboardRoute && tab === "overview" && !isItemsRoute && !isOrdersRoute)}
            onClick={close}
          >
            Order snapshot
          </Link>
          <Link
            to="/admin/orders"
            className={subLink(isOrdersRoute)}
            onClick={close}
          >
            Orders & customers
          </Link>
          <Link
            to="/admin/items"
            className={subLink(isItemsRoute)}
            onClick={close}
          >
            <Package className="h-3.5 w-3.5" />
            Items
          </Link>
          <Link
            to="/admin/categories"
            className={subLink(isCategoriesRoute)}
            onClick={close}
          >
            <Boxes className="h-3.5 w-3.5" />
            Categories
          </Link>
        </CollapsibleContent>
      </Collapsible>

      <Link
        to="/admin?tab=users"
        className={navBtn(isDashboardRoute && tab === "users" && !isItemsRoute && !isOrdersRoute)}
        onClick={close}
      >
        <Users className="h-4 w-4 shrink-0" />
        Users
      </Link>

      <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        Components
      </p>
      <Link
        to="/admin?tab=audit"
        className={navBtn(isDashboardRoute && tab === "audit" && !isItemsRoute && !isOrdersRoute)}
        onClick={close}
      >
        <Activity className="h-4 w-4 shrink-0" />
        Audit log
      </Link>
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800/90 dark:bg-[#0c0c0e]">
      <AdminSidebarLogo />
      <AdminSidebarNav />
    </aside>
  );
}
