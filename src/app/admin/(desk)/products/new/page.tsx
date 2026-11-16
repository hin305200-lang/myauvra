import { ProductEditor, emptyProduct } from "@/components/admin/product-editor";
import { getPrisma } from "@/lib/db";

export const metadata = { title: "New piece" };

export default async function NewProductPage() {
  const prisma = await getPrisma();
  const [categories, collections] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.collection.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!categories[0]) return <p>Add a category before creating a piece.</p>;
  return (
    <div>
      <h1 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>New piece</h1>
      <ProductEditor categories={categories} collections={collections} initial={emptyProduct(categories[0].id)} />
    </div>
  );
}
