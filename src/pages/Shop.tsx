import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { categories } from "@/data/products";
import { useProducts } from "@/context/ProductsContext";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CATEGORY_VALUES = new Set(categories.map((c) => c.value));

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { products, productsLoading } = useProducts();

  useEffect(() => {
    const q = searchParams.get("category");
    if (q && CATEGORY_VALUES.has(q)) {
      setActiveCategory(q);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = activeCategory === "all" ? products : products.filter((p) => p.category === activeCategory);
    if (sortBy === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [activeCategory, sortBy, products]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">Shop</h1>
        <p className="mt-2 text-muted-foreground">Browse our complete collection of holiday decor.</p>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat.value
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-sm bg-muted px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent ring-offset-2"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>

        {/* Grid */}
        {productsLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-lg bg-muted" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-foreground">No products match your filters</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your category or clearing filters.</p>
            <button
              onClick={() => setActiveCategory("all")}
              className="mt-4 rounded-sm bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              View all
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
