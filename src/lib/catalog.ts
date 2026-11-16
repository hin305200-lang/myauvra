import type { Prisma, PrismaClient } from "@prisma/client";
import { memberUnitPrice, publicUnitPrice } from "./pricing";

export const productInclude = {
  images: { orderBy: { position: "asc" as const }, take: 2 },
  variants: { orderBy: { sku: "asc" as const } },
  category: true,
} satisfies Prisma.ProductInclude;

export type CatalogFilters = {
  q?: string;
  category?: string;
  material?: string;
  gemstone?: string;
  min?: number;
  max?: number;
  availability?: "in" | "out" | "";
  sort?: "newest" | "price-asc" | "price-desc" | "popular";
  page?: number;
  collection?: string;
};

export async function queryCatalog(prisma: PrismaClient, filters: CatalogFilters, viewerMember: boolean, memberPercent: number) {
  const where: Prisma.ProductWhereInput = { published: true };
  if (filters.category) where.category = { slug: filters.category };
  if (filters.collection) where.collections = { some: { collection: { slug: filters.collection } } };
  if (filters.material) where.material = filters.material;
  if (filters.gemstone) where.gemstone = filters.gemstone === "none" ? null : filters.gemstone;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { material: { contains: filters.q, mode: "insensitive" } },
      { gemstone: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  const [products, sales, materials, gemstones] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, orderBy: { createdAt: "desc" } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: { order: { paymentStatus: { in: ["PAID", "TEST"] }, status: { not: "CANCELLED" } }, productId: { not: null } },
    }),
    prisma.product.findMany({ where: { published: true }, select: { material: true }, distinct: ["material"] }),
    prisma.product.findMany({ where: { published: true, gemstone: { not: null } }, select: { gemstone: true }, distinct: ["gemstone"] }),
  ]);
  const sold = new Map(sales.map((row) => [row.productId, row._sum.quantity ?? 0]));
  let cards = products.map((product) => toCard(product, viewerMember, memberPercent, sold.get(product.id) ?? 0));
  if (filters.min != null) cards = cards.filter((card) => card.publicPrice >= filters.min!);
  if (filters.max != null) cards = cards.filter((card) => card.publicPrice <= filters.max!);
  if (filters.availability === "in") cards = cards.filter((card) => card.inStock);
  if (filters.availability === "out") cards = cards.filter((card) => !card.inStock);
  const sort = filters.sort || "newest";
  cards.sort((a, b) => {
    if (sort === "price-asc") return a.publicPrice - b.publicPrice;
    if (sort === "price-desc") return b.publicPrice - a.publicPrice;
    if (sort === "popular") return b.sold - a.sold || Number(b.bestSeller) - Number(a.bestSeller);
    return b.createdAt - a.createdAt;
  });
  const pageSize = 12;
  const page = Math.max(1, filters.page || 1);
  const pageCount = Math.max(1, Math.ceil(cards.length / pageSize));
  return {
    total: cards.length,
    page,
    pageCount,
    cards: cards.slice((page - 1) * pageSize, page * pageSize),
    materials: materials.map((row) => row.material).sort(),
    gemstones: gemstones.map((row) => row.gemstone).filter((value): value is string => Boolean(value)).sort(),
  };
}

export function toCard(
  product: Prisma.ProductGetPayload<{ include: typeof productInclude }>,
  isMember: boolean,
  memberPercent: number,
  sold = 0,
) {
  const publicPrice = publicUnitPrice(product.price, product.salePrice);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    salePrice: product.salePrice,
    material: product.material,
    gemstone: product.gemstone,
    images: product.images.map((image) => image.url),
    category: product.category.name,
    categorySlug: product.category.slug,
    publicPrice,
    memberPrice: memberUnitPrice(publicPrice, true, memberPercent),
    isMember,
    memberPercent,
    inStock: product.variants.some((variant) => variant.stock > 0),
    variantId: (product.variants.find((variant) => variant.stock > 0) ?? product.variants[0])?.id,
    bestSeller: product.bestSeller,
    isNew: product.isNew,
    featured: product.featured,
    sold,
    createdAt: product.createdAt.getTime(),
    badge: product.isNew ? "New" : product.bestSeller ? "Beloved" : product.salePrice ? "Atelier offer" : undefined,
  };
}

export async function getProduct(prisma: PrismaClient, slug: string) {
  return prisma.product.findFirst({
    where: { slug, published: true },
    include: {
      ...productInclude,
      images: { orderBy: { position: "asc" as const } },
      reviews: {
        where: { published: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
