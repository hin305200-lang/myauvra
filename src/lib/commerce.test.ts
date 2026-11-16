import Stripe from "stripe";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authenticate, registerCustomer } from "./accounts";
import { addCartItem, placeOrder, type AddressSnapshot } from "./commerce";
import { createTestPrisma } from "./db";
import { ensureSettings } from "./bootstrap";
import { deleteProduct, saveProduct } from "./products-admin";
import { applyStripeEvent, verifyStripeWebhook } from "./stripe-events";
import type { PrismaClient } from "@prisma/client";

const address: AddressSnapshot = {
  fullName: "Ada Lumen",
  line1: "1 Atelier Lane",
  city: "Dubai",
  region: "Dubai",
  postalCode: "00000",
  country: "United Arab Emirates",
};

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = await createTestPrisma();
  await ensureSettings(prisma);
  await prisma.websiteSettings.update({
    where: { id: "default" },
    data: { memberDiscountPercent: 10, taxRateBps: 0, shippingFlat: 2500, shippingFreeOver: 50000, stackDiscounts: false, currency: "USD" },
  });
}, 30000);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("accounts, catalog, cart, and payments", () => {
  it("registers a customer, rejects a bad password, and never promotes them", async () => {
    const created = await registerCustomer(prisma, { name: "Ada Lumen", email: "ada@example.com", password: "Secret123" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.user.role).toBe("CUSTOMER");
    expect(await authenticate(prisma, "ada@example.com", "wrong-pass")).toMatchObject({ ok: false });
    const signedIn = await authenticate(prisma, "ada@example.com", "Secret123");
    expect(signedIn.ok).toBe(true);
    const stored = await prisma.user.findUnique({ where: { email: "ada@example.com" } });
    expect(stored?.role).toBe("CUSTOMER");
    expect(stored?.passwordHash).not.toContain("Secret123");
  });

  it("creates, edits, prices, orders, and deletes a piece", async () => {
    const category = await prisma.category.create({ data: { name: "Rings", slug: "rings-test" } });
    const created = await saveProduct(prisma, {
      name: "Test band",
      slug: "test-band",
      description: "A narrow band for the test bench.",
      details: "",
      price: 100,
      salePrice: null,
      material: "18k yellow gold",
      gemstone: "",
      categoryId: category.id,
      collectionIds: [],
      featured: true,
      bestSeller: false,
      isNew: true,
      published: true,
      metaTitle: "",
      metaDescription: "",
      images: [{ url: "https://images.example.com/band.jpg", alt: "Band" }],
      variants: [{ sku: "TEST-BAND", size: "6", color: "Gold", colorHex: "#C5A46D", stock: 3, price: null }],
    });
    expect(created?.price).toBe(10000);
    const edited = await saveProduct(prisma, {
      name: "Test band revised",
      slug: "test-band",
      description: "A narrow band for the test bench.",
      details: "",
      price: 100,
      salePrice: null,
      material: "18k yellow gold",
      gemstone: "",
      categoryId: category.id,
      collectionIds: [],
      featured: true,
      bestSeller: false,
      isNew: true,
      published: true,
      metaTitle: "",
      metaDescription: "",
      images: [{ url: "https://images.example.com/band.jpg", alt: "Band" }],
      variants: [{ sku: "TEST-BAND", size: "6", color: "Gold", colorHex: "#C5A46D", stock: 3, price: null }],
    }, created!.id);
    expect(edited?.name).toBe("Test band revised");

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "ada@example.com" } });
    const cart = await prisma.cart.create({ data: { userId: user.id } });
    await addCartItem(prisma, cart.id, created!.variants[0].id, 1);
    const order = await placeOrder(prisma, {
      cartId: cart.id,
      userId: user.id,
      email: user.email,
      phone: "0500000000",
      isMember: true,
      shipping: address,
      billing: address,
      shippingMethod: "standard",
      idempotencyKey: "order-key-1",
      mode: "test",
    });
    expect(order.memberDiscount).toBe(1000);
    expect(order.subtotal).toBe(10000);
    expect(order.shippingTotal).toBe(2500);
    expect(order.total).toBe(11500);
    expect(order.paymentStatus).toBe("TEST");
    const again = await placeOrder(prisma, {
      cartId: cart.id,
      userId: user.id,
      email: user.email,
      phone: "0500000000",
      isMember: true,
      shipping: address,
      billing: address,
      shippingMethod: "standard",
      idempotencyKey: "order-key-1",
      mode: "test",
    });
    expect(again.id).toBe(order.id);
    const stock = await prisma.productVariant.findUnique({ where: { sku: "TEST-BAND" } });
    expect(stock?.stock).toBe(2);

    const guestCart = await prisma.cart.create({ data: {} });
    await prisma.productVariant.update({ where: { sku: "TEST-BAND" }, data: { stock: 2 } });
    await addCartItem(prisma, guestCart.id, created!.variants[0].id, 1);
    const guestOrder = await placeOrder(prisma, {
      cartId: guestCart.id,
      userId: null,
      email: "guest@example.com",
      phone: "0500000001",
      isMember: false,
      shipping: address,
      billing: address,
      shippingMethod: "standard",
      idempotencyKey: "order-key-guest",
      mode: "stripe",
    });
    expect(guestOrder.memberDiscount).toBe(0);
    expect(guestOrder.total).toBe(12500);
    expect(guestOrder.paymentStatus).toBe("PENDING");

    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
    const stripe = new Stripe("sk_test_123");
    const payload = JSON.stringify({
      id: "evt_test_1",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test",
          object: "checkout.session",
          payment_status: "paid",
          amount_total: guestOrder.total,
          currency: "usd",
          metadata: { orderId: guestOrder.id },
          payment_intent: "pi_test",
        },
      },
    });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test_secret" });
    const event = verifyStripeWebhook(payload, signature);
    const paid = await applyStripeEvent(prisma, event);
    expect(paid.status).toBe("paid");
    const duplicate = await applyStripeEvent(prisma, event);
    expect(duplicate.status).toBe("duplicate");
    expect(() => verifyStripeWebhook(payload, "t=1,v1=bad")).toThrow();

    const mismatchCart = await prisma.cart.create({ data: {} });
    await addCartItem(prisma, mismatchCart.id, created!.variants[0].id, 1);
    const mismatchOrder = await placeOrder(prisma, {
      cartId: mismatchCart.id,
      userId: null,
      email: "guest2@example.com",
      phone: "0500000002",
      isMember: false,
      shipping: address,
      billing: address,
      shippingMethod: "standard",
      idempotencyKey: "order-key-mismatch",
      mode: "stripe",
    });
    const mismatchPayload = JSON.stringify({
      id: "evt_test_2",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { payment_status: "paid", amount_total: 1, currency: "usd", metadata: { orderId: mismatchOrder.id } } },
    });
    const mismatchEvent = verifyStripeWebhook(
      mismatchPayload,
      stripe.webhooks.generateTestHeaderString({ payload: mismatchPayload, secret: "whsec_test_secret" }),
    );
    const mismatch = await applyStripeEvent(prisma, mismatchEvent);
    expect(mismatch.status).toBe("mismatch");
    const failed = await prisma.order.findUnique({ where: { id: mismatchOrder.id } });
    expect(failed?.paymentStatus).toBe("FAILED");

    await deleteProduct(prisma, created!.id);
    expect(await prisma.product.findUnique({ where: { id: created!.id } })).toBeNull();
  });
});
