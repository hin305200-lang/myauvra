import Link from "next/link";
import { ConfirmSubmit } from "@/components/admin/confirm";
import { formatMoney } from "@/lib/format";
import { getPrisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { deleteProductAction } from "@/server/admin-actions";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const prisma = await getPrisma();
  const [products, settings] = await Promise.all([
    prisma.product.findMany({ include: { category: true, variants: true, images: { take: 1 } }, orderBy: { updatedAt: "desc" } }),
    getSettings(),
  ]);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
        <h1 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>Products</h1>
        <Link className="btn btn-ink" href="/admin/products/new">Add a piece</Link>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Piece</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <Link href={`/admin/products/${product.id}`}>{product.name}</Link>
                  <div className="price">{product.category.name}{product.published ? "" : " · hidden"}</div>
                </td>
                <td>{formatMoney(product.salePrice ?? product.price, settings.currency)}</td>
                <td>{product.variants.reduce((sum, variant) => sum + variant.stock, 0)}</td>
                <td>{[product.featured && "Featured", product.bestSeller && "Beloved", product.isNew && "New"].filter(Boolean).join(", ") || "—"}</td>
                <td>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <ConfirmSubmit label="Delete" message={`Delete ${product.name}? This cannot be undone.`} />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CategoryManager />
    </div>
  );
}

async function CategoryManager() {
  const prisma = await getPrisma();
  const [categories, collections] = await Promise.all([
    prisma.category.findMany({ orderBy: { position: "asc" } }),
    prisma.collection.findMany({ orderBy: { position: "asc" } }),
  ]);
  const { saveCategoryAction, deleteCategoryAction, saveCollectionAction, deleteCollectionAction } = await import("@/server/admin-actions");
  const { ActionForm } = await import("@/components/ui/action-form");
  const { SubmitButton } = await import("@/components/ui/submit");
  return (
    <div className="shop-layout" style={{ marginTop: "2rem" }}>
      <section>
        <h2 className="serif">Categories</h2>
        {categories.map((category) => (
          <p key={category.id}>{category.name} · {category.slug}</p>
        ))}
        <ActionForm action={saveCategoryAction} success="Category saved.">
          <div className="grid gap-2">
            <input className="field" name="name" placeholder="Name" required />
            <input className="field" name="slug" placeholder="slug" required />
            <input className="field" name="description" placeholder="Description" />
            <input className="field" name="image" placeholder="Image URL" />
            <SubmitButton>Add category</SubmitButton>
          </div>
        </ActionForm>
        {categories.map((category) => (
          <ActionForm key={category.id} action={deleteCategoryAction}>
            <input type="hidden" name="id" value={category.id} />
            <ConfirmSubmit label={`Delete ${category.name}`} message="Delete this category?" />
          </ActionForm>
        ))}
      </section>
      <section>
        <h2 className="serif">Collections</h2>
        {collections.map((collection) => <p key={collection.id}>{collection.name}</p>)}
        <ActionForm action={saveCollectionAction} success="Collection saved.">
          <div className="grid gap-2">
            <input className="field" name="name" placeholder="Name" required />
            <input className="field" name="slug" placeholder="slug" required />
            <input className="field" name="description" placeholder="Description" />
            <input className="field" name="image" placeholder="Image URL" />
            <label><input type="checkbox" name="featured" /> Featured on the homepage</label>
            <SubmitButton>Add collection</SubmitButton>
          </div>
        </ActionForm>
        {collections.map((collection) => (
          <form key={collection.id} action={deleteCollectionAction}>
            <input type="hidden" name="id" value={collection.id} />
            <ConfirmSubmit label={`Delete ${collection.name}`} message="Delete this collection?" />
          </form>
        ))}
      </section>
    </div>
  );
}
