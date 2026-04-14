import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile, type UserProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { PH_PROVINCES } from "@/data/phProvinces";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const inputCls =
  "mt-1.5 w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-orange-500/30";

interface AddrForm {
  shipping_street: string;
  shipping_city: string;
  shipping_province: string;
  shipping_postal_code: string;
  billing_same_as_shipping: boolean;
  billing_street: string;
  billing_city: string;
  billing_province: string;
  billing_postal_code: string;
}

function empty(): AddrForm {
  return {
    shipping_street: "",
    shipping_city: "",
    shipping_province: "",
    shipping_postal_code: "",
    billing_same_as_shipping: true,
    billing_street: "",
    billing_city: "",
    billing_province: "",
    billing_postal_code: "",
  };
}

function fromProfile(p: UserProfile | null): AddrForm {
  if (!p) return empty();
  return {
    shipping_street: p.shipping_street ?? "",
    shipping_city: p.shipping_city ?? "",
    shipping_province: p.shipping_province ?? "",
    shipping_postal_code: p.shipping_postal_code ?? "",
    billing_same_as_shipping: p.billing_same_as_shipping,
    billing_street: p.billing_street ?? "",
    billing_city: p.billing_city ?? "",
    billing_province: p.billing_province ?? "",
    billing_postal_code: p.billing_postal_code ?? "",
  };
}

export default function AccountAddressesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<AddrForm>(empty);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate("/login?returnTo=/account/addresses", { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && profile) setForm(fromProfile(profile));
  }, [profile, profileLoading]);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.shipping_postal_code && !/^\d{4}$/.test(form.shipping_postal_code.trim())) {
      e.shipping_postal_code = "4-digit postal code";
    }
    if (!form.billing_same_as_shipping && form.billing_postal_code && !/^\d{4}$/.test(form.billing_postal_code.trim())) {
      e.billing_postal_code = "4-digit postal code";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    const payload = {
      shipping_street: form.shipping_street.trim() || null,
      shipping_city: form.shipping_city.trim() || null,
      shipping_province: form.shipping_province.trim() || null,
      shipping_postal_code: form.shipping_postal_code.trim() || null,
      billing_same_as_shipping: form.billing_same_as_shipping,
      billing_street: form.billing_same_as_shipping ? null : form.billing_street.trim() || null,
      billing_city: form.billing_same_as_shipping ? null : form.billing_city.trim() || null,
      billing_province: form.billing_same_as_shipping ? null : form.billing_province.trim() || null,
      billing_postal_code: form.billing_same_as_shipping ? null : form.billing_postal_code.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...payload }, { onConflict: "id" });
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Addresses saved" });
    refetch();
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
        <h1 className="text-lg font-semibold text-foreground">Addresses</h1>
        <p className="mt-1 text-sm text-muted-foreground">Used as default at checkout. You can still edit per order.</p>

        {profileLoading ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-foreground">Shipping address</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <Label>Street / Barangay</Label>
                  <input
                    value={form.shipping_street}
                    onChange={(e) => setForm((p) => ({ ...p, shipping_street: e.target.value }))}
                    className={inputCls}
                    placeholder="123 Sampaguita St., Brgy. Masaya"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>City / Municipality</Label>
                    <input
                      value={form.shipping_city}
                      onChange={(e) => setForm((p) => ({ ...p, shipping_city: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Label>Postal code</Label>
                    <input
                      inputMode="numeric"
                      maxLength={4}
                      value={form.shipping_postal_code}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, shipping_postal_code: e.target.value.replace(/\D/g, "") }))
                      }
                      className={inputCls}
                    />
                    {errors.shipping_postal_code && (
                      <p className="mt-1 text-xs text-destructive">{errors.shipping_postal_code}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Province</Label>
                  <select
                    value={form.shipping_province}
                    onChange={(e) => setForm((p) => ({ ...p, shipping_province: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— Select —</option>
                    {PH_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-foreground">Billing address</h2>
              <div className="mt-3 flex items-center gap-2">
                <Checkbox
                  id="same"
                  checked={form.billing_same_as_shipping}
                  onCheckedChange={(c) => setForm((p) => ({ ...p, billing_same_as_shipping: c === true }))}
                />
                <Label htmlFor="same" className="text-sm font-normal">
                  Same as shipping
                </Label>
              </div>
              {!form.billing_same_as_shipping && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Street / Barangay</Label>
                    <input
                      value={form.billing_street}
                      onChange={(e) => setForm((p) => ({ ...p, billing_street: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>City</Label>
                      <input
                        value={form.billing_city}
                        onChange={(e) => setForm((p) => ({ ...p, billing_city: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <Label>Postal code</Label>
                      <input
                        inputMode="numeric"
                        maxLength={4}
                        value={form.billing_postal_code}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, billing_postal_code: e.target.value.replace(/\D/g, "") }))
                        }
                        className={inputCls}
                      />
                      {errors.billing_postal_code && (
                        <p className="mt-1 text-xs text-destructive">{errors.billing_postal_code}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Province</Label>
                    <select
                      value={form.billing_province}
                      onChange={(e) => setForm((p) => ({ ...p, billing_province: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">— Select —</option>
                      {PH_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </section>

            <Button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? "Saving…" : "Save addresses"}
            </Button>
          </form>
        )}
      </div>
    </AccountLayout>
  );
}
