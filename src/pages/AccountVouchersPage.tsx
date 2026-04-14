import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TicketPercent, Copy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const VOUCHERS = [
  {
    code: "PASKO100",
    title: "P100 off",
    desc: "Min. spend P2,000",
    expires: "Dec 31, 2026",
  },
  {
    code: "SHIPFREE50",
    title: "Free shipping",
    desc: "Min. spend P1,500",
    expires: "Nov 30, 2026",
  },
];

export default function AccountVouchersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate("/login?returnTo=/account/vouchers", { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

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
          <TicketPercent className="h-5 w-5 text-orange-600" />
          <h1 className="text-lg font-semibold text-foreground">My vouchers</h1>
        </div>
        <div className="space-y-3">
          {VOUCHERS.map((v) => (
            <div key={v.code} className="rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-orange-100 p-2">
                  <TicketPercent className="h-4 w-4 text-orange-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.desc}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Code: {v.code}</p>
                  <p className="text-xs text-muted-foreground">Expires: {v.expires}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(v.code);
                    toast({ title: `Copied ${v.code}` });
                  }}
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AccountLayout>
  );
}

