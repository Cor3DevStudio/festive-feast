import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coins } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/data/products";
import AccountLayout from "@/components/account/AccountLayout";
import { Progress } from "@/components/ui/progress";

interface OrderRow {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
}

const NEXT_TIER_POINTS = 1000;

export default function AccountRewardsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate("/login?returnTo=/account/rewards", { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("orders")
      .select("id, status, total_cents, created_at")
      .eq("user_id", user.id)
      .in("status", ["paid", "processing", "shipped", "delivered"])
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as OrderRow[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const totalSpentCents = useMemo(
    () => orders.reduce((sum, o) => sum + o.total_cents, 0),
    [orders]
  );
  const rewardPoints = Math.floor(totalSpentCents / 10000); // 1 point per P100
  const nextTierRemaining = Math.max(0, NEXT_TIER_POINTS - rewardPoints);
  const progress = Math.min(100, (rewardPoints / NEXT_TIER_POINTS) * 100);

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
          <Coins className="h-5 w-5 text-orange-600" />
          <h1 className="text-lg font-semibold text-foreground">My rewards</h1>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading rewards…</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Available points</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{rewardPoints}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Total qualified spend: <span className="font-medium text-foreground">{formatPrice(totalSpentCents / 100)}</span>
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to Gold tier</span>
                <span className="font-medium text-foreground">{rewardPoints}/{NEXT_TIER_POINTS}</span>
              </div>
              <Progress value={progress} className="h-2.5" />
              <p className="mt-2 text-xs text-muted-foreground">
                {nextTierRemaining > 0
                  ? `${nextTierRemaining} points to unlock Gold perks.`
                  : "Gold tier unlocked!"}
              </p>
            </div>

            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Earn points from paid orders. Rewards redemption options can be added next (discount vouchers, free shipping, etc.).
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

