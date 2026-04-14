import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile, type UserProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { maskEmail } from "@/lib/maskContact";
import { uploadAvatarFile } from "@/lib/uploadAvatar";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileForm {
  username: string;
  full_name: string;
  phone: string;
  gender: string;
  birthday: string;
}

function emptyForm(): ProfileForm {
  return { username: "", full_name: "", phone: "", gender: "", birthday: "" };
}

function fromProfile(p: UserProfile | null): ProfileForm {
  if (!p) return emptyForm();
  return {
    username: p.username ?? "",
    full_name: p.full_name ?? "",
    phone: p.phone ?? "",
    gender: p.gender ?? "",
    birthday: p.birthday ? p.birthday.slice(0, 10) : "",
  };
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-border/70 py-4 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-6">
      <Label className="text-sm font-normal text-muted-foreground sm:text-right">{label}</Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function AccountProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate("/login?returnTo=/account/profile", { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && profile) {
      setForm(fromProfile(profile));
    }
  }, [profile, profileLoading]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = validateAvatarClient(file);
    if (err) {
      toast({ title: err, variant: "destructive" });
      return;
    }
    setPendingAvatar(file);
    setAvatarPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function validateAvatarClient(file: File): string | null {
    if (file.size > 1024 * 1024) return "File size: maximum 1 MB.";
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return "File extension: .JPEG, .PNG, or .WEBP only.";
    }
    return null;
  }

  const displayAvatar =
    avatarPreview || profile?.avatar_url || null;

  const initials =
    profile?.full_name
      ?.split(/\s+/)
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "?";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);

    let avatarUrl: string | null = profile?.avatar_url ?? null;
    if (pendingAvatar) {
      const { url, error } = await uploadAvatarFile(user.id, pendingAvatar);
      if (error) {
        toast({ title: "Avatar upload failed", description: error, variant: "destructive" });
        setSaving(false);
        return;
      }
      avatarUrl = url;
      setPendingAvatar(null);
    }

    const payload = {
      username: form.username.trim() || null,
      full_name: form.full_name.trim() || null,
      phone: form.phone.trim() || null,
      gender: form.gender || null,
      birthday: form.birthday || null,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(
      { id: user.id, ...payload },
      { onConflict: "id" }
    );
    setSaving(false);

    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Profile saved" });
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
      <div className="rounded-lg border border-border bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <h1 className="text-xl font-semibold text-foreground">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and protect your account</p>
        </div>

        {profileLoading ? (
          <div className="p-8 text-muted-foreground">Loading your profile…</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col lg:flex-row">
              {/* Left: form */}
              <div className="min-w-0 flex-1 px-6 py-2">
                <FieldRow label="Username">
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                    placeholder="Choose a username"
                    className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
                  />
                </FieldRow>

                <FieldRow label="Name">
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
                  />
                </FieldRow>

                <FieldRow label="Email">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-foreground">{maskEmail(user?.email)}</span>
                    <Link to="/contact" className="text-sm text-amber-700 hover:underline">
                      Change
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Email changes are handled by support for security.
                  </p>
                </FieldRow>

                <FieldRow label="Phone number">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+63 9XX XXX XXXX"
                      className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
                    />
                  </div>
                </FieldRow>

                <FieldRow label="Gender">
                  <RadioGroup
                    value={form.gender || undefined}
                    onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}
                    className="flex flex-wrap gap-4"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="male" id="g-m" />
                      <span>Male</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="female" id="g-f" />
                      <span>Female</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="other" id="g-o" />
                      <span>Other</span>
                    </label>
                  </RadioGroup>
                </FieldRow>

                <FieldRow label="Date of birth">
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={(e) => setForm((p) => ({ ...p, birthday: e.target.value }))}
                    className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
                  />
                </FieldRow>

                <div className="py-6">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="min-w-[120px] bg-orange-600 px-8 hover:bg-orange-700"
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>

              {/* Divider vertical on desktop */}
              <div className="hidden w-px shrink-0 bg-border lg:block" />

              {/* Right: avatar */}
              <div className="flex flex-col items-center border-t border-border px-8 py-10 lg:w-[320px] lg:border-t-0 lg:px-10">
                <Avatar className="h-32 w-32 border-2 border-border shadow">
                  {displayAvatar ? (
                    <AvatarImage src={displayAvatar} alt="" className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-orange-50 text-2xl font-semibold text-orange-800">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onPickAvatar}
                />

                <Button
                  type="button"
                  variant="outline"
                  className="mt-6 border-border bg-white"
                  onClick={() => fileRef.current?.click()}
                >
                  Select Image
                </Button>

                <p className="mt-4 max-w-[220px] text-center text-xs leading-relaxed text-muted-foreground">
                  File size: maximum 1 MB
                  <br />
                  File extension: .JPEG, .PNG
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </AccountLayout>
  );
}
