import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, Package, Truck, CreditCard, Gift } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import AccountLayout from "@/components/account/AccountLayout";
import { Badge } from "@/components/ui/badge";

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
}

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  when: string;
  kind: "payment" | "shipping" | "promo";
};

function kindIcon(kind: NotificationItem["kind"]) {
  if (kind === "payment") return <CreditCard className="h-4 w-4 text-blue-600" />;
  if (kind === "shipping") return <Truck className="h-4 w-4 text-cyan-600" />;
  return <Gift className="h-4 w-4 text-orange-600" />;
}

export default function AccountNotificationsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate("/login?returnTo=/account/notifications", { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("orders")
      .select("id, status, total_cents, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as OrderRow[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const out: NotificationItem[] = [
      {
        id: "welcome",
        title: "Welcome to Christmas Decors PH",
        body: "Track your orders and account updates here.",
        when: "just now",
        kind: "promo",
      },
    ];
    for (const o of orders) {
      const date = new Date(o.created_at).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      });
      if (o.status === "paid" || o.status === "processing") {
        out.push({
          id: `paid-${o.id}`,
          title: "Payment confirmed",
          body: `Order #${o.id.slice(0, 8).toUpperCase()} was paid successfully.`,
          when: date,
          kind: "payment",
        });
      }
      if (o.status === "shipped") {
        out.push({
          id: `ship-${o.id}`,
          title: "Order shipped",
          body: `Your order #${o.id.slice(0, 8).toUpperCase()} is on the way.`,
          when: date,
          kind: "shipping",
        });
      }
      if (o.status === "delivered") {
        out.push({
          id: `deliv-${o.id}`,
          title: "Order delivered",
          body: `Order #${o.id.slice(0, 8).toUpperCase()} was delivered. Enjoy!`,
          when: date,
          kind: "shipping",
        });
      }
    }
    return out.slice(0, 20);
  }, [orders]);

  if (authLoading || !isAuthenticated) {
    return (
      <AccountLayout>
        <p className="text-muted-foreground">Loading…</p>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <BellRing className="h-5 w-5 text-orange-600" />
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading notifications…</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="flex items-center gap-2">
                  {kindIcon(n.kind)}
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.kind === "promo" ? <Badge className="ml-auto bg-orange-100 text-orange-800">Info</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{n.when}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

