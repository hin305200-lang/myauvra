import Link from "next/link";
import { CartLineControls } from "@/components/site/cart-controls";
import { loadCartQuote } from "@/lib/commerce";
import { MEMBER_NOTE } from "@/lib/copy";
import { getPrisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { findRequestCart } from "@/lib/session-cart";
import { getSettings } from "@/lib/settings";
import { getViewer } from "@/lib/viewer";
import { applyDiscountAction, clearDiscountAction } from "@/server/store-actions";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit";

export const metadata = { title: "Your bag" };

export default async function CartPage() {
  const prisma = await getPrisma();
  const [settings, viewer] = await Promise.all([getSettings(), getViewer()]);
  const record = await findRequestCart(prisma, viewer?.id ?? null);
  const cart = await loadCartQuote(prisma, record?.id ?? null, settings, viewer);
  return (
    <div className="section">
      <h1 className="display" style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}>Your bag</h1>
      {cart.items.length === 0 ? (
        <div>
          <p>Nothing here yet.</p>
          <Link className="btn btn-ink" href="/shop">Shop the collection</Link>
        </div>
      ) : (
        <div className="shop-layout">
          <div>
            {cart.items.map((item) => (
              <div key={item.id} className="panel" style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: "1rem", marginBottom: "0.8rem" }}>
                {item.image ? <img src={item.image} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} /> : <div className="bg-sand" />}
                <div>
                  <Link href={`/product/${item.slug}`}>{item.name}</Link>
                  <p className="price">{[item.color, item.size].filter(Boolean).join(" · ")}</p>
                  <p>{item.unitPublic !== item.unitPrice ? <s>{formatMoney(item.unitPublic, cart.currency)}</s> : null} {formatMoney(item.unitPrice, cart.currency)}</p>
                  <CartLineControls itemId={item.id} quantity={item.quantity} />
                </div>
              </div>
            ))}
          </div>
          <aside className="panel">
            {!cart.isMember && cart.memberPercent > 0 ? <p className="member-note">{MEMBER_NOTE}</p> : null}
            <p>Merchandise {formatMoney(cart.quote.publicSubtotal, cart.currency)}</p>
            {cart.quote.memberDiscount > 0 ? <p>Member pricing −{formatMoney(cart.quote.memberDiscount, cart.currency)}</p> : null}
            {cart.quote.codeDiscount > 0 ? <p>Code −{formatMoney(cart.quote.codeDiscount, cart.currency)}</p> : null}
            <p>Shipping {cart.quote.shipping === 0 ? "Complimentary" : formatMoney(cart.quote.shipping, cart.currency)}</p>
            <p>Tax {formatMoney(cart.quote.tax, cart.currency)}</p>
            <p><strong>Total {formatMoney(cart.quote.total, cart.currency)}</strong></p>
            <ActionForm action={applyDiscountAction} success="Code saved.">
              <input className="field" name="code" placeholder="Discount code" defaultValue={cart.code || ""} aria-label="Discount code" />
              <div style={{ marginTop: "0.5rem" }}><SubmitButton pendingLabel="Applying">Apply code</SubmitButton></div>
            </ActionForm>
            {cart.code ? <form action={clearDiscountAction}><button className="btn btn-ghost" type="submit">Remove code</button></form> : null}
            {cart.codeMessage ? <p className="price">{cart.codeMessage}</p> : null}
            <Link className="btn btn-ink" href="/checkout">Checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
