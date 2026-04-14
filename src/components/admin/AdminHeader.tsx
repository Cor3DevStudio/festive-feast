import { useEffect, useState } from "react";
import { Bell, LogOut, Menu, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  onMenuOpen?: () => void;
  userEmail?: string | null;
  userInitial?: string;
  onSignOut?: () => void;
}

export function AdminHeader({
  onMenuOpen,
  userEmail,
  userInitial = "A",
  onSignOut,
}: AdminHeaderProps) {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const saved = window.localStorage.getItem("admin-theme");

    if (saved === "light") {
      root.classList.remove("dark");
      setIsLightMode(true);
    } else if (saved === "dark") {
      root.classList.add("dark");
      setIsLightMode(false);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        setIsLightMode(false);
      } else {
        root.classList.remove("dark");
        setIsLightMode(true);
      }
    }

  }, []);

  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-zinc-200 bg-white px-4 py-3 md:h-16 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0 md:pl-5 md:pr-6 dark:border-zinc-800/90 dark:bg-[#0a0a0c]">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 md:max-w-md" />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => {
            const root = document.documentElement;
            const nextLight = !isLightMode;
            setIsLightMode(nextLight);

            if (nextLight) {
              root.classList.remove("dark");
              window.localStorage.setItem("admin-theme", "light");
            } else {
              root.classList.add("dark");
              window.localStorage.setItem("admin-theme", "dark");
            }
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-500 transition-colors hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:text-zinc-100"
          aria-label={isLightMode ? "Use dark appearance" : "Use light appearance"}
        >
          {isLightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-500 transition-colors hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:text-zinc-100"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">No new notifications</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-xs text-muted-foreground" disabled>
              Mark all as read
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-gradient-to-br from-[#f43f5e] to-rose-700 text-sm font-bold text-white"
              title={userEmail ?? undefined}
              aria-label="Open account menu"
            >
              {userInitial.slice(0, 1).toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{userEmail ?? "Admin account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onSignOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
