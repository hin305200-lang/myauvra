"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { requireAdmin } from "@/lib/viewer";
import { deleteProduct, saveProduct } from "@/lib/products-admin";
import { cancelOrder } from "@/lib/commerce";
import { storeImage } from "@/lib/uploads";
import { discountInputSchema, dollarsToCents, productInputSchema, safeImageUrl } from "@/lib/validators";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { passwordSchema } from "@/lib/validators";
import { stripeClient } from "@/lib/stripe-events";

async function logAdmin(adminId: string, action: string, entity?: string, entityId?: string, meta?: Prisma.InputJsonValue) {
  const prisma = await getPrisma();
  await prisma.adminActivityLog.create({ data: { adminId, action, entity, entityId, meta } });
}

function refreshCatalog() {
  revalidatePath("/", "layout");
}

export async function saveProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") || ""));
  } catch {
    return { error: "The product form could not be read." };
  }
  const parsed = productInputSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the product details." };
  const files = formData.getAll("files").filter((file): file is File => file instanceof File && file.size > 0);
  try {
    const images = [...parsed.data.images];
    for (const file of files) {
      const url = await storeImage(file);
      images.push({ url, alt: parsed.data.name });
    }
    const id = String(formData.get("id") || "") || undefined;
    const product = await saveProduct(prisma, { ...parsed.data, images }, id);
    await logAdmin(admin.id, id ? "product.update" : "product.create", "product", product?.id);
    refreshCatalog();
    redirect("/admin/products");
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw error;
    return { error: error instanceof Error ? error.message : "The product could not be saved." };
  }
}

export async function deleteProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const id = String(formData.get("id") || "");
  await deleteProduct(prisma, id);
  await logAdmin(admin.id, "product.delete", "product", id);
  refreshCatalog();
  redirect("/admin/products");
}

export async function saveCategoryAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  if (!name || !slug) return { error: "Name and slug are required." };
  const description = String(formData.get("description") || "").trim() || null;
  const image = String(formData.get("image") || "").trim();
  if (image && !safeImageUrl(image)) return { error: "Use a valid image URL." };
  const id = String(formData.get("id") || "");
  if (id) {
    await prisma.category.update({ where: { id }, data: { name, slug, description, image: image || null } });
  } else {
    await prisma.category.create({ data: { name, slug, description, image: image || null } });
  }
  await logAdmin(admin.id, "category.save", "category", id || slug);
  refreshCatalog();
  return { ok: true as const };
}

export async function deleteCategoryAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const id = String(formData.get("id") || "");
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) return { error: "Move or delete the pieces in this category first." };
  await prisma.category.delete({ where: { id } });
  await logAdmin(admin.id, "category.delete", "category", id);
  refreshCatalog();
}

export async function saveCollectionAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  if (!name || !slug) return { error: "Name and slug are required." };
  const image = String(formData.get("image") || "").trim();
  if (image && !safeImageUrl(image)) return { error: "Use a valid image URL." };
  const data = {
    name,
    slug,
    description: String(formData.get("description") || "").trim() || null,
    image: image || null,
    featured: formData.get("featured") === "on",
    position: Number(formData.get("position") || 0) || 0,
  };
  const id = String(formData.get("id") || "");
  if (id) await prisma.collection.update({ where: { id }, data });
  else await prisma.collection.create({ data });
  await logAdmin(admin.id, "collection.save", "collection", id || slug);
  refreshCatalog();
  return { ok: true as const };
}

export async function deleteCollectionAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const id = String(formData.get("id") || "");
  await prisma.collection.delete({ where: { id } });
  await logAdmin(admin.id, "collection.delete", "collection", id);
  refreshCatalog();
}

export async function updateOrderAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const id = String(formData.get("id") || "");
  const status = z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).parse(formData.get("status"));
  const trackingNumber = String(formData.get("trackingNumber") || "").trim() || null;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "Order not found." };
  if (status === "CANCELLED") {
    await cancelOrder(prisma, id, "Cancelled from the atelier desk.");
  } else {
    await prisma.order.update({ where: { id }, data: { status, trackingNumber } });
  }
  if (trackingNumber && status !== "CANCELLED") {
    await prisma.order.update({ where: { id }, data: { trackingNumber } });
  }
  await logAdmin(admin.id, "order.update", "order", id, { status });
  revalidatePath("/admin/orders");
  revalidatePath(`/account/orders/${order.number}`);
  return { ok: true as const };
}

export async function markPaidAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const id = String(formData.get("id") || "");
  await prisma.order.update({
    where: { id },
    data: { paymentStatus: "PAID", status: "PROCESSING" },
  });
  await logAdmin(admin.id, "order.markPaid", "order", id);
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true as const };
}

