import type { Prisma, PrismaClient, WebsiteSettings } from "@prisma/client";
import { codeMessage } from "./format";
import { cartToken, orderNumber } from "./passwords";
import {
  memberUnitPrice,
  publicUnitPrice,
  quoteCart,
  type CodeStatus,
  type DiscountRule,
  type Quote,
  type ShippingMethod,
} from "./pricing";

export class CommerceError extends Error {}

export type DiscountStatus = CodeStatus | "inactive" | "expired" | "limit" | "customer_limit" | "missing";

const cartInclude = {
  items: {
    include: {
      product: { include: { images: { orderBy: { position: "asc" as const } }, category: true, collections: true } },
      variant: true,
    },
  },
} satisfies Prisma.CartInclude;

type LoadedCart = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export async function addCartItem(prisma: PrismaClient, cartId: string, variantId: string, quantity: number) {
  const qty = Math.floor(quantity);
  if (!Number.isFinite(qty) || qty < 1 || qty > 10) throw new CommerceError("Choose a quantity between 1 and 10.");
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || !variant.product.published) throw new CommerceError("This piece is no longer available.");
  const existing = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  const next = Math.min(variant.stock, (existing?.quantity ?? 0) + qty, 10);
  if (next < 1) throw new CommerceError("This size is sold out.");
  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: next } });
  } else {
    await prisma.cartItem.create({ data: { cartId, productId: variant.productId, variantId, quantity: next } });
  }
  return { quantity: next, capped: next < (existing?.quantity ?? 0) + qty };
}

export async function updateCartItem(prisma: PrismaClient, cartId: string, itemId: string, quantity: number) {
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId }, include: { variant: true } });
  if (!item) return;
  const qty = Math.floor(quantity);
  if (qty < 1) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return;
  }
  const next = Math.min(item.variant.stock, qty, 10);
  if (next < 1) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return;
  }
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: next } });
}

export async function removeCartItem(prisma: PrismaClient, cartId: string, itemId: string) {
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
}

export async function setCartDiscount(prisma: PrismaClient, cartId: string, rawCode: string | null) {
  if (!rawCode) {
    await prisma.cart.update({ where: { id: cartId }, data: { discountCode: null } });
    return { ok: true as const };
  }
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,32}$/.test(code)) return { ok: false as const, error: "We could not find that code." };
  const discount = await prisma.discount.findUnique({ where: { code } });
  if (!discount) return { ok: false as const, error: "We could not find that code." };
  await prisma.cart.update({ where: { id: cartId }, data: { discountCode: code } });
  return { ok: true as const };
}

export async function mergeCarts(prisma: PrismaClient, userId: string, guestToken: string | null) {
  let userCart = await prisma.cart.findUnique({ where: { userId }, include: { items: true } });
  if (!userCart) {
    userCart = await prisma.cart.create({ data: { userId }, include: { items: true } });
  }
  if (guestToken) {
    const guest = await prisma.cart.findUnique({ where: { token: guestToken }, include: { items: true } });
    if (guest && guest.id !== userCart.id && !guest.userId) {
      for (const item of guest.items) {
        await addCartItem(prisma, userCart.id, item.variantId, item.quantity).catch(() => undefined);
      }
      if (!userCart.discountCode && guest.discountCode) {
        await prisma.cart.update({ where: { id: userCart.id }, data: { discountCode: guest.discountCode } });
      }
      await prisma.cart.delete({ where: { id: guest.id } });
    }
  }
  if (!userCart.token) {
    await prisma.cart.update({ where: { id: userCart.id }, data: { token: cartToken() } });
  }
  return prisma.cart.findUnique({ where: { id: userCart.id } });
}

async function evaluateCode(
  prisma: PrismaClient,
  rawCode: string | null,
  ctx: { userId: string | null; email: string | null },
): Promise<{ discountId: string; rule: DiscountRule } | { status: DiscountStatus }> {
  if (!rawCode) return { status: "none" };
  const code = rawCode.trim().toUpperCase();
  const discount = await prisma.discount.findUnique({ where: { code } });
  if (!discount) return { status: "missing" };
  const now = new Date();
  if (!discount.active || (discount.startsAt && discount.startsAt > now)) return { status: "inactive" };
  if (discount.expiresAt && discount.expiresAt < now) return { status: "expired" };
  if (discount.usageLimit != null && discount.usedCount >= discount.usageLimit) return { status: "limit" };
  const or: Prisma.DiscountUsageWhereInput[] = [];
  if (ctx.userId) or.push({ userId: ctx.userId });
  if (ctx.email) or.push({ email: ctx.email.toLowerCase() });
  if (discount.perCustomerLimit != null && or.length > 0) {
    const uses = await prisma.discountUsage.count({ where: { discountId: discount.id, OR: or } });
    if (uses >= discount.perCustomerLimit) return { status: "customer_limit" };
  }
  return {
    discountId: discount.id,
    rule: {
      type: discount.type,
      value: discount.value,
      minPurchase: discount.minPurchase,
      productIds: discount.productIds,
      collectionIds: discount.collectionIds,
      categoryIds: discount.categoryIds,
    },
  };
}

