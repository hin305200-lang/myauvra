import type { PrismaClient } from "@prisma/client";
import { appUrl } from "./format";
import { devAuthLinksEnabled, sendEmail } from "./mail";
import { hashPassword, hashToken, newSecretToken, verifyPassword } from "./passwords";
import { passwordSchema, registerSchema } from "./validators";

type RegisterInput = { name: string; email: string; password: string };

export async function registerCustomer(prisma: PrismaClient, input: RegisterInput) {
  const parsed = registerSchema.parse(input);
  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) {
    return { ok: false as const, error: "An account with this email already exists." };
  }
  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      name: parsed.name,
      passwordHash: await hashPassword(parsed.password),
      role: "CUSTOMER",
    },
    select: { id: true, email: true, name: true, role: true },
  });
  const verification = await issueVerification(prisma, user.id, user.email);
  return { ok: true as const, user, verification };
}

export async function authenticate(prisma: PrismaClient, email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return { ok: false as const, error: "The email or password is not right." };
  if (user.suspended) return { ok: false as const, error: "This account is suspended. Write to the atelier." };
  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) return { ok: false as const, error: "The email or password is not right." };
  return {
    ok: true as const,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function issueVerification(prisma: PrismaClient, userId: string, email: string) {
  const { raw, hashed } = newSecretToken();
  const identifier = `verify:${userId}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: hashed, expires: new Date(Date.now() + 1000 * 60 * 60 * 24) },
  });
  const link = `${appUrl()}/account/verify?token=${raw}`;
  const sent = await sendEmail({
    to: email,
    subject: "Confirm your Auvra account",
    text: `Confirm your Auvra account:\n${link}\n\nThis link expires in 24 hours.`,
  });
  return { delivered: sent.delivered, link: !sent.delivered && devAuthLinksEnabled() ? link : null };
}

export async function verifyEmailToken(prisma: PrismaClient, rawToken: string) {
  const row = await prisma.verificationToken.findUnique({ where: { token: hashToken(rawToken) } });
  if (!row || row.expires < new Date() || !row.identifier.startsWith("verify:")) {
    return { ok: false as const, error: "This confirmation link is no longer valid." };
  }
  const userId = row.identifier.slice("verify:".length);
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
  await prisma.verificationToken.delete({ where: { token: row.token } });
  return { ok: true as const };
}

export async function requestPasswordReset(prisma: PrismaClient, email: string) {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || user.suspended) return { ok: true as const, link: null as string | null };
  const { raw, hashed } = newSecretToken();
  const identifier = `reset:${normalized}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: hashed, expires: new Date(Date.now() + 1000 * 60 * 60) },
  });
  const link = `${appUrl()}/account/reset?token=${raw}`;
  const sent = await sendEmail({
    to: normalized,
    subject: "Reset your Auvra password",
    text: `Reset your password:\n${link}\n\nThis link expires in one hour. If you did not ask for this, you can ignore the letter.`,
  });
  return { ok: true as const, link: !sent.delivered && devAuthLinksEnabled() ? link : null };
}

export async function resetPassword(prisma: PrismaClient, rawToken: string, nextPassword: string) {
  const parsed = passwordSchema.safeParse(nextPassword);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message || "Choose a stronger password." };
  const row = await prisma.verificationToken.findUnique({ where: { token: hashToken(rawToken) } });
  if (!row || row.expires < new Date() || !row.identifier.startsWith("reset:")) {
    return { ok: false as const, error: "This reset link is no longer valid." };
  }
  const email = row.identifier.slice("reset:".length);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false as const, error: "This reset link is no longer valid." };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data) } });
  await prisma.verificationToken.deleteMany({ where: { identifier: row.identifier } });
  return { ok: true as const };
}

export async function ensureAdmin(prisma: PrismaClient) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || password.length < 8) return { created: false as const };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN" || existing.suspended) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN", suspended: false, emailVerified: existing.emailVerified ?? new Date() },
      });
    }
    return { created: false as const };
  }
  await prisma.user.create({
    data: {
      email,
      name: "Atelier admin",
      passwordHash: await hashPassword(password),
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  return { created: true as const };
}
