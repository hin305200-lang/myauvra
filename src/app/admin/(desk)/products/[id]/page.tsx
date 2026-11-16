import { notFound } from "next/navigation";
import { ProductEditor, type ProductDraft } from "@/components/admin/product-editor";
import { getPrisma } from "@/lib/db";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prisma = await getPrisma();
  const [product, categories, collections] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } }, variants: true, collections: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();
  const initial: ProductDraft = {
    name: product.name,
    slug: product.slug,
    description: product.description,
    details: product.details || "",
    price: (product.price / 100).toString(),
    salePrice: product.salePrice != null ? (product.salePrice / 100).toString() : "",
    material: product.material,
    gemstone: product.gemstone || "",
    categoryId: product.categoryId,
    collectionIds: product.collections.map((entry) => entry.collectionId),
    featured: product.featured,
    bestSeller: product.bestSeller,
    isNew: product.isNew,
    published: product.published,
    metaTitle: product.metaTitle || "",
    metaDescription: product.metaDescription || "",
    images: product.images.map((image) => ({ url: image.url, alt: image.alt || "" })),
    variants: product.variants.map((variant) => ({
      sku: variant.sku,
      size: variant.size || "",
      color: variant.color || "",
      colorHex: variant.colorHex || "",
      stock: String(variant.stock),
      price: variant.price != null ? (variant.price / 100).toString() : "",
    })),
  };
  return (
    <div>
      <h1 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>{product.name}</h1>
      <ProductEditor id={product.id} categories={categories} collections={collections} initial={initial} />
    </div>
  );
}
