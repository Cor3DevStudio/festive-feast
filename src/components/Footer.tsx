import { Link } from "react-router-dom";
import { MapPin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-background">
              Christmas Decors PH
            </h3>
            <p className="text-sm leading-relaxed text-background/60">
              Parols, festive lights, and holiday decor from Quezon City. Bringing the warmth of Filipino Christmas to every home.
            </p>
            <div className="space-y-2 pt-2 text-sm text-background/50">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" /> Quezon City, Philippines
              </p>
              <a href="mailto:info@christmasdecors.ph" className="flex items-center gap-2 hover:text-background/80 transition-colors">
                <Mail className="h-4 w-4 shrink-0" /> info@christmasdecors.ph
              </a>
              <a href="tel:+639000000000" className="flex items-center gap-2 hover:text-background/80 transition-colors">
                <Phone className="h-4 w-4 shrink-0" /> +63 900 000 0000
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/40">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/shop" className="transition-colors hover:text-background">All products</Link></li>
              <li><Link to="/shop?category=parols" className="transition-colors hover:text-background">Parols</Link></li>
              <li><Link to="/shop?category=lights" className="transition-colors hover:text-background">Lights</Link></li>
              <li><Link to="/shop?category=holiday-decor" className="transition-colors hover:text-background">Holiday decor</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/40">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="transition-colors hover:text-background">About us</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-background">Contact</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/40">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/account/profile" className="transition-colors hover:text-background">My profile</Link></li>
              <li><Link to="/account/orders" className="transition-colors hover:text-background">My orders</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-background">Help & FAQ</Link></li>
              <li><Link to="/privacy" className="transition-colors hover:text-background">Privacy policy</Link></li>
              <li><Link to="/terms" className="transition-colors hover:text-background">Terms of service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-background/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-background/40">
          <span>© {new Date().getFullYear()} Christmas Decors PH. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-background/60 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-background/60 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
