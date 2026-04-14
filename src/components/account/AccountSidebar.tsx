import { Link, useLocation } from "react-router-dom";
import {
  User,
  Pencil,
  ClipboardList,
  MapPin,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function NavItem({
  to,
  icon: Icon,
  label,
  active,
  disabled,
}: {
  to?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const cls = cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
    active && "bg-orange-50 font-medium text-orange-700",
    !active && !disabled && "text-foreground hover:bg-muted/80",
    disabled && "cursor-not-allowed text-muted-foreground/60"
  );

  if (disabled || !to) {
    return (
      <span className={cls}>
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
    );
  }

  return (
    <Link to={to} className={cls}>
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export default function AccountSidebar() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { pathname } = useLocation();

  const displayName = profile?.username?.trim() || profile?.full_name?.trim() || user?.email?.split("@")[0] || "Account";
  const initials =
    profile?.full_name
      ?.split(/\s+/)
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "?";

  return (
    <aside className="w-full shrink-0 lg:w-56 xl:w-64">
      <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border/80 pb-4">
          <Avatar className="h-12 w-12 border border-border">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="" className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-orange-50 text-sm font-semibold text-orange-800">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            <Link
              to="/account/profile"
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-orange-600 hover:underline"
            >
              <Pencil className="h-3 w-3" />
              Edit profile
            </Link>
          </div>
        </div>

        <nav className="mt-4 space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">My account</p>
          <NavItem
            to="/account/profile"
            icon={User}
            label="Profile"
            active={pathname === "/account/profile"}
          />
          <NavItem
            to="/account/addresses"
            icon={MapPin}
            label="Addresses"
            active={pathname === "/account/addresses"}
          />
          <NavItem to="/account/password" icon={KeyRound} label="Change password" active={pathname === "/account/password"} />

          <div className="my-2 border-t border-border/80" />

          <NavItem
            to="/account/orders"
            icon={ClipboardList}
            label="My purchase"
            active={pathname === "/account/orders"}
          />
        </nav>
      </div>
    </aside>
  );
}
