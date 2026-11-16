import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { addCartItem, buildQuote, cancelOrder } from "@/lib/commerce";
import { getPrisma } from "@/lib/db";
import { ensureCart, findRequestCart } from "@/lib/session-cart";
import { getSettings } from "@/lib/settings";
import { paymentsActive } from "@/lib/stripe-events";
import { getViewer } from "@/lib/viewer";
import { loadCartQuote } from "@/lib/commerce";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const cancelled = typeof params.cancelled === "string" ? params.cancelled : "";
  const key = typeof params.key === "string" ? params.key : "";
  const prisma = await getPrisma();
  const [settings, viewer] = await Promise.all([getSettings(), getViewer()]);
  if (cancelled && key) {
    const order = await prisma.order.findFirst({
      where: { number: cancelled, idempotencyKey: key, status: "PENDING", paymentStatus: "PENDING" },
      include: { items: true },
    });
    if (order) {
      await cancelOrder(prisma, order.id, "Checkout was cancelled before payment.");
      const cart = await ensureCart(prisma, viewer?.id ?? order.userId);
      for (const item of order.items) {
        if (item.variantId) await addCartItem(prisma, cart.id, item.variantId, item.quantity).catch(() => undefined);
      }
    }
  }
  const record = await findRequestCart(prisma, viewer?.id ?? null);
  const cart = await loadCartQuote(prisma, record?.id ?? null, settings, viewer, "standard");
  if (!record || cart.items.length === 0) {
    return (
      <div className="section">
        <h1 className="display" style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}>Your bag is empty</h1>
        <Link className="btn btn-ink" href="/shop">Return to the collection</Link>
      </div>
    );
  }
  const loaded = await prisma.cart.findUnique({
    where: { id: record.id },
    include: { items: { include: { product: { include: { collections: true } }, variant: true } } },
  });
  const express = loaded ? buildQuote(loaded, settings, Boolean(viewer), null, "express") : cart.quote;
  const standard = cart.quote;
  return (
    <div className="section">
      <p className="eyebrow">Checkout</p>
      <h1 className="serif" style={{ fontSize: "clamp(3rem, 6vw, 4.6rem)", fontWeight: 500 }}>Complete your order</h1>
      {cancelled ? <p className="form-error">Payment was cancelled. Reserved pieces have been released, and your bag has been restored.</p> : null}
      <CheckoutForm
        email={viewer?.email}
        phone={viewer?.phone}
        currency={settings.currency}
        quotes={{ standard, express: { ...standard, shipping: express.shipping, tax: express.tax, total: express.total } }}
        testMode={!paymentsActive()}
        codeMessage={cart.codeMessage}
      />
    </div>
  );
}
