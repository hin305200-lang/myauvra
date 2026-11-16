import { cookies } from "next/headers";
import type { PrismaClient } from "@prisma/client";
import { cartToken } from "./passwords";

export const CART_COOKIE = "auvra_cart";

export function cartCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function findRequestCart(prisma: PrismaClient, userId: string | null) {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (userId) {
    const own = await prisma.cart.findUnique({ where: { userId } });
    if (own) return own;
  }
  if (!token) return null;
  const guest = await prisma.cart.findUnique({ where: { token } });
  if (guest?.userId && guest.userId !== userId) return null;
  return guest;
}

export async function ensureCart(prisma: PrismaClient, userId: string | null) {
  const existing = await findRequestCart(prisma, userId);
  if (existing) return existing;
  const token = cartToken();
  const cart = await prisma.cart.create({ data: { token, userId } });
  const jar = await cookies();
  jar.set(CART_COOKIE, token, cartCookieOptions());
  return cart;
}