export async function refundOrderAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const id = String(formData.get("id") || "");
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "Order not found." };
  const stripe = stripeClient();
  if (order.stripePaymentIntentId && stripe) {
    await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
  }
  await cancelOrder(prisma, id, "Refunded from the atelier desk.");
  await prisma.order.update({ where: { id }, data: { paymentStatus: "REFUNDED" } });
  await logAdmin(admin.id, "order.refund", "order", id);
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true as const };
}

export async function suspendCustomerAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const id = String(formData.get("id") || "");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role === "ADMIN") return { error: "That account cannot be suspended here." };
  await prisma.user.update({ where: { id }, data: { suspended: formData.get("suspended") === "1" } });
  await logAdmin(admin.id, "customer.suspend", "user", id, { suspended: formData.get("suspended") === "1" });
  revalidatePath(`/admin/customers/${id}`);
  return { ok: true as const };
}

export async function verifyCustomerAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const id = String(formData.get("id") || "");
  await prisma.user.update({ where: { id }, data: { emailVerified: new Date() } });
  await logAdmin(admin.id, "customer.verify", "user", id);
  revalidatePath(`/admin/customers/${id}`);
}

export async function grantAdminAction(formData: FormData) {
  const admin = await requireAdmin();
  if (String(formData.get("confirm") || "") !== "GRANT") return { error: "Type GRANT to confirm." };
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "No account uses that email." };
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN", suspended: false, emailVerified: user.emailVerified ?? new Date() } });
  await logAdmin(admin.id, "admin.grant", "user", user.id);
  return { ok: true as const };
}

export async function saveDiscountAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") || ""));
  } catch {
    return { error: "The discount could not be read." };
  }
  const parsed = discountInputSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the discount." };
  if (parsed.data.type === "PERCENTAGE" && (parsed.data.value < 1 || parsed.data.value > 90)) {
    return { error: "Percentage codes must be between 1 and 90." };
  }
  const data = {
    code: parsed.data.code.trim().toUpperCase(),
    type: parsed.data.type,
    value: parsed.data.type === "FIXED" ? dollarsToCents(parsed.data.value) : Math.round(parsed.data.value),
    description: parsed.data.description || null,
    minPurchase: dollarsToCents(parsed.data.minPurchase),
    usageLimit: parsed.data.usageLimit,
    perCustomerLimit: parsed.data.perCustomerLimit,
    startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    active: parsed.data.active,
    productIds: parsed.data.productIds,
    collectionIds: parsed.data.collectionIds,
    categoryIds: parsed.data.categoryIds,
  };
  const id = String(formData.get("id") || "");
  if (id) await prisma.discount.update({ where: { id }, data });
  else await prisma.discount.create({ data });
  await logAdmin(admin.id, "discount.save", "discount", id || data.code);
  revalidatePath("/admin/discounts");
  refreshCatalog();
  return { ok: true as const };
}

export async function deleteDiscountAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const id = String(formData.get("id") || "");
  await prisma.discount.delete({ where: { id } });
  await logAdmin(admin.id, "discount.delete", "discount", id);
  revalidatePath("/admin/discounts");
}

