import type { MetadataRoute } from "next";
import { getPrisma } from "@/lib/db";
import { appUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = appUrl();
  const prisma = await getPrisma();
  const [products, collections] = await Promise.all([
    prisma.product.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.collection.findMany({ select: { slug: true } }),
  ]);
  const staticPaths = ["", "/shop", "/collections", "/rings", "/necklaces", "/earrings", "/bracelets", "/about", "/contact", "/privacy", "/terms", "/shipping-policy", "/returns"];
  return [
    ...staticPaths.map((path) => ({ url: `${origin}${path || "/"}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.6 })),
    ...collections.map((collection) => ({ url: `${origin}/collections/${collection.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((product) => ({ url: `${origin}/product/${product.slug}`, lastModified: product.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
