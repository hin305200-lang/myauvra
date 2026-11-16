import { CartProvider } from "@/components/site/cart-provider";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { findRequestCart } from "@/lib/session-cart";
import { loadCartQuote } from "@/lib/commerce";
import { getPrisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const prisma = await getPrisma();
  const [settings, viewer] = await Promise.all([getSettings(), getViewer()]);
  const record = await findRequestCart(prisma, viewer?.id ?? null);
  const cart = await loadCartQuote(prisma, record?.id ?? null, settings, viewer);
  const wishCount = viewer ? await prisma.wishlistItem.count({ where: { wishlist: { userId: viewer.id } } }) : 0;
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <>
      <a className="skip" href="#content">Skip to content</a>
      {settings.announcementEnabled ? (
        <div className="announce">
          {settings.announcementLink ? <a href={settings.announcementLink}>{settings.announcementText}</a> : settings.announcementText}
        </div>
      ) : null}
      <CartProvider cart={cart}>
        <Header brand={settings.brandName} logoUrl={settings.logoUrl} cartCount={cartCount} wishCount={wishCount} signedIn={Boolean(viewer)} />
        <main id="content">{children}</main>
        <Footer settings={settings} />
      </CartProvider>
    </>
  );
}