export async function saveSettingsAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const percent = Number(formData.get("memberDiscountPercent"));
  if (!Number.isFinite(percent) || percent < 0 || percent > 90) return { error: "Member discount must be between 0 and 90." };
  const currency = String(formData.get("currency") || "USD").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Use a three-letter currency code." };
  const fontPair = String(formData.get("fontPair") || "cormorant");
  if (!["cormorant", "playfair", "fraunces"].includes(fontPair)) return { error: "Choose a type pairing." };
  const logo = String(formData.get("logoUrl") || "").trim();
  const favicon = String(formData.get("faviconUrl") || "").trim();
  const heroImage = String(formData.get("heroImage") || "").trim();
  for (const url of [logo, favicon, heroImage].filter(Boolean)) {
    if (!safeImageUrl(url)) return { error: "Image addresses must be http(s) or /uploads/." };
  }
  const logoFile = formData.get("logoFile");
  const heroFile = formData.get("heroFile");
  let logoUrl = logo || null;
  let hero = heroImage;
  if (logoFile instanceof File && logoFile.size > 0) logoUrl = await storeImage(logoFile);
  if (heroFile instanceof File && heroFile.size > 0) hero = await storeImage(heroFile);
  if (!hero) return { error: "The homepage needs a hero image." };
  await prisma.websiteSettings.update({
    where: { id: "default" },
    data: {
      brandName: String(formData.get("brandName") || "Auvra").slice(0, 80),
      tagline: String(formData.get("tagline") || "").slice(0, 180),
      logoUrl,
      faviconUrl: favicon || null,
      colorBackground: String(formData.get("colorBackground") || "#FAF8F3"),
      colorSecondary: String(formData.get("colorSecondary") || "#F0EBE2"),
      colorGold: String(formData.get("colorGold") || "#C5A46D"),
      colorText: String(formData.get("colorText") || "#24211E"),
      colorMuted: String(formData.get("colorMuted") || "#81796F"),
      fontPair,
      announcementEnabled: formData.get("announcementEnabled") === "on",
      announcementText: String(formData.get("announcementText") || "").slice(0, 240),
      announcementLink: String(formData.get("announcementLink") || "").slice(0, 240) || null,
      heroImage: hero,
      heroTitle: String(formData.get("heroTitle") || "").slice(0, 160),
      heroSubtitle: String(formData.get("heroSubtitle") || "").slice(0, 400),
      heroButtonLabel: String(formData.get("heroButtonLabel") || "Shop").slice(0, 40),
      heroButtonHref: String(formData.get("heroButtonHref") || "/shop").slice(0, 240),
      heroSecondaryLabel: String(formData.get("heroSecondaryLabel") || "").slice(0, 40) || null,
      heroSecondaryHref: String(formData.get("heroSecondaryHref") || "").slice(0, 240) || null,
      footerAbout: String(formData.get("footerAbout") || "").slice(0, 800),
      contactEmail: String(formData.get("contactEmail") || "").slice(0, 160),
      contactPhone: String(formData.get("contactPhone") || "").slice(0, 40),
      contactAddress: String(formData.get("contactAddress") || "").slice(0, 240),
      instagram: String(formData.get("instagram") || "") || null,
      pinterest: String(formData.get("pinterest") || "") || null,
      facebook: String(formData.get("facebook") || "") || null,
      currency,
      taxRateBps: Math.max(0, Math.round(Number(formData.get("taxPercent") || 0) * 100)),
      taxInclusive: formData.get("taxInclusive") === "on",
      shippingFlat: dollarsToCents(Number(formData.get("shippingFlat") || 0)),
      shippingExpressExtra: dollarsToCents(Number(formData.get("shippingExpressExtra") || 0)),
      shippingFreeOver: dollarsToCents(Number(formData.get("shippingFreeOver") || 0)),
      memberDiscountPercent: Math.round(percent),
      stackDiscounts: formData.get("stackDiscounts") === "on",
      legalName: String(formData.get("legalName") || "").slice(0, 160),
      legalAddress: String(formData.get("legalAddress") || "").slice(0, 300),
      materialOptions: String(formData.get("materialOptions") || "").split(",").map((item) => item.trim()).filter(Boolean),
      gemstoneOptions: String(formData.get("gemstoneOptions") || "").split(",").map((item) => item.trim()).filter(Boolean),
    },
  });
  await logAdmin(admin.id, "settings.update", "settings", "default");
  refreshCatalog();
  return { ok: true as const };
}

export async function saveSectionAction(formData: FormData) {
  const admin = await requireAdmin();
  const prisma = await getPrisma();
  const id = String(formData.get("id") || "");
  let extra: Prisma.InputJsonValue | undefined;
  const rawExtra = String(formData.get("extra") || "");
  if (rawExtra) {
    try {
      extra = JSON.parse(rawExtra) as Prisma.InputJsonValue;
    } catch {
      return { error: "The extra content is not valid JSON." };
    }
  }
  await prisma.homepageSection.update({
    where: { id },
    data: {
      title: String(formData.get("title") || "") || null,
      subtitle: String(formData.get("subtitle") || "") || null,
      body: String(formData.get("body") || "") || null,
      image: String(formData.get("image") || "") || null,
      ctaLabel: String(formData.get("ctaLabel") || "") || null,
      ctaHref: String(formData.get("ctaHref") || "") || null,
      enabled: formData.get("enabled") === "on",
      position: Number(formData.get("position") || 0) || 0,
      ...(extra ? { extra } : {}),
    },
  });
  await logAdmin(admin.id, "section.update", "section", id);
  refreshCatalog();
  return { ok: true as const };
}

export async function markMessageReadAction(formData: FormData) {
  await requireAdmin();
  const prisma = await getPrisma();
  await prisma.contactMessage.update({ where: { id: String(formData.get("id") || "") }, data: { read: true } });
  revalidatePath("/admin/messages");
}

export async function changeAdminPasswordAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = passwordSchema.safeParse(String(formData.get("nextPassword") || ""));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Choose a stronger password." };
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({ where: { id: admin.id } });
  if (!user || !(await verifyPassword(String(formData.get("currentPassword") || ""), user.passwordHash))) {
    return { error: "The current password is not right." };
  }
  await prisma.user.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(parsed.data) } });
  await logAdmin(admin.id, "admin.password", "user", admin.id);
  return { ok: true as const };
}
