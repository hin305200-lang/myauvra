import type { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { cancelOrder } from "./commerce";

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim());
}

export function paymentsActive() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function verifyStripeWebhook(payload: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("Stripe webhook secret is not configured.");
  const stripe = stripeClient() ?? new Stripe("sk_test_placeholder");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

type EventLike = {
  type: string;
  data: { object: unknown };
};

export async function applyStripeEvent(prisma: PrismaClient, event: EventLike) {
  const object = asRecord(event.data.object);
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    return fulfillCheckout(prisma, object);
  }
  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const orderId = stringValue(object.metadata, "orderId") || stringValue(object, "client_reference_id");
    if (!orderId) return { status: "ignored" as const };
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentStatus === "PAID") return { status: "ignored" as const };
    await cancelOrder(prisma, order.id, "Payment was not completed.");
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    return { status: "cancelled" as const };
  }
  return { status: "ignored" as const };
}

async function fulfillCheckout(prisma: PrismaClient, session: Record<string, unknown>) {
  const orderId = stringValue(session.metadata, "orderId");
  if (!orderId) return { status: "ignored" as const };
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { status: "ignored" as const };
  if (order.paymentStatus === "PAID") return { status: "duplicate" as const };
  const paymentStatus = stringValue(session, "payment_status");
  if (paymentStatus && paymentStatus !== "paid") return { status: "pending" as const };
  const amount = numberValue(session.amount_total);
  const currency = stringValue(session, "currency")?.toUpperCase();
  if (amount !== order.total || (currency && currency !== order.currency.toUpperCase())) {
    await cancelOrder(prisma, order.id, "Payment amount did not match the order. The charge was not accepted as paid.");
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
    return { status: "mismatch" as const };
  }
  const paymentIntent = session.payment_intent;
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      status: order.status === "PENDING" ? "PROCESSING" : order.status,
      stripeSessionId: stringValue(session, "id"),
      stripePaymentIntentId: typeof paymentIntent === "string" ? paymentIntent : order.stripePaymentIntentId,
    },
  });
  return { status: "paid" as const };
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringValue(source: unknown, key: string) {
  if (!source || typeof source !== "object") return undefined;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

export async function createCheckoutSession(order: {
  id: string;
  number: string;
  email: string;
  currency: string;
  total: number;
  idempotencyKey: string | null;
  summary: string;
}) {
  const stripe = stripeClient();
  if (!stripe) return null;
  const { appUrl } = await import("./format");
  const origin = appUrl();
  const key = order.idempotencyKey ? `&key=${order.idempotencyKey}` : "";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id, orderNumber: order.number },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: order.currency.toLowerCase(),
          unit_amount: order.total,
          product_data: {
            name: `Auvra ${order.number}`,
            description: order.summary.slice(0, 500),
          },
        },
      },
    ],
    success_url: `${origin}/checkout/confirmation?order=${encodeURIComponent(order.number)}${key}`,
    cancel_url: `${origin}/checkout?cancelled=${encodeURIComponent(order.number)}&key=${encodeURIComponent(order.idempotencyKey || "")}`,
  });
  return session;
}
