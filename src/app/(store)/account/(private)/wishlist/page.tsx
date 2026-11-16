import { ProductCard, type CardModel } from "@/components/product/product-card";
import { productInclude, toCard } from "@/lib/catalog";
import { getPrisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { requireUser } from "@/lib/viewer";

export const metadata = { title: "Wishlist" };

export default async function AccountWishlist() {
  const user = await requireUser();
  const prisma = await getPrisma();
  const settings = await getSettings();
  const items = await prisma.wishlistItem.findMany({
    where: { wishlist: { userId: user.id }, product: { published: true } },
    include: { product: { include: productInclude } },
  });
  const cards: CardModel[] = items.map((item) => ({
    ...toCard(item.product, true, settings.memberDiscountPercent),
    currency: settings.currency,
    wished: true,
  }));
  return (
    <div>
      <h1 className="serif" style={{ fontSize: "3rem", fontWeight: 500 }}>Wishlist</h1>
      {cards.length === 0 ? <p>Nothing saved yet. Tap the heart on a piece to keep it here.</p> : (
        <div className="product-grid">{cards.map((card) => <ProductCard key={card.id} product={card} />)}</div>
      )}
    </div>
  );
}
