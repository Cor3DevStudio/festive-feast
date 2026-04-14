import { Link } from "react-router-dom";
import { Phone, Mail, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useProfile } from "@/hooks/useProfile";
import UserHeaderMenu from "@/components/UserHeaderMenu";

export default function Header() {
  const { totalItems } = useCart();
  const { profile } = useProfile();
  const isAdmin = !!profile?.is_admin;

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Top bar */}
      <div className="bg-foreground">
        <div className="container mx-auto flex items-center justify-between px-6 py-2 text-sm text-background/80">
          <div className="flex items-center gap-4">
            <a href="tel:+639000000000" className="flex items-center gap-1.5 hover:text-background transition-colors">
              <Phone className="h-3.5 w-3.5" />
              +63 900 000 0000
            </a>
            <a href="mailto:info@christmasdecors.ph" className="hidden items-center gap-1.5 sm:flex hover:text-background transition-colors">
              <Mail className="h-3.5 w-3.5" />
              info@christmasdecors.ph
            </a>
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

          {!isAdmin && (
            <nav className="hidden items-center gap-8 md:flex">
              <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Home
              </Link>
              <Link to="/shop" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Shop
              </Link>
              <Link to="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                About
              </Link>
              <Link to="/contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Contact
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-2">
            {!isAdmin && (
              <Link
                to="/cart"
                aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] px-0.5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold leading-none text-primary-foreground">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>
            )}

            <UserHeaderMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
