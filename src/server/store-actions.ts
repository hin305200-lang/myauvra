"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { getPrisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getViewer } from "@/lib/viewer";
import { ensureCart, findRequestCart } from "@/lib/session-cart";
import { addCartItem, removeCartItem, setCartDiscount, updateCartItem } from "@/lib/commerce";
import { CommerceError } from "@/lib/commerce";
import {
  authenticate,
  issueVerification,
  registerCustomer,
  requestPasswordReset,
  resetPassword,
  verifyEmailToken,
} from "@/lib/accounts";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { safeCallback } from "@/lib/format";
import {
  addressSchema,
  contactSchema,
  emailChangeSchema,
  loginSchema,
  newsletterSchema,
  passwordChangeSchema,
  profileSchema,
  registerSchema,
  reviewSchema,
} from "@/lib/validators";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { revalidatePath } from "next/cache";

function isNextRedirect(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT");
}

async function refreshShop() {
  revalidatePath("/", "layout");
}

export async function addToCartAction(variantId: string, quantity: number) {
  const prisma = await getPrisma();
  const viewer = await getViewer();
  const cart = await ensureCart(prisma, viewer?.id ?? null);
  try {
    await addCartItem(prisma, cart.id, variantId, quantity);
  } catch (error) {
    return { error: error instanceof CommerceError ? error.message : "Could not add this piece." };
  }
  await refreshShop();
  return { ok: true as const };
}

export async function updateCartQuantityAction(itemId: string, quantity: number) {
  const prisma = await getPrisma();
  const viewer = await getViewer();
  const cart = await findRequestCart(prisma, viewer?.id ?? null);
  if (!cart) return;
  await updateCartItem(prisma, cart.id, itemId, quantity);
  await refreshShop();
}

export async function removeCartItemAction(itemId: string) {
  const prisma = await getPrisma();
  const viewer = await getViewer();
  const cart = await findRequestCart(prisma, viewer?.id ?? null);
  if (!cart) return;
  await removeCartItem(prisma, cart.id, itemId);
  await refreshShop();
}

export async function applyDiscountAction(formData: FormData) {
  const prisma = await getPrisma();
  const viewer = await getViewer();
  const cart = await ensureCart(prisma, viewer?.id ?? null);
  const code = String(formData.get("code") || "");
  const result = await setCartDiscount(prisma, cart.id, code || null);
  await refreshShop();
  if (!result.ok) return { error: result.error };
  return { ok: true as const };
}

export async function clearDiscountAction() {
  const prisma = await getPrisma();
  const viewer = await getViewer();
  const cart = await findRequestCart(prisma, viewer?.id ?? null);
  if (!cart) return;
  await setCartDiscount(prisma, cart.id, null);
  await refreshShop();
}

export async function toggleWishlistAction(productId: string) {
  const viewer = await getViewer();
  if (!viewer) redirect("/account/login?callbackUrl=/wishlist");
  const prisma = await getPrisma();
  const wishlist = await prisma.wishlist.upsert({
    where: { userId: viewer.id },
    update: {},
    create: { userId: viewer.id },
  });
  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });
  if (existing) await prisma.wishlistItem.delete({ where: { id: existing.id } });
  else await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
  await refreshShop();
  return { wished: !existing };
}

export async function newsletterAction(formData: FormData) {
  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid email address." };
  const headerStore = await headers();
  if (!rateLimit(clientKey(headerStore, "newsletter", parsed.data.email), 5, 60 * 60 * 1000).ok) {
    return { error: "Please wait before subscribing again." };
  }
  const prisma = await getPrisma();
  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email },
  });
  return { ok: true as const };
}

export async function contactAction(formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the form." };
  const headerStore = await headers();
  if (!rateLimit(clientKey(headerStore, "contact", parsed.data.email), 5, 60 * 60 * 1000).ok) {
    return { error: "Please wait a little before sending another note." };
  }
  const prisma = await getPrisma();
  await prisma.contactMessage.create({ data: parsed.data });
  return { ok: true as const };
}

