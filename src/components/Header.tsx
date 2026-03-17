import { Link } from "react-router-dom";
import { Phone, Mail, ShoppingCart, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { isAuthenticated, signOut, user } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Top bar */}
      <div className="bg-foreground">
        <div className="container mx-auto flex items-center justify-between px-6 py-2 text-sm text-background/80">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              +63 900 000 0000
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Mail className="h-3.5 w-3.5" />
              info@christmasdecors.ph
            </span>
          </div>
          <a href="#" className="text-background/60 transition-colors hover:text-background">
            Facebook
          </a>
        </div>
      </div>
      {/* Main nav */}
      <div className="shadow-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight text-foreground">
            Christmas Decors PH
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Home
            </Link>
            <Link to="/shop" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Shop
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user?.email}
              </span>
            ) : null}
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground">
                <LogOut className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <LogIn className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Log in</span>
                </Button>
              </Link>
            )}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
