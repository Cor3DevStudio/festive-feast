import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AccountPasswordPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate("/login?returnTo=/account/password", { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (next !== confirm) {
      toast({ title: "Mismatch", description: "New password and confirmation do not match.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const email = user?.email;
    if (!email) {
      setSaving(false);
      toast({ title: "Not signed in", variant: "destructive" });
      return;
    }
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (signErr) {
      setSaving(false);
      toast({ title: "Current password incorrect", description: signErr.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated" });
    setCurrent("");
    setNext("");
    setConfirm("");
  }

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
        <h1 className="text-lg font-semibold text-foreground">Change password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use a strong password you don&apos;t use elsewhere.</p>
        <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
          <div>
            <Label htmlFor="cur">Current password</Label>
            <input
              id="cur"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <Label htmlFor="nw">New password</Label>
            <input
              id="nw"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="cf">Confirm new password</Label>
            <input
              id="cf"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <Button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700">
            {saving ? "Saving…" : "Update password"}
          </Button>
        </form>
      </div>
    </AccountLayout>
  );
}
