"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { getViewer } from "@/lib/viewer";
import { ensureCart } from "@/lib/session-cart";
import { CommerceError, cancelOrder, placeOrder, type AddressSnapshot } from "@/lib/commerce";
import { paymentsActive, createCheckoutSession } from "@/lib/stripe-events";
import { addressSchema, emailSchema } from "@/lib/validators";
import { clientKey, rateLimit } from "@/lib/rate-limit";

function isNextRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT");
}

const checkoutSchema = z.object({
  email: emailSchema,
  phone: z.string().trim().min(6, "Enter a phone number.").max(40),
  shippingMethod: z.enum(["standard", "express"]),
  idempotencyKey: z.string().trim().min(8).max(80),
  same: z.boolean(),
});

function readAddress(formData: FormData, prefix: string) {
  return addressSchema.safeParse({
    fullName: formData.get(`${prefix}fullName`),
    line1: formData.get(`${prefix}line1`),
    line2: formData.get(`${prefix}line2`),
    city: formData.get(`${prefix}city`),
    region: formData.get(`${prefix}region`),
    postalCode: formData.get(`${prefix}postalCode`),
    country: formData.get(`${prefix}country`),
    phone: formData.get(`${prefix}phone`),
  });
}

function snapshot(address: z.infer<typeof addressSchema>): AddressSnapshot {
  return {
    fullName: address.fullName,
    line1: address.line1,
    line2: address.line2 || undefined,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone || undefined,
  };
}

export async function checkoutAction(formData: FormData) {
  const headerStore = await headers();
  const emailGuess = String(formData.get("email") || "");
  if (!rateLimit(clientKey(headerStore, "checkout", emailGuess), 10, 60 * 60 * 1000).ok) {
    return { error: "Too many checkout attempts. Please wait and try again." };
  }
  const parsed = checkoutSchema.safeParse({
    email: formData.get("email"),
    phone: formData.get("phone"),
    shippingMethod: formData.get("shippingMethod"),
    idempotencyKey: formData.get("idempotencyKey"),
    same: formData.get("same") !== "0",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the checkout details." };
  const shippingResult = readAddress(formData, "ship_");
  if (!shippingResult.success) return { error: shippingResult.error.issues[0]?.message || "Check the shipping address." };
  const billingResult = parsed.data.same ? shippingResult : readAddress(formData, "bill_");
  if (!billingResult.success) return { error: billingResult.error.issues[0]?.message || "Check the billing address." };

  const prisma = await getPrisma();
  const viewer = await getViewer();
  const cart = await ensureCart(prisma, viewer?.id ?? null);
  const mode = paymentsActive() ? "stripe" : "test";
  try {
    const order = await placeOrder(prisma, {
      cartId: cart.id,
      userId: viewer?.id ?? null,
      email: parsed.data.email,
      phone: parsed.data.phone,
      isMember: Boolean(viewer),
      shipping: snapshot(shippingResult.data),
      billing: snapshot(billingResult.data),
      shippingMethod: parsed.data.shippingMethod,
      idempotencyKey: parsed.data.idempotencyKey,
      mode,
    });
    const key = order.idempotencyKey ?? parsed.data.idempotencyKey;
    if (mode === "test") {
      redirect(`/checkout/confirmation?order=${order.number}&key=${key}`);
    }
    const full = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
    const session = await createCheckoutSession({
      id: order.id,
      number: order.number,
      email: order.email,
      currency: order.currency,
      total: order.total,
      idempotencyKey: key,
      summary: full?.items.map((item) => `${item.name} × ${item.quantity}`).join(", ") || order.number,
    });
    if (!session?.url) throw new Error("Stripe did not return a checkout link.");
    await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    redirect(session.url);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof CommerceError) return { error: error.message };
    const pending = await prisma.order.findUnique({ where: { idempotencyKey: parsed.data.idempotencyKey } });
    if (pending && pending.paymentStatus === "PENDING") {
      await cancelOrder(prisma, pending.id, "Payment could not be started.");
    }
    return { error: "Payment could not be started. No charge was made, and any reserved pieces were released." };
  }
}