export function buildQuote(
  cart: LoadedCart,
  settings: WebsiteSettings,
  isMember: boolean,
  rule: DiscountRule | null,
  shippingMethod: ShippingMethod,
) {
  const lines = cart.items
    .filter((item) => item.product.published)
    .map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      categoryId: item.product.categoryId,
      collectionIds: item.product.collections.map((entry) => entry.collectionId),
      quantity: item.quantity,
      unitPublicPrice: publicUnitPrice(item.product.price, item.product.salePrice, item.variant.price),
    }));
  return quoteCart({
    lines,
    isMember,
    memberPercent: settings.memberDiscountPercent,
    code: rule,
    stackDiscounts: settings.stackDiscounts,
    shippingMethod,
    shippingFlat: settings.shippingFlat,
    shippingExpressExtra: settings.shippingExpressExtra,
    shippingFreeOver: settings.shippingFreeOver,
    taxRateBps: settings.taxRateBps,
    taxInclusive: settings.taxInclusive,
  });
}

export async function loadCartQuote(
  prisma: PrismaClient,
  cartId: string | null,
  settings: WebsiteSettings,
  viewer: { id: string; email: string } | null,
  shippingMethod: ShippingMethod = "standard",
) {
  if (!cartId) return emptyCart(settings, Boolean(viewer));
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude });
  if (!cart) return emptyCart(settings, Boolean(viewer));
  const evaluated = await evaluateCode(prisma, cart.discountCode, { userId: viewer?.id ?? null, email: viewer?.email ?? null });
  const rule = "rule" in evaluated ? evaluated.rule : null;
  const quote = buildQuote(cart, settings, Boolean(viewer), rule, shippingMethod);
  const status: DiscountStatus = "status" in evaluated && evaluated.status !== "none" ? evaluated.status : quote.codeStatus;
  const minPurchase = "rule" in evaluated ? evaluated.rule.minPurchase : 0;
  return presentCart(cart, settings, quote, status, Boolean(viewer), minPurchase);
}

function emptyCart(settings: WebsiteSettings, isMember: boolean) {
  const quote = quoteCart({
    lines: [],
    isMember,
    memberPercent: settings.memberDiscountPercent,
    code: null,
    stackDiscounts: settings.stackDiscounts,
    shippingMethod: "standard",
    shippingFlat: settings.shippingFlat,
    shippingExpressExtra: settings.shippingExpressExtra,
    shippingFreeOver: settings.shippingFreeOver,
    taxRateBps: settings.taxRateBps,
    taxInclusive: settings.taxInclusive,
  });
  return {
    id: null as string | null,
    items: [] as CartLine[],
    quote,
    code: null as string | null,
    codeStatus: "none" as DiscountStatus,
    codeMessage: null as string | null,
    currency: settings.currency,
    isMember,
    memberPercent: settings.memberDiscountPercent,
    minPurchaseNote: false,
  };
}

type CartLine = {
  id: string;
  quantity: number;
  name: string;
  slug: string;
  image: string | null;
  size: string | null;
  color: string | null;
  unitPublic: number;
  unitPrice: number;
  linePublic: number;
  lineCharged: number;
  stock: number;
  variantId: string;
};

function presentCart(
  cart: LoadedCart,
  settings: WebsiteSettings,
  quote: Quote,
  status: DiscountStatus,
  isMember: boolean,
  minPurchase = 0,
) {
  const priced = new Map(quote.lines.map((line) => [line.variantId, line]));
  const items: CartLine[] = cart.items.map((item) => {
    const line = priced.get(item.variantId);
    const unitPublic = publicUnitPrice(item.product.price, item.product.salePrice, item.variant.price);
    return {
      id: item.id,
      quantity: item.quantity,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.images[0]?.url ?? null,
      size: item.variant.size,
      color: item.variant.color,
      unitPublic,
      unitPrice: line?.unitPrice ?? memberUnitPrice(unitPublic, isMember, settings.memberDiscountPercent),
      linePublic: line?.linePublic ?? unitPublic * item.quantity,
      lineCharged: line?.lineCharged ?? unitPublic * item.quantity,
      stock: item.variant.stock,
      variantId: item.variantId,
    };
  });
  return {
    id: cart.id,
    items,
    quote,
    code: cart.discountCode,
    codeStatus: status,
    codeMessage: cart.discountCode ? codeMessage(status, settings.currency, minPurchase) : null,
    currency: settings.currency,
    isMember,
    memberPercent: settings.memberDiscountPercent,
    minPurchaseNote: status === "min_purchase",
  };
}

