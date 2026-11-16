"use client";

import { createContext, useContext, useState } from "react";
import type { CartView } from "@/lib/commerce";
import { CartDrawer } from "./cart-drawer";

const CartContext = createContext<{ cart: CartView; open: boolean; setOpen: (open: boolean) => void } | null>(null);

export function CartProvider({ cart, children }: { cart: CartView; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <CartContext.Provider value={{ cart, open, setOpen }}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
