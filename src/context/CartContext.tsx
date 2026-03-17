import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Product } from "@/data/products";
import { getProductById } from "@/data/products";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string, quantity: number) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  cartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function dbRowToCartItem(row: { product_id: string; size: string; quantity: number }): CartItem | null {
  const product = getProductById(row.product_id);
  if (!product) return null;
  return { product, size: row.size, quantity: row.quantity };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setCartLoading(false);
      return;
    }
    setCartLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("product_id, size, quantity")
      .eq("user_id", user.id);
    setCartLoading(false);
    if (error) {
      console.error("Failed to fetch cart:", error);
      setItems([]);
      return;
    }
    const cartItems = (data ?? [])
      .map((row) => dbRowToCartItem(row))
      .filter((item): item is CartItem => item !== null);
    setItems(cartItems);
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setCartLoading(false);
      return;
    }
    fetchCart();
  }, [isAuthenticated, fetchCart]);

  const addItem = useCallback(
    async (product: Product, size: string, quantity: number) => {
      if (!user?.id) return;
      const { data: existing } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .eq("size", size)
        .maybeSingle();
      const newQty = (existing?.quantity ?? 0) + quantity;
      if (existing != null) {
        await supabase
          .from("cart_items")
          .update({ quantity: newQty })
          .eq("user_id", user.id)
          .eq("product_id", product.id)
          .eq("size", size);
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: product.id,
          size,
          quantity: newQty,
        });
      }
      fetchCart();
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
      fetchCart();
    },
    [user?.id, fetchCart, removeItem]
  );

  const clearCart = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setItems([]);
  }, [user?.id]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
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
