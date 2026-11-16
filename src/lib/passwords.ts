import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";

export function hashPassword(password: string) {
  return hash(password, 12);
}

export function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export function newSecretToken() {
  const raw = randomBytes(32).toString("hex");
  const hashed = createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function orderNumber() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let value = "AUV-";
  for (let index = 0; index < bytes.length; index += 1) {
    value += alphabet[bytes[index]! % alphabet.length];
  }
  return value;
}

export function cartToken() {
  return randomBytes(24).toString("hex");
}
