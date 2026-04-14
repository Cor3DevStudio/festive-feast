import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Truck, ShieldCheck, Share2, Heart } from "lucide-react";
import { formatPrice } from "@/data/products";
import { getProductImage } from "@/data/productImages";
import { cartLineKey } from "@/lib/cartLineKey";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductsContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { getProductBySlug, productsLoading } = useProducts();
  const { toast } = useToast();
  const product = getProductBySlug(slug || "");

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [descOpen, setDescOpen] = useState(false);

  useEffect(() => {
    if (!product) return;
    if (product.sizes.length === 1) {
      setSelectedSize(product.sizes[0]);
    } else {
      setSelectedSize("");
    }
  }, [product?.id]);

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-10">
          <div className="grid gap-12 lg:grid-cols-5 animate-pulse">
            <div className="lg:col-span-3">
              <div className="aspect-square rounded-lg bg-muted" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 w-3/4 rounded bg-muted" />
              <div className="h-6 w-1/3 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="font-display text-2xl font-semibold">Product not found</h1>
          <Link to="/shop" className="mt-4 inline-block text-sm text-primary underline">
            Back to shop
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const image = getProductImage(product.id);

  function resolvedProduct() {
    const size = selectedSize || product.sizes[0];
    if (product.sizePrices && size && product.sizePrices[size] !== undefined) {
      return { ...product, price: product.sizePrices[size] };
    }
    return product;
  }

  function handleAddToCart() {
    if (!isAuthenticated) {
      toast({ title: "Please log in first", description: "Sign in to add items to your cart.", variant: "destructive" });
      navigate(`/login?returnTo=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    if (product.sizes.length > 0 && !selectedSize) {
      toast({ title: "Please select product variation first", variant: "destructive" });
      return;
    }
    const size = selectedSize || product.sizes[0];
    addItem(resolvedProduct(), size, quantity);
    toast({ title: `${product.name} added to cart`, description: `${size} × ${quantity}` });
  }

  async function handleBuyNow() {
    if (!isAuthenticated) {
      toast({ title: "Please log in first", description: "Sign in to buy now.", variant: "destructive" });
      navigate(`/login?returnTo=${encodeURIComponent(`/product/${product.slug}`)}`);
      return;
    }
    if (product.sizes.length > 0 && !selectedSize) {
      toast({ title: "Please select product variation first", variant: "destructive" });
      return;
    }
    const size = selectedSize || product.sizes[0];
    await addItem(resolvedProduct(), size, quantity);
    navigate("/checkout", {
      state: { lineKeys: [cartLineKey(product.id, size)] },
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-foreground">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-5">
          {/* Image */}
          <div className="lg:col-span-3 lg:sticky lg:top-28 lg:self-start">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted image-outline">
              <img src={image} alt={product.name} className="h-full w-full object-cover" />
              {product.badge && (
                <span className="absolute left-4 top-4 rounded-sm bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  {product.badge}
                </span>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Heart className="h-4 w-4" /> Favorite
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            >
              <h1 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
                {product.name}
              </h1>

              <p className="mt-3 font-mono-price text-xl text-foreground">
                {product.sizePrices && selectedSize
                  ? formatPrice(product.sizePrices[selectedSize] ?? product.price)
                  : product.priceRange
                  ? `${formatPrice(product.priceRange[0])} – ${formatPrice(product.priceRange[1])}`
                  : formatPrice(product.price)}
              </p>

              {product.stockCount && product.stockCount <= 10 && (
                <p className="mt-2 text-sm text-primary font-medium">
                  Only {product.stockCount} left in stock
                </p>
              )}

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
              <button
                onClick={() => setDescOpen(true)}
                className="mt-1 text-sm font-medium text-primary underline underline-offset-4"
              >
                View full description
              </button>

              {/* Size */}
              {product.sizes.length > 0 && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-foreground">Size</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
                          selectedSize === size
                            ? "bg-foreground text-background"
                            : "bg-muted text-foreground hover:bg-muted/80"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mt-6">
                <label className="text-sm font-medium text-foreground">Quantity</label>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted text-foreground hover:bg-muted/80"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-mono-price text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted text-foreground hover:bg-muted/80"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={handleAddToCart}
                  className="rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Add to cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="rounded-md bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Buy now
                </button>
              </div>

              {/* Trust */}
              <div className="mt-8 space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-accent" />
                  Guaranteed delivery before Christmas · Free shipping on orders over ₱1,500
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Free & easy returns · Secure payment
                </p>
              </div>

              {/* Specs */}
              {(product.materials || product.dimensions) && (
                <div className="mt-8 rounded-lg bg-muted p-5 text-sm">
                  <h3 className="font-medium text-foreground">Specifications</h3>
                  <dl className="mt-3 space-y-2 text-muted-foreground">
                    {product.materials && (
                      <div className="flex gap-3">
                        <dt className="font-medium text-foreground/70 w-24 shrink-0">Materials</dt>
                        <dd>{product.materials}</dd>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="flex gap-3">
                        <dt className="font-medium text-foreground/70 w-24 shrink-0">Dimensions</dt>
                        <dd>{product.dimensions}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Full description modal */}
      <AnimatePresence>
        {descOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setDescOpen(false)} />
            <motion.div
              className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-background p-8 shadow-elevated"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            >
              <h2 className="font-display text-xl font-semibold text-foreground">Product Description</h2>
              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.fullDescription}
              </div>
              <button
                onClick={() => setDescOpen(false)}
                className="mt-6 rounded-md bg-muted px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
