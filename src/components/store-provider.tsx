"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { sampleProducts, type Product } from "@/lib/products";

type CartLine = { productId: string; quantity: number };
type CartItem = { product: Product; quantity: number };
type StoreContextValue = {
  products: Product[];
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  refreshProducts: () => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const STORAGE_KEY = "mini-mini-cart-v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(sampleProducts);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  const refreshProducts = async () => {
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as Product[];
        if (data.length) setProducts(data);
      }
    } catch {
      setProducts(sampleProducts);
    }
  };

  useEffect(() => {
    window.queueMicrotask(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as CartLine[];
          if (Array.isArray(parsed)) setCart(parsed.filter((line) => line.productId && line.quantity > 0));
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setReady(true);
    });
    window.setTimeout(() => void refreshProducts(), 0);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, ready]);

  const cartItems = cart.flatMap((line) => {
    const product = products.find((entry) => entry.id === line.productId);
    return product ? [{ product, quantity: line.quantity }] : [];
  });
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const addToCart = (productId: string, quantity = 1) => {
    const product = products.find((entry) => entry.id === productId);
    if (!product || product.stock < 1) return;
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (existing) return current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(product.stock, line.quantity + quantity) } : line);
      return [...current, { productId, quantity: Math.min(product.stock, quantity) }];
    });
  };

  const setQuantity = (productId: string, quantity: number) => {
    const product = products.find((entry) => entry.id === productId);
    if (!product || quantity < 1) {
      setCart((current) => current.filter((line) => line.productId !== productId));
      return;
    }
    setCart((current) => current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(product.stock, quantity) } : line));
  };

  const removeFromCart = (productId: string) => setCart((current) => current.filter((line) => line.productId !== productId));

  return <StoreContext.Provider value={{ products, cartItems, cartCount, cartTotal, addToCart, setQuantity, removeFromCart, clearCart: () => setCart([]), refreshProducts }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}