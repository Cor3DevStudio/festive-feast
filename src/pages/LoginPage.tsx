import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { establishSessionFromEmailCallbackUrl, stripAuthCallbackFromBrowserUrl } from "@/lib/authEmailCallback";
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
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
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

  /** Email confirmation links (PKCE ?code= or legacy hash tokens). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      const { attempted, ok, error } = await establishSessionFromEmailCallbackUrl(window.location.href);
      if (cancelled || !attempted) return;
      stripAuthCallbackFromBrowserUrl();
      if (ok) {
        toast({ title: "Email confirmed", description: "You're signed in." });
      } else if (error) {
        toast({ title: "Could not complete sign-in", description: error, variant: "destructive" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

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
    if (!signupFirstName.trim() || !signupLastName.trim()) {
      toast({ title: "First and last name required", variant: "destructive" });
      return;
    }
    if (!email.trim() || !password) {
      toast({ title: "Email and password required", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, {
      firstName: signupFirstName.trim(),
      lastName: signupLastName.trim(),
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Account created",
      description:
        "Check your email to confirm. If the link does nothing, add this site’s URL under Supabase → Authentication → URL Configuration → Redirect URLs (including http://localhost:8080/** for local dev).",
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
                  <div className="relative mt-1.5">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full rounded-l-none px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="signup-first-name">First name</Label>
                    <Input
                      id="signup-first-name"
                      type="text"
                      placeholder="Juan"
                      value={signupFirstName}
                      onChange={(e) => setSignupFirstName(e.target.value)}
                      className="mt-1.5"
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-last-name">Last name</Label>
                    <Input
                      id="signup-last-name"
                      type="text"
                      placeholder="Dela Cruz"
                      value={signupLastName}
                      onChange={(e) => setSignupLastName(e.target.value)}
                      className="mt-1.5"
                      autoComplete="family-name"
                    />
                  </div>
                </div>
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
                  <div className="relative mt-1.5">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full rounded-l-none px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowSignupPassword((v) => !v)}
                      aria-label={showSignupPassword ? "Hide password" : "Show password"}
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
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
