import type { PrismaClient } from "@prisma/client";
import { slugify } from "./utils";
import { dollarsToCents, productInputSchema, safeImageUrl, type ProductInput } from "./validators";

export async function saveProduct(prisma: PrismaClient, input: ProductInput, productId?: string) {
  const parsed = productInputSchema.parse(input);
  if (parsed.images.length < 1) throw new Error("Add at least one image.");
  if (parsed.images.some((image) => !safeImageUrl(image.url))) {
    throw new Error("Use an image URL that starts with http or /uploads/.");
  }
  const price = dollarsToCents(parsed.price);
  const salePrice = parsed.salePrice == null ? null : dollarsToCents(parsed.salePrice);
  if (salePrice != null && salePrice >= price) {
    throw new Error("The sale price must be lower than the regular price.");
  }
  const category = await prisma.category.findUnique({ where: { id: parsed.categoryId } });
  if (!category) throw new Error("Choose a category.");
  let slug = slugify(parsed.slug);
  const clash = await prisma.product.findUnique({ where: { slug } });
  if (clash && clash.id !== productId) slug = `${slug}-${Date.now().toString().slice(-4)}`;
  const data = {
    name: parsed.name,
    slug,
    description: parsed.description,
    details: parsed.details || null,
    price,
    salePrice,
    material: parsed.material,
    gemstone: parsed.gemstone || null,
    categoryId: parsed.categoryId,
    featured: parsed.featured,
    bestSeller: parsed.bestSeller,
    isNew: parsed.isNew,
    published: parsed.published,
    metaTitle: parsed.metaTitle || null,
    metaDescription: parsed.metaDescription || null,
  };
  const product = productId
    ? await prisma.product.update({ where: { id: productId }, data })
    : await prisma.product.create({ data });

  await prisma.productImage.deleteMany({ where: { productId: product.id } });
  await prisma.productImage.createMany({
    data: parsed.images.map((image, position) => ({
      productId: product.id,
      url: image.url,
      alt: image.alt || parsed.name,
      position,
    })),
  });

  const skus = parsed.variants.map((variant) => variant.sku.trim());
  if (new Set(skus).size !== skus.length) throw new Error("Each variant needs its own SKU.");
  const existing = await prisma.productVariant.findMany({ where: { productId: product.id } });
  const keep = new Set(skus);
  const removable = existing.filter((variant) => !keep.has(variant.sku));
  if (removable.length) {
    await prisma.productVariant.deleteMany({ where: { id: { in: removable.map((variant) => variant.id) } } });
  }
  for (const variant of parsed.variants) {
    const payload = {
      sku: variant.sku.trim(),
      size: variant.size || null,
      color: variant.color || null,
      colorHex: variant.colorHex || null,
      stock: variant.stock,
      price: variant.price == null ? null : dollarsToCents(variant.price),
      productId: product.id,
    };
    const prior = existing.find((item) => item.sku === payload.sku);
    if (prior) {
      await prisma.productVariant.update({ where: { id: prior.id }, data: payload });
    } else {
      const skuOwner = await prisma.productVariant.findUnique({ where: { sku: payload.sku } });
      if (skuOwner) throw new Error(`SKU ${payload.sku} is already used.`);
      await prisma.productVariant.create({ data: payload });
    }
  }

  await prisma.productCollection.deleteMany({ where: { productId: product.id } });
  if (parsed.collectionIds.length) {
    await prisma.productCollection.createMany({
      data: parsed.collectionIds.map((collectionId) => ({ productId: product.id, collectionId })),
    });
  }
  return prisma.product.findUnique({
    where: { id: product.id },
    include: { images: true, variants: true, collections: true, category: true },
  });
}

export async function deleteProduct(prisma: PrismaClient, productId: string) {
  await prisma.product.delete({ where: { id: productId } });
}
