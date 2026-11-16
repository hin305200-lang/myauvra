"use client";

import { useRouter } from "next/navigation";
import { removeCartItemAction, updateCartQuantityAction } from "@/server/store-actions";

export function CartLineControls({ itemId, quantity }: { itemId: string; quantity: number }) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
      <button className="size-btn" type="button" onClick={async () => { await updateCartQuantityAction(itemId, quantity - 1); router.refresh(); }}>−</button>
      <span>{quantity}</span>
      <button className="size-btn" type="button" onClick={async () => { await updateCartQuantityAction(itemId, quantity + 1); router.refresh(); }}>+</button>
      <button className="btn btn-ghost" type="button" onClick={async () => { await removeCartItemAction(itemId); router.refresh(); }}>Remove</button>
    </div>
  );
}
