import { createTestPrisma } from "../src/lib/db";

async function main() {
const prisma = await createTestPrisma();
const user = await prisma.user.create({
  data: { email: "smoke@auvra.store", passwordHash: "hash", name: "Smoke" },
});
const category = await prisma.category.create({
  data: { name: "Rings", slug: "rings", position: 1 },
});
const product = await prisma.product.create({
  data: {
    name: "Solenne",
    slug: "solenne",
    description: "A ring",
    price: 100000,
    material: "18k yellow gold",
    gemstone: "Diamond",
    categoryId: category.id,
    images: { create: [{ url: "https://example.com/a.jpg", alt: "Solenne", position: 0 }] },
    variants: { create: [{ sku: "AUV-1", size: "6", color: "Yellow gold", stock: 2, colorHex: "#C5A46D" }] },
  },
  include: { variants: true },
});
await prisma.$transaction(async (tx) => {
  const updated = await tx.productVariant.updateMany({
    where: { id: product.variants[0].id, stock: { gte: 1 } },
    data: { stock: { decrement: 1 } },
  });
  if (updated.count !== 1) throw new Error("stock");
  await tx.order.create({
    data: {
      number: "AUV-TEST0001",
      email: user.email,
      userId: user.id,
      subtotal: 100000,
      total: 100000,
      shippingAddress: { fullName: "Smoke" },
      billingAddress: { fullName: "Smoke" },
      items: {
        create: [{ name: "Solenne", unitPrice: 100000, quantity: 1, lineTotal: 100000, productId: product.id, variantId: product.variants[0].id }],
      },
    },
  });
});
await prisma.discount.create({
  data: { code: "ATELIER", type: "PERCENTAGE", value: 15, productIds: [product.id] },
});
const variant = await prisma.productVariant.findUnique({ where: { id: product.variants[0].id } });
console.log("smoke-ok", variant?.stock, user.role);
await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
