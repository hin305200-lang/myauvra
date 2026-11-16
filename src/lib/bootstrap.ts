import type { PrismaClient } from "@prisma/client";
import { ensureAdmin } from "./accounts";
import { CATALOG, CATEGORIES, COLLECTIONS, catalogSku } from "./catalog-data";
import { defaultSections, defaultSettingsData } from "./defaults";

export async function ensureSettings(prisma: PrismaClient) {
  const existing = await prisma.websiteSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return prisma.websiteSettings.create({ data: defaultSettingsData });
}

export async function ensureSections(prisma: PrismaClient) {
  for (const section of defaultSections) {
    await prisma.homepageSection.upsert({
      where: { key: section.key },
      update: {},
      create: section,
    });
  }
}

export async function seedCatalog(prisma: PrismaClient) {
  const already = await prisma.adminActivityLog.findFirst({ where: { action: "catalog.seeded" } });
  const count = await prisma.product.count();
  if (already || count > 0) return;
  for (const category of CATEGORIES) {
    await prisma.category.upsert({ where: { slug: category.slug }, update: {}, create: category });
  }
  for (const collection of COLLECTIONS) {
    await prisma.collection.upsert({ where: { slug: collection.slug }, update: {}, create: collection });
  }
  const categories = await prisma.category.findMany();
  const collections = await prisma.collection.findMany();
  const categoryId = new Map(categories.map((category) => [category.slug, category.id]));
  const collectionId = new Map(collections.map((collection) => [collection.slug, collection.id]));
  for (const product of CATALOG) {
    const variants = product.colors.flatMap((color, colorIndex) =>
      product.sizes.map((size, sizeIndex) => ({
        sku: catalogSku(product.slug, color.name, size),
        size,
        color: color.name,
        colorHex: color.hex,
        stock: 2 + ((colorIndex + sizeIndex + product.slug.length) % 4),
        price: null,
      })),
    );
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        details: product.details,
        price: product.price,
        salePrice: product.salePrice ?? null,
        material: product.material,
        gemstone: product.gemstone ?? null,
        categoryId: categoryId.get(product.category)!,
        featured: product.featured ?? false,
        bestSeller: product.bestSeller ?? false,
        isNew: product.isNew ?? false,
        published: true,
        images: {
          create: product.images.map((url, position) => ({ url, alt: product.name, position })),
        },
        variants: { create: variants },
        collections: {
          create: product.collections
            .map((slug) => collectionId.get(slug))
            .filter((id): id is string => Boolean(id))
            .map((id) => ({ collectionId: id })),
        },
      },
    });
  }
  await prisma.discount.upsert({
    where: { code: "WELCOME" },
    update: {},
    create: {
      code: "WELCOME",
      type: "PERCENTAGE",
      value: 10,
      description: "A welcome note from the atelier. Not combined with member pricing unless stacking is on.",
      minPurchase: 0,
      active: true,
    },
  });
  await prisma.discount.upsert({
    where: { code: "ATELIER50" },
    update: {},
    create: {
      code: "ATELIER50",
      type: "FIXED",
      value: 5000,
      description: "$50 toward an order of $400 or more.",
      minPurchase: 40000,
      usageLimit: 200,
      active: true,
    },
  });
  await prisma.adminActivityLog.create({ data: { action: "catalog.seeded", entity: "catalog" } });
}

export async function bootstrap(prisma: PrismaClient) {
  await ensureSettings(prisma);
  await ensureSections(prisma);
  try {
    await seedCatalog(prisma);
  } catch (error) {
    console.error("Catalog seed could not finish.", error instanceof Error ? error.message : "unknown");
  }
  await ensureAdmin(prisma);
}
