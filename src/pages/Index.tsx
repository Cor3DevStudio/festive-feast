import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useProducts } from "@/context/ProductsContext";
import HeroSection from "@/components/HeroSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Index() {
  const { products, productsLoading } = useProducts();
  const featured = products.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <WhyChooseUs />

      {/* Featured products */}
      <section className="bg-muted/50 py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
                Featured collection
              </h2>
              <p className="mt-2 text-muted-foreground">Our most popular holiday decor picks.</p>
            </div>
            <Link
              to="/shop"
              className="hidden text-sm font-medium text-primary underline underline-offset-4 sm:inline"
            >
              View all →
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {productsLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square rounded-lg bg-muted" />
                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-4 w-1/3 rounded bg-muted" />
                    </div>
                  </div>
                ))
              : featured.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/shop"
              className="text-sm font-medium text-primary underline underline-offset-4"
            >
              View all products →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          >
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              Ready to light up your home?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Explore our full collection and find the perfect parol, lights, and decor for your Filipino Christmas celebration.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-block rounded-md bg-primary px-10 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Shop the Collection
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
