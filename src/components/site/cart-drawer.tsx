"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { formatMoney } from "@/lib/format";
import { MEMBER_NOTE } from "@/lib/copy";
import { removeCartItemAction, updateCartQuantityAction } from "@/server/store-actions";
import { useRouter } from "next/navigation";

export function CartDrawer() {
  const state = useCart();
  const router = useRouter();
  if (!state) return null;
  const { cart, open, setOpen } = state;
  if (!open) return null;
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <>
      <button className="drawer-overlay" aria-label="Close bag" onClick={() => setOpen(false)} />
      <aside className="drawer" role="dialog" aria-label="Shopping bag">
        <div style={{ display: "flex", justifyContent: "space-between", padding: "1.2rem 1.2rem 0.4rem" }}>
          <h2 className="serif" style={{ margin: 0, fontSize: "2rem", fontWeight: 500 }}>Your bag ({count})</h2>
          <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>Close</button>
        </div>
        <div style={{ overflow: "auto", padding: "1rem 1.2rem", flex: 1 }}>
          {cart.items.length === 0 ? (
            <p>Your bag is empty. The vitrine is still open.</p>
          ) : (
            cart.items.map((item) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
                <div className="frame" style={{ aspectRatio: "1" }}>{item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}</div>
                <div>
                  <Link href={`/product/${item.slug}`} onClick={() => setOpen(false)}>{item.name}</Link>
                  <p className="price">{[item.color, item.size].filter(Boolean).join(" · ")}</p>
                  <p className="price">{formatMoney(item.lineCharged, cart.currency)}</p>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <button className="size-btn" type="button" onClick={async () => { await updateCartQuantityAction(item.id, item.quantity - 1); router.refresh(); }}>-</button>
                    <span>{item.quantity}</span>
                    <button className="size-btn" type="button" onClick={async () => { await updateCartQuantityAction(item.id, item.quantity + 1); router.refresh(); }}>+</button>
                    <button className="btn btn-ghost" type="button" onClick={async () => { await removeCartItemAction(item.id); router.refresh(); }}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ borderTop: "1px solid var(--line)", padding: "1rem 1.2rem 1.4rem" }}>
          {!cart.isMember && cart.memberPercent > 0 ? <p className="member-note">{MEMBER_NOTE}</p> : null}
          <p style={{ display: "flex", justifyContent: "space-between" }}><span>Merchandise</span><span>{formatMoney(cart.quote.publicSubtotal, cart.currency)}</span></p>
          {cart.quote.memberDiscount > 0 ? <p style={{ display: "flex", justifyContent: "space-between" }}><span>Member pricing</span><span>-{formatMoney(cart.quote.memberDiscount, cart.currency)}</span></p> : null}
          {cart.quote.codeDiscount > 0 ? <p style={{ display: "flex", justifyContent: "space-between" }}><span>Code</span><span>-{formatMoney(cart.quote.codeDiscount, cart.currency)}</span></p> : null}
          <p style={{ display: "flex", justifyContent: "space-between" }}><span>Shipping estimate</span><span>{cart.quote.shipping === 0 ? "Complimentary" : formatMoney(cart.quote.shipping, cart.currency)}</span></p>
          {cart.quote.tax > 0 ? <p style={{ display: "flex", justifyContent: "space-between" }}><span>Tax</span><span>{formatMoney(cart.quote.tax, cart.currency)}</span></p> : null}
          <p style={{ display: "flex", justifyContent: "space-between" }}><strong>Total</strong><strong>{formatMoney(cart.quote.total, cart.currency)}</strong></p>
          {cart.codeMessage ? <p className="form-error">{cart.codeMessage}</p> : null}
          <Link className="btn btn-ink" style={{ width: "100%", marginTop: "0.6rem" }} href="/checkout" onClick={() => setOpen(false)}>Checkout</Link>
          <Link className="btn btn-line" style={{ width: "100%", marginTop: "0.5rem" }} href="/cart" onClick={() => setOpen(false)}>Review bag</Link>
        </div>
      </aside>
    </>
  );
}
