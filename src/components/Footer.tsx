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
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" /> info@christmasdecors.ph
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" /> +63 900 000 0000
              </p>
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
              <li><a href="#" className="transition-colors hover:text-background">About us</a></li>
              <li><a href="#" className="transition-colors hover:text-background">Blog</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/40">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="transition-colors hover:text-background">My account</a></li>
              <li><a href="#" className="transition-colors hover:text-background">Orders</a></li>
              <li><a href="#" className="transition-colors hover:text-background">Privacy policy</a></li>
              <li><a href="#" className="transition-colors hover:text-background">Terms of service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-background/10 pt-8 text-center text-xs text-background/40">
          © {new Date().getFullYear()} Christmas Decors PH. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
