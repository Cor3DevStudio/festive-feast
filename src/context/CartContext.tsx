import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { Product } from "@/data/products";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { supabase } from "@/lib/supabase";

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

interface RawRow {
  product_id: string;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string, quantity: number) => Promise<void>;
  removeItem: (productId: string, size: string) => void;
  removeLines: (lines: Array<{ productId: string; size: string }>) => Promise<void>;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  cartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { products, productsLoading, getProductById } = useProducts();

  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);

  const cartLoading = productsLoading || rowsLoading;

  // Derive cart items reactively from raw DB rows + loaded products
  const items = useMemo<CartItem[]>(() => {
    if (productsLoading) return [];
    return rawRows
      .map((row) => {
        const product = getProductById(String(row.product_id));
        if (!product) return null;
        return { product, size: row.size, quantity: row.quantity };
      })
      .filter((item): item is CartItem => item !== null);
  }, [rawRows, productsLoading, getProductById, products]);

  const fetchCart = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!user?.id) {
        setRawRows([]);
        setRowsLoading(false);
        return;
      }
      if (!opts?.silent) setRowsLoading(true);
      const { data, error } = await supabase
        .from("cart_items")
        .select("product_id, size, quantity")
        .eq("user_id", user.id);
      if (!opts?.silent) setRowsLoading(false);
      if (error) {
        console.error("Failed to fetch cart:", error);
        setRawRows([]);
        return;
      }
      setRawRows(data ?? []);
    },
    [user?.id]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setRawRows([]);
      setRowsLoading(false);
      return;
    }
    fetchCart();
  }, [isAuthenticated, fetchCart]);

  const addItem = useCallback(
    async (product: Product, size: string, quantity: number) => {
      if (!user?.id) return;
      const pid = String(product.id);
      // Read current qty from DB — local rawRows can be stale and cause INSERT → 409 Conflict
      // on unique (user_id, product_id, size).
      const { data: current } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id)
        .eq("product_id", pid)
        .eq("size", size)
        .maybeSingle();
      const newQty = (current?.quantity ?? 0) + quantity;
      const { error } = await supabase.from("cart_items").upsert(
        {
          user_id: user.id,
          product_id: pid,
          size,
          quantity: newQty,
        },
        { onConflict: "user_id,product_id,size" }
      );
      if (error) console.error("cart_items upsert failed:", error);
      await fetchCart({ silent: true });
    },
    [user?.id, fetchCart]
  );

  const removeItem = useCallback(
    async (productId: string, size: string) => {
      if (!user?.id) return;
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .eq("size", size);
      fetchCart();
    },
    [user?.id, fetchCart]
  );

  const removeLines = useCallback(
    async (lines: Array<{ productId: string; size: string }>) => {
      if (!user?.id || lines.length === 0) return;
      for (const { productId, size } of lines) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId)
          .eq("size", size);
      }
      await fetchCart({ silent: true });
    },
    [user?.id, fetchCart]
  );

  const updateQuantity = useCallback(
    async (productId: string, size: string, quantity: number) => {
      if (!user?.id) return;
      if (quantity <= 0) {
        removeItem(productId, size);
        return;
      }
      await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .eq("size", size);
      await fetchCart({ silent: true });
    },
    [user?.id, fetchCart, removeItem]
  );

  const clearCart = useCallback(async () => {
    if (!user?.id) {
      setRawRows([]);
      return;
    }
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setRawRows([]);
  }, [user?.id]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    removeLines,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    cartLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
