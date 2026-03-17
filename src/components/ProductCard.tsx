import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";
import { getProductImage } from "@/data/productImages";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const image = getProductImage(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.2, 0, 0, 1] }}
    >
      <Link to={`/product/${product.slug}`} className="group block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted image-outline">
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-sm bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
              {product.badge}
            </span>
          )}
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="font-mono-price text-sm text-muted-foreground">
            {product.priceRange
              ? `${formatPrice(product.priceRange[0])} – ${formatPrice(product.priceRange[1])}`
              : formatPrice(product.price)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
