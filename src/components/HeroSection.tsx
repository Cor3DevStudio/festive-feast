import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Shield, Truck } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>

      <div className="container relative mx-auto px-6 py-24 md:py-36">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
            Handcrafted Filipino Lanterns
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-background md:text-5xl lg:text-6xl">
            Illuminate your home with the spirit of Pasko
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-background/80">
            Discover our collection of handcrafted parols, festive lights, and holiday decor — made with love in the Philippines, for the most wonderful time of the year.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/shop"
              className="inline-flex items-center rounded-md bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Shop the Collection
            </Link>
          </div>

          {/* Feature lines */}
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-background/60">
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" /> Handcrafted in the Philippines
            </span>
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" /> Authentic parol designs
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-accent" /> Made with love for the season
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
