"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export type CartItem = {
  variantId: string;
  productId: string;
  nameEn: string;
  nameAr: string;
  size: string;
  colorNameEn: string;
  colorNameAr: string;
  colorHex: string;
  price: number;
  qty: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, qty: number) => void;
  clearCart: () => void;
  totalQty: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "human-cart";

function loadGuestCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  localStorage.removeItem(STORAGE_KEY);
}

function dbRowToItem(row: any): CartItem {
  return {
    variantId: row.variant_id,
    productId: row.product_id,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    size: row.size,
    colorNameEn: row.color_name_en,
    colorNameAr: row.color_name_ar,
    colorHex: row.color_hex,
    price: row.price,
    qty: row.qty,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const mergedForUser = useRef<string | null>(null);

  // Carica il carrello giusto (database se loggato, localStorage se ospite)
  useEffect(() => {
    if (authLoading) return;

    async function load() {
      if (user) {
        // evita di rifare il merge più volte per lo stesso utente nella stessa sessione
        if (mergedForUser.current !== user.id) {
          const guestItems = loadGuestCart();

          if (guestItems.length > 0) {
            for (const gi of guestItems) {
              const { data: existing } = await supabase
                .from("cart_items")
                .select("id, qty")
                .eq("user_id", user.id)
                .eq("variant_id", gi.variantId)
                .maybeSingle();

              if (existing) {
                await supabase
                  .from("cart_items")
                  .update({ qty: existing.qty + gi.qty })
                  .eq("id", existing.id);
              } else {
                await supabase.from("cart_items").insert({
                  user_id: user.id,
                  variant_id: gi.variantId,
                  product_id: gi.productId,
                  name_en: gi.nameEn,
                  name_ar: gi.nameAr,
                  size: gi.size,
                  color_name_en: gi.colorNameEn,
                  color_name_ar: gi.colorNameAr,
                  color_hex: gi.colorHex,
                  price: gi.price,
                  qty: gi.qty,
                });
              }
            }
            clearGuestCart();
          }

          mergedForUser.current = user.id;
        }

        const { data } = await supabase.from("cart_items").select("*").eq("user_id", user.id);
        setItems((data || []).map(dbRowToItem));
      } else {
        mergedForUser.current = null;
        setItems(loadGuestCart());
      }
      setReady(true);
    }

    load();
  }, [user, authLoading]);

  async function addItem(newItem: CartItem) {
    if (user) {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, qty")
        .eq("user_id", user.id)
        .eq("variant_id", newItem.variantId)
        .maybeSingle();

      if (existing) {
        await supabase.from("cart_items").update({ qty: existing.qty + newItem.qty }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          variant_id: newItem.variantId,
          product_id: newItem.productId,
          name_en: newItem.nameEn,
          name_ar: newItem.nameAr,
          size: newItem.size,
          color_name_en: newItem.colorNameEn,
          color_name_ar: newItem.colorNameAr,
          color_hex: newItem.colorHex,
          price: newItem.price,
          qty: newItem.qty,
        });
      }

      const { data } = await supabase.from("cart_items").select("*").eq("user_id", user.id);
      setItems((data || []).map(dbRowToItem));
    } else {
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === newItem.variantId);
        const updated = existing
          ? prev.map((i) => (i.variantId === newItem.variantId ? { ...i, qty: i.qty + newItem.qty } : i))
          : [...prev, newItem];
        saveGuestCart(updated);
        return updated;
      });
    }
  }

  async function removeItem(variantId: string) {
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id).eq("variant_id", variantId);
      setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    } else {
      setItems((prev) => {
        const updated = prev.filter((i) => i.variantId !== variantId);
        saveGuestCart(updated);
        return updated;
      });
    }
  }

  async function updateQty(variantId: string, qty: number) {
    if (qty < 1) return;

    if (user) {
      await supabase.from("cart_items").update({ qty }).eq("user_id", user.id).eq("variant_id", variantId);
      setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, qty } : i)));
    } else {
      setItems((prev) => {
        const updated = prev.map((i) => (i.variantId === variantId ? { ...i, qty } : i));
        saveGuestCart(updated);
        return updated;
      });
    }
  }

  async function clearCart() {
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
    } else {
      clearGuestCart();
    }
    setItems([]);
  }

  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  if (!ready) {
    return (
      <CartContext.Provider value={{ items: [], addItem, removeItem, updateQty, clearCart, totalQty: 0, totalPrice: 0 }}>
        {children}
      </CartContext.Provider>
    );
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalQty, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve essere usato dentro CartProvider");
  return ctx;
}
