import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(160)
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(200)
  .regex(/[A-Za-z]/, "Include a letter.")
  .regex(/[0-9]/, "Include a number.");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name.").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(200),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export const emailChangeSchema = z.object({
  email: emailSchema,
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  nextPassword: passwordSchema,
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().or(z.literal("")),
  fullName: z.string().trim().min(1, "Enter the recipient’s name.").max(120),
  line1: z.string().trim().min(1, "Enter an address.").max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(1, "Enter a city.").max(80),
  region: z.string().trim().min(1, "Enter a region.").max(80),
  postalCode: z.string().trim().min(2, "Enter a postal code.").max(20),
  country: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: emailSchema,
  subject: z.string().trim().min(1).max(140),
  message: z.string().trim().min(10, "Write a short message.").max(4000),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(8, "Share a few words.").max(2000),
});

export const newsletterSchema = z.object({
  email: emailSchema,
});

const dollars = z.number().min(0).max(100000);

export const productInputSchema = z.object({
  name: z.string().trim().min(1).max(140),
  slug: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(8000),
  details: z.string().trim().max(8000).optional().or(z.literal("")),
  price: dollars,
  salePrice: dollars.nullable(),
  material: z.string().trim().min(1).max(80),
  gemstone: z.string().trim().max(80).optional().or(z.literal("")),
  categoryId: z.string().min(1),
  collectionIds: z.array(z.string()).max(20),
  featured: z.boolean(),
  bestSeller: z.boolean(),
  isNew: z.boolean(),
  published: z.boolean(),
  metaTitle: z.string().trim().max(140).optional().or(z.literal("")),
  metaDescription: z.string().trim().max(300).optional().or(z.literal("")),
  images: z.array(z.object({ url: z.string().trim().min(1).max(600), alt: z.string().trim().max(160).optional() })).max(8),
  variants: z
    .array(
      z.object({
        sku: z.string().trim().min(1).max(64),
        size: z.string().trim().max(40).optional().or(z.literal("")),
        color: z.string().trim().max(40).optional().or(z.literal("")),
        colorHex: z.string().trim().max(20).optional().or(z.literal("")),
        stock: z.number().int().min(0).max(9999),
        price: dollars.nullable(),
      }),
    )
    .min(1)
    .max(40),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const discountInputSchema = z.object({
  code: z.string().trim().min(2).max(32),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  minPurchase: z.number().min(0),
  usageLimit: z.number().int().positive().nullable(),
  perCustomerLimit: z.number().int().positive().nullable(),
  startsAt: z.string().optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
  active: z.boolean(),
  productIds: z.array(z.string()).max(100),
  collectionIds: z.array(z.string()).max(50),
  categoryIds: z.array(z.string()).max(20),
});

export function safeImageUrl(url: string) {
  if (url.startsWith("/uploads/") && !url.includes("..")) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function dollarsToCents(value: number) {
  return Math.round(value * 100);
}