export async function reviewAction(productId: string, formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/account/login?callbackUrl=/product/${productId}`);
  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check your review." };
  const prisma = await getPrisma();
  const product = await prisma.product.findFirst({ where: { id: productId, published: true } });
  if (!product) return { error: "This piece is no longer available." };
  await prisma.review.upsert({
    where: { productId_userId: { productId, userId: viewer.id } },
    update: { rating: parsed.data.rating, title: parsed.data.title || null, body: parsed.data.body, published: true },
    create: { productId, userId: viewer.id, rating: parsed.data.rating, title: parsed.data.title || null, body: parsed.data.body },
  });
  revalidatePath(`/product/${product.slug}`);
  return { ok: true as const };
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the form." };
  if (!process.env.AUTH_SECRET) return { error: "Accounts are not configured yet. Add AUTH_SECRET." };
  const headerStore = await headers();
  if (!rateLimit(clientKey(headerStore, "register", parsed.data.email), 5, 60 * 60 * 1000).ok) {
    return { error: "Too many attempts. Please wait and try again." };
  }
  const prisma = await getPrisma();
  const created = await registerCustomer(prisma, parsed.data);
  if (!created.ok) return { error: created.error };
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/account?welcome=1",
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AuthError) return { error: "Your account was created. Please sign in." };
    throw error;
  }
  return { link: created.verification.link };
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the form." };
  if (!process.env.AUTH_SECRET) return { error: "Sign-in is not configured yet. Add AUTH_SECRET." };
  const headerStore = await headers();
  if (!rateLimit(clientKey(headerStore, "login", parsed.data.email), 8, 15 * 60 * 1000).ok) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }
  const prisma = await getPrisma();
  const result = await authenticate(prisma, parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.error };
  const destination = safeCallback(String(formData.get("callbackUrl") || ""), "/account");
  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: destination });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AuthError) return { error: "The email or password is not right." };
    throw error;
  }
}

export async function adminLoginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the form." };
  if (!process.env.AUTH_SECRET) return { error: "Admin sign-in needs AUTH_SECRET in the environment." };
  const headerStore = await headers();
  if (!rateLimit(clientKey(headerStore, "admin-login", parsed.data.email), 8, 15 * 60 * 1000).ok) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }
  const prisma = await getPrisma();
  const result = await authenticate(prisma, parsed.data.email, parsed.data.password);
  if (!result.ok || result.user.role !== "ADMIN") {
    return { error: "These credentials are not for the atelier desk." };
  }
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallback(String(formData.get("callbackUrl") || ""), "/admin"),
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AuthError) return { error: "These credentials are not for the atelier desk." };
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = loginSchema.pick({ email: true }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter the email on your account." };
  const headerStore = await headers();
  if (!rateLimit(clientKey(headerStore, "reset", parsed.data.email), 5, 60 * 60 * 1000).ok) {
    return { error: "Please wait before requesting another link." };
  }
  const prisma = await getPrisma();
  const result = await requestPasswordReset(prisma, parsed.data.email);
  return { ok: true as const, link: result.link };
}

export async function resetPasswordAction(formData: FormData) {
  const prisma = await getPrisma();
  const result = await resetPassword(prisma, String(formData.get("token") || ""), String(formData.get("password") || ""));
  if (!result.ok) return { error: result.error };
  redirect("/account/login?reset=1");
}

export async function verifyEmailAction(token: string) {
  const prisma = await getPrisma();
  return verifyEmailToken(prisma, token);
}

export async function resendVerificationAction() {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sign in to confirm your email." };
  const prisma = await getPrisma();
  const result = await issueVerification(prisma, viewer.id, viewer.email);
  return { ok: true as const, link: result.link, delivered: result.delivered };
}

export async function updateProfileAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/account/login");
  const parsed = profileSchema.safeParse({ name: formData.get("name"), phone: formData.get("phone") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the form." };
  const prisma = await getPrisma();
  await prisma.user.update({
    where: { id: viewer.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });
  revalidatePath("/account");
  return { ok: true as const };
}

export async function changePasswordAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/account/login");
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    nextPassword: formData.get("nextPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the password." };
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({ where: { id: viewer.id } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "The current password is not right." };
  }
  await prisma.user.update({ where: { id: viewer.id }, data: { passwordHash: await hashPassword(parsed.data.nextPassword) } });
  return { ok: true as const };
}

export async function changeEmailAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/account/login");
  const parsed = emailChangeSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid email address." };
  const prisma = await getPrisma();
  const taken = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (taken && taken.id !== viewer.id) return { error: "That email is already in use." };
  await prisma.user.update({ where: { id: viewer.id }, data: { email: parsed.data.email, emailVerified: null } });
  const verification = await issueVerification(prisma, viewer.id, parsed.data.email);
  revalidatePath("/account");
  return { ok: true as const, link: verification.link };
}

export async function saveAddressAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/account/login");
  const parsed = addressSchema.safeParse({
    label: formData.get("label"),
    fullName: formData.get("fullName"),
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    phone: formData.get("phone"),
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the address." };
  const prisma = await getPrisma();
  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId: viewer.id }, data: { isDefault: false } });
  }
  const id = String(formData.get("id") || "");
  const data = {
    label: parsed.data.label || null,
    fullName: parsed.data.fullName,
    line1: parsed.data.line1,
    line2: parsed.data.line2 || null,
    city: parsed.data.city,
    region: parsed.data.region,
    postalCode: parsed.data.postalCode,
    country: parsed.data.country,
    phone: parsed.data.phone || null,
    isDefault: Boolean(parsed.data.isDefault),
  };
  if (id) {
    const owned = await prisma.address.findFirst({ where: { id, userId: viewer.id } });
    if (!owned) return { error: "Address not found." };
    await prisma.address.update({ where: { id }, data });
  } else {
    await prisma.address.create({ data: { ...data, userId: viewer.id } });
  }
  revalidatePath("/account/addresses");
  return { ok: true as const };
}

export async function deleteAddressAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/account/login");
  const prisma = await getPrisma();
  await prisma.address.deleteMany({ where: { id: String(formData.get("id") || ""), userId: viewer.id } });
  revalidatePath("/account/addresses");
}

export async function getMemberPricingContext() {
  const [viewer, settings] = await Promise.all([getViewer(), getSettings()]);
  return { isMember: Boolean(viewer), memberPercent: settings.memberDiscountPercent, currency: settings.currency };
}
