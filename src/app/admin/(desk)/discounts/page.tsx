import { ConfirmSubmit } from "@/components/admin/confirm";
import { DiscountEditor, blankDiscount } from "@/components/admin/discount-editor";
import { formatMoney } from "@/lib/format";
import { getPrisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { deleteDiscountAction } from "@/server/admin-actions";

export const metadata = { title: "Discounts" };

export default async function DiscountsPage() {
  const prisma = await getPrisma();
  const [settings, discounts, products, collections, categories] = await Promise.all([
    getSettings(),
    prisma.discount.findMany({ orderBy: { code: "asc" } }),
    prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.collection.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>Discounts</h1>
        <p>Signed-in members currently receive {settings.memberDiscountPercent}%. Change that under Settings. {settings.stackDiscounts ? "Codes stack with member pricing." : "Codes do not stack with member pricing."}</p>
      </div>
      {discounts.map((discount) => (
        <details key={discount.id} className="panel">
          <summary>{discount.code} · {discount.active ? "active" : "off"} · {discount.type === "PERCENTAGE" ? `${discount.value}%` : formatMoney(discount.value, settings.currency)} · used {discount.usedCount}</summary>
          <DiscountEditor
            id={discount.id}
            products={products}
            collections={collections}
            categories={categories}
            initial={{
              code: discount.code,
              type: discount.type,
              value: discount.type === "FIXED" ? (discount.value / 100).toString() : String(discount.value),
              description: discount.description || "",
              minPurchase: (discount.minPurchase / 100).toString(),
              usageLimit: discount.usageLimit?.toString() || "",
              perCustomerLimit: discount.perCustomerLimit?.toString() || "",
              startsAt: dateInput(discount.startsAt),
              expiresAt: dateInput(discount.expiresAt),
              active: discount.active,
              productIds: discount.productIds,
              collectionIds: discount.collectionIds,
              categoryIds: discount.categoryIds,
            }}
          />
          <form action={deleteDiscountAction}>
            <input type="hidden" name="id" value={discount.id} />
            <ConfirmSubmit label="Delete code" message={`Delete ${discount.code}?`} />
          </form>
        </details>
      ))}
      <section>
        <h2 className="serif">New code</h2>
        <DiscountEditor products={products} collections={collections} categories={categories} initial={blankDiscount} />
      </section>
    </div>
  );
}

function dateInput(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}
