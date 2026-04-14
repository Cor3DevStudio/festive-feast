import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar, AdminSidebarLogo, AdminSidebarNav } from "@/components/admin/AdminSidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { restoreStorefrontTheme } from "@/lib/adminTheme";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      const returnTo = `${location.pathname}${location.search}` || "/admin";
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
      return;
    }
    if (!user?.id) return;

    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data?.is_admin) {
          navigate("/", { replace: true });
          return;
        }
        setIsAdmin(true);
      });
  }, [authLoading, isAuthenticated, navigate, location.pathname, location.search, user?.id]);

  const userInitial = user?.email?.charAt(0) ?? "?";

  async function handleSignOut() {
    await signOut();
    restoreStorefrontTheme();
    navigate("/login", { replace: true });
  }

  if (authLoading || isAdmin === null) {
    return (
      <div className="grid h-screen place-items-center bg-slate-100 dark:bg-[#0a0a0c]">
        <main className="px-6 py-20 text-center">
          <p className="text-zinc-500 dark:text-zinc-500">Checking admin access…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-zinc-900 dark:bg-[#0a0a0c] dark:text-zinc-100">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[260px] border-zinc-200 bg-white p-0 text-zinc-900 dark:border-zinc-800 dark:bg-[#0c0c0e] dark:text-zinc-100"
        >
          <AdminSidebarLogo />
          <AdminSidebarNav onCloseMobile={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:flex">
        <AdminSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          onMenuOpen={() => setMobileNavOpen(true)}
          userEmail={user?.email}
          userInitial={userInitial}
          onSignOut={handleSignOut}
        />
        <div className="min-h-0 flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
