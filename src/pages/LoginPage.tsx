import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const hasReturnTo = searchParams.has("returnTo");
  const returnTo = searchParams.get("returnTo") || "/shop";
  const tabParam = searchParams.get("tab");
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(
    tabParam === "signup" ? "signup" : "login"
  );

  /** Prevents the "already logged in" redirect from racing ahead of handleLogin's admin check (which would flash /shop). */
  const pendingLoginRedirectRef = useRef(false);

  useEffect(() => {
    if (tabParam === "signup") setActiveTab("signup");
    else if (tabParam === "login") setActiveTab("login");
  }, [tabParam]);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && !pendingLoginRedirectRef.current) {
      navigate(returnTo, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, returnTo]);

  if (authLoading) return null;
  if (isAuthenticated && !pendingLoginRedirectRef.current) return null;

  if (isAuthenticated && pendingLoginRedirectRef.current) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex min-h-[50vh] items-center justify-center px-6 py-16">
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </main>
        <Footer />
      </div>
    );
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: "Email and password required", variant: "destructive" });
      return;
    }
    pendingLoginRedirectRef.current = true;
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      pendingLoginRedirectRef.current = false;
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome back!" });

    // Respect explicit return destinations (e.g. checkout or /admin links).
    if (hasReturnTo) {
      pendingLoginRedirectRef.current = false;
      navigate(returnTo, { replace: true });
      return;
    }

    // If no returnTo was provided, send admins directly to the admin dashboard.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_admin) {
        pendingLoginRedirectRef.current = false;
        navigate("/admin", { replace: true });
        return;
      }
    }

    pendingLoginRedirectRef.current = false;
    navigate(returnTo, { replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: "Email and password required", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Account created",
      description: "Check your email to confirm, or sign in if already confirmed.",
    });
    setActiveTab("login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-md">
          <h1 className="font-display text-2xl font-semibold text-foreground text-center">
            Sign in to your account
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Log in to add items to your cart and complete purchases.
          </p>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to={returnTo} className="underline hover:text-foreground">
              Continue shopping without signing in
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