export type AddressSnapshot = {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export async function placeOrder(
  prisma: PrismaClient,
  input: {
    cartId: string;
    userId: string | null;
    email: string;
    phone: string;
    isMember: boolean;
    shipping: AddressSnapshot;
    billing: AddressSnapshot;
    shippingMethod: ShippingMethod;
    idempotencyKey: string;
    mode: "stripe" | "test";
  },
) {
  const existing = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) {
    if (existing.email !== input.email.toLowerCase()) throw new CommerceError("This checkout has already been used.");
    return existing;
  }
  const settings = await prisma.websiteSettings.findUnique({ where: { id: "default" } });
  if (!settings) throw new CommerceError("The atelier is not ready for orders yet.");
  const cart = await prisma.cart.findUnique({ where: { id: input.cartId }, include: cartInclude });
  if (!cart || cart.items.length === 0) throw new CommerceError("Your bag is empty.");
  if (cart.items.some((item) => !item.product.published)) {
    throw new CommerceError("A piece in your bag is no longer available. Remove it to continue.");
  }
  const evaluated = await evaluateCode(prisma, cart.discountCode, { userId: input.userId, email: input.email });
  const rule = "rule" in evaluated ? evaluated.rule : null;
  const quote = buildQuote(cart, settings, input.isMember, rule, input.shippingMethod);
  if (quote.lines.length === 0) throw new CommerceError("The pieces in your bag are no longer available.");
  if (quote.total < 50) throw new CommerceError("The order total is below the minimum we can accept.");

  const payableLines = cart.items.filter((item) => quote.lines.some((line) => line.variantId === item.variantId));
  for (const item of payableLines) {
    if (item.quantity > item.variant.stock) {
      throw new CommerceError(`${item.product.name} does not have enough pieces in that size.`);
    }
  }

  let number = orderNumber();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const clash = await prisma.order.findUnique({ where: { number } });
    if (!clash) break;
    number = orderNumber();
  }

  const useCode = quote.codeStatus === "applied" || quote.codeStatus === "replaced_member";
  const discountId = useCode && "discountId" in evaluated ? evaluated.discountId : null;

  const order = await prisma.$transaction(async (tx) => {
    for (const item of payableLines) {
      const updated = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count !== 1) throw new CommerceError(`${item.product.name} just sold out in that size.`);
    }
    if (discountId) {
      const discount = await tx.discount.findUnique({ where: { id: discountId } });
      if (!discount) throw new CommerceError("This code is no longer available.");
      if (discount.usageLimit != null) {
        const updated = await tx.discount.updateMany({
          where: { id: discountId, active: true, usedCount: { lt: discount.usageLimit } },
          data: { usedCount: { increment: 1 } },
        });
        if (updated.count !== 1) throw new CommerceError("This code has reached its usage limit.");
      } else {
        await tx.discount.update({ where: { id: discountId }, data: { usedCount: { increment: 1 } } });
      }
    }
    const created = await tx.order.create({
      data: {
        number,
        userId: input.userId,
        email: input.email.toLowerCase(),
        phone: input.phone,
        status: input.mode === "test" ? "PROCESSING" : "PENDING",
        paymentStatus: input.mode === "test" ? "TEST" : "PENDING",
        currency: settings.currency,
        subtotal: quote.publicSubtotal,
        memberDiscount: quote.memberDiscount,
        codeDiscount: quote.codeDiscount,
        discountTotal: quote.discountTotal,
        shippingTotal: quote.shipping,
        taxTotal: quote.tax,
        total: quote.total,
        discountCode: useCode ? cart.discountCode : null,
        discountId,
        shippingMethod: input.shippingMethod,
        shippingAddress: input.shipping,
        billingAddress: input.billing,
        idempotencyKey: input.idempotencyKey,
        items: {
          create: payableLines.map((item) => {
            const line = quote.lines.find((entry) => entry.variantId === item.variantId)!;
            return {
              productId: item.productId,
              variantId: item.variantId,
              name: item.product.name,
              sku: item.variant.sku,
              image: item.product.images[0]?.url,
              unitPrice: line.unitPrice,
              quantity: item.quantity,
              lineTotal: line.lineCharged,
              size: item.variant.size,
              color: item.variant.color,
            };
          }),
        },
      },
    });
    if (discountId) {
      await tx.discountUsage.create({
        data: { discountId, userId: input.userId, orderId: created.id, email: input.email.toLowerCase() },
      });
    }
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { discountCode: null } });
    return created;
  });
  return order;
}

export type CartView = Awaited<ReturnType<typeof loadCartQuote>>;

export async function restoreOrderStock(prisma: PrismaClient, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.stockRestored) return order;
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (!item.variantId) continue;
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } }).catch(() => undefined);
    }
    if (order.discountId) {
      await tx.discount.update({ where: { id: order.discountId }, data: { usedCount: { decrement: 1 } } }).catch(() => undefined);
      await tx.discountUsage.deleteMany({ where: { orderId: order.id } });
    }
    await tx.order.update({ where: { id: order.id }, data: { stockRestored: true } });
  });
  return prisma.order.findUnique({ where: { id: orderId } });
}

export async function cancelOrder(prisma: PrismaClient, orderId: string, note?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new CommerceError("Order not found.");
  if (order.status === "CANCELLED") return order;
  await restoreOrderStock(prisma, orderId);
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      notes: note ? [order.notes, note].filter(Boolean).join("\n") : order.notes,
    },
  });
}
