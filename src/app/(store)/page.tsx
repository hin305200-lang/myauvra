import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { DragRail } from "@/components/motion/drag-rail";
import { EnterGate } from "@/components/motion/enter-gate";
import { ParallaxFrame } from "@/components/motion/stage";
import { Photo } from "@/components/product/photo";
import { ProductCard, type CardModel } from "@/components/product/product-card";
import { newsletterAction } from "@/server/store-actions";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit";
import { toCard } from "@/lib/catalog";
import { productInclude } from "@/lib/catalog";
import { getPrisma } from "@/lib/db";
import { getSections, getSettings, sectionMap } from "@/lib/settings";
import { getViewer } from "@/lib/viewer";
import { MEMBER_NOTE } from "@/lib/copy";

export default async function HomePage() {
  const prisma = await getPrisma();
  const [settings, sections, viewer, products, collections] = await Promise.all([
    getSettings(),
    getSections(),
    getViewer(),
    prisma.product.findMany({ where: { published: true }, include: productInclude, orderBy: { createdAt: "desc" } }),
    prisma.collection.findMany({ where: { featured: true }, orderBy: { position: "asc" } }),
  ]);
  const wishedIds = viewer
    ? new Set((await prisma.wishlistItem.findMany({ where: { wishlist: { userId: viewer.id } }, select: { productId: true } })).map((item) => item.productId))
    : new Set<string>();
  const cards: CardModel[] = products.map((product) => ({
    ...toCard(product, Boolean(viewer), settings.memberDiscountPercent),
    currency: settings.currency,
    wished: wishedIds.has(product.id),
  }));
  const sectionsByKey = sectionMap(sections);
  const enabled = (key: string) => sectionsByKey.get(key)?.enabled !== false;
  const quotes = ((sectionsByKey.get("testimonials")?.extra as { quotes?: { quote: string; name: string; detail: string }[] } | null)?.quotes) ?? [];
  return (
    <>
      <EnterGate brand={settings.brandName} line={settings.heroSubtitle} />
      <section className="statement">
        <p className="statement-brand">{settings.brandName}</p>
        <h1>{settings.heroTitle}</h1>
        <p className="statement-sub">{settings.heroSubtitle}</p>
        <div className="statement-links">
          <Link className="arrow-link" href={settings.heroButtonHref}>⮡ {settings.heroButtonLabel}</Link>
          {settings.heroSecondaryHref && settings.heroSecondaryLabel ? <Link className="arrow-link" href={settings.heroSecondaryHref}>⮡ {settings.heroSecondaryLabel}</Link> : null}
        </div>
      </section>
      <section className="world">
        <div className="world-label">
          <span>Drag to explore the atelier</span>
          <span>Selected pieces</span>
        </div>
        <DragRail>
          {cards.slice(0, 8).map((card, index) => (
            <Link key={card.id} href={`/product/${card.slug}`} className="world-card">
              <div className="frame"><Photo src={card.images[0]} alt={card.name} sizes="40vw" /></div>
              <div className="world-meta">
                <span>0{index + 1}</span>
                <strong>{card.name}</strong>
                <em>{card.material}</em>
              </div>
            </Link>
          ))}
        </DragRail>
      </section>
      <section className="index-filters">
        <p>Index</p>
        {[["All", "/shop"], ["Rings", "/rings"], ["Necklaces", "/necklaces"], ["Earrings", "/earrings"], ["Bracelets", "/bracelets"]].map(([label, href]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </section>
      <section className="selected">
        <div className="world-label"><span>Selected jewelry</span><span>{cards.length} pieces</span></div>
        {cards.slice(0, 6).map((card, index) => (
          <Link key={card.id} href={`/product/${card.slug}`} className="selected-row">
            <span>0{index + 1}</span>
            <strong>{card.name}</strong>
            <em>{card.material}</em>
            <b aria-hidden="true">⮡</b>
          </Link>
        ))}
      </section>
      {enabled("promo") ? (
        <Reveal>
          <section className="section" style={{ paddingTop: 0 }}>
            <div className="split">
              <ParallaxFrame src={sectionsByKey.get("promo")?.image || settings.heroImage} alt="" />
              <div className="copy">
                <p className="eyebrow">{sectionsByKey.get("promo")?.subtitle}</p>
                <h2 className="serif" style={{ fontSize: "clamp(2.4rem, 4vw, 4rem)", fontWeight: 500, margin: "0.4rem 0" }}>{sectionsByKey.get("promo")?.title}</h2>
                <p>{sectionsByKey.get("promo")?.body}</p>
                {!viewer ? <p className="member-note">{MEMBER_NOTE}</p> : <p className="member-note">Your member pricing is {settings.memberDiscountPercent}% on every piece.</p>}
                {sectionsByKey.get("promo")?.ctaHref ? <Link className="btn btn-ink" href={sectionsByKey.get("promo")!.ctaHref!}>{sectionsByKey.get("promo")?.ctaLabel}</Link> : null}
              </div>
            </div>
          </section>
        </Reveal>
      ) : null}
      {enabled("collections") ? (
        <section className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">{sectionsByKey.get("collections")?.subtitle || "Collections"}</p>
              <h2>{sectionsByKey.get("collections")?.title || "Collections"}</h2>
            </div>
            <Link className="btn btn-ghost" href="/collections">View all</Link>
          </div>
          <DragRail>
            {collections.map((collection, index) => (
              <Link key={collection.id} href={`/collections/${collection.slug}`} className="rail-card">
                <span>0{index + 1}</span>
                <div className="frame"><Photo src={collection.image} alt={collection.name} sizes="30vw" /></div>
                <h3>{collection.name}</h3>
                <p className="price">{collection.description}</p>
              </Link>
            ))}
          </DragRail>
        </section>
      ) : null}
      {enabled("bestsellers") ? <ProductBand title={sectionsByKey.get("bestsellers")?.title || "Most loved"} eyebrow={sectionsByKey.get("bestsellers")?.subtitle || ""} cards={cards.filter((card) => card.bestSeller).slice(0, 4)} /> : null}
      {enabled("editorial") ? (
        <Reveal>
          <section className="split">
            <div className="copy">
              <p className="eyebrow">{sectionsByKey.get("editorial")?.subtitle}</p>
              <h2 className="serif" style={{ fontSize: "clamp(2.8rem, 5vw, 4.6rem)", fontWeight: 500, lineHeight: 0.95 }}>{sectionsByKey.get("editorial")?.title}</h2>
              <p>{sectionsByKey.get("editorial")?.body}</p>
              {sectionsByKey.get("editorial")?.ctaHref ? <Link className="btn btn-line" href={sectionsByKey.get("editorial")!.ctaHref!}>{sectionsByKey.get("editorial")?.ctaLabel}</Link> : null}
            </div>
            <ParallaxFrame src={sectionsByKey.get("editorial")?.image} alt="" />
          </section>
        </Reveal>
      ) : null}
      {enabled("new-arrivals") ? <ProductBand title={sectionsByKey.get("new-arrivals")?.title || "New arrivals"} eyebrow="Just finished" cards={cards.filter((card) => card.isNew).slice(0, 4)} /> : null}
      {enabled("story") ? (
        <section className="section">
          <div className="split">
            <ParallaxFrame src={sectionsByKey.get("story")?.image} alt="" />
            <div className="copy" style={{ background: "var(--ivory)" }}>
              <p className="eyebrow">{sectionsByKey.get("story")?.subtitle}</p>
              <h2 className="serif" style={{ fontSize: "clamp(2.6rem, 4vw, 4rem)", fontWeight: 500 }}>{sectionsByKey.get("story")?.title}</h2>
              <p>{sectionsByKey.get("story")?.body}</p>
              <Link className="btn btn-ink" href={sectionsByKey.get("story")?.ctaHref || "/about"}>{sectionsByKey.get("story")?.ctaLabel || "The house"}</Link>
            </div>
          </div>
        </section>
      ) : null}
      {enabled("featured") ? <ProductBand title={sectionsByKey.get("featured")?.title || "From the vitrine"} eyebrow="Featured" cards={cards.filter((card) => card.featured).slice(0, 4)} /> : null}
      {enabled("testimonials") && quotes.length > 0 ? (
        <section className="section">
          <p className="eyebrow">{sectionsByKey.get("testimonials")?.subtitle}</p>
          <h2 className="serif" style={{ fontSize: "clamp(2.4rem, 4vw, 4rem)", fontWeight: 500 }}>{sectionsByKey.get("testimonials")?.title}</h2>
          <div className="quote-grid">
            {quotes.map((quote) => (
              <blockquote key={quote.name} className="quote-card">
                <p>“{quote.quote}”</p>
                <footer className="price">{quote.name} · {quote.detail}</footer>
              </blockquote>
            ))}
          </div>
          <p className="price">Sample client notes. Replace them in the atelier desk.</p>
        </section>
      ) : null}
      {enabled("social") ? (
        <section className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">{sectionsByKey.get("social")?.subtitle}</p>
              <h2>{sectionsByKey.get("social")?.title || "The journal"}</h2>
            </div>
            {settings.instagram ? <a className="btn btn-ghost" href={settings.instagram}>Instagram</a> : null}
          </div>
          <div className="social-grid">
            {cards.slice(0, 6).map((card) => (
              <Link key={card.id} href={`/product/${card.slug}`}><Photo src={card.images[0]} alt={card.name} sizes="16vw" /></Link>
            ))}
          </div>
        </section>
      ) : null}
      {enabled("newsletter") ? (
        <section className="section" style={{ textAlign: "center" }}>
          <p className="eyebrow">{sectionsByKey.get("newsletter")?.subtitle}</p>
          <h2 className="serif" style={{ fontSize: "clamp(2.6rem, 5vw, 4.4rem)", fontWeight: 500 }}>{sectionsByKey.get("newsletter")?.title}</h2>
          <p style={{ maxWidth: "34rem", margin: "0 auto 1rem" }}>{sectionsByKey.get("newsletter")?.body}</p>
          <ActionForm action={newsletterAction} success="You are on the list." className="mx-auto" >
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap", maxWidth: "32rem", margin: "0 auto" }}>
              <input className="field" style={{ maxWidth: "18rem" }} name="email" type="email" required placeholder="Email address" aria-label="Email" />
              <SubmitButton>Subscribe</SubmitButton>
            </div>
          </ActionForm>
        </section>
      ) : null}
    </>
  );
}

function ProductBand({ title, eyebrow, cards }: { title: string; eyebrow?: string; cards: CardModel[] }) {
  if (cards.length === 0) return null;
  return (
    <section className="section">
      <div className="section-head">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        <Link className="btn btn-ghost" href="/shop">Shop all</Link>
      </div>
      <div className="product-grid">
        {cards.map((card, index) => (
          <Reveal key={card.id + title} delay={index * 0.08}>
            <ProductCard product={card} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
