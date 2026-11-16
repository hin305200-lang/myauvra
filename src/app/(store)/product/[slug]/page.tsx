import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/product/gallery";
import { ProductPurchase } from "@/components/product/purchase";
import { ProductCard, type CardModel } from "@/components/product/product-card";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, TextArea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";
import { reviewAction } from "@/server/store-actions";
import { getProduct, productInclude, toCard } from "@/lib/catalog";
import { getPrisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { getViewer } from "@/lib/viewer";
import { safeJson } from "@/lib/jsonld";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const prisma = await getPrisma();
  const product = await getProduct(prisma, slug);
  if (!product) return { title: "Piece" };
  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.description,
    openGraph: { images: product.images[0] ? [product.images[0].url] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prisma = await getPrisma();
  const [product, settings, viewer] = await Promise.all([getProduct(prisma, slug), getSettings(), getViewer()]);
  if (!product) notFound();
  const relatedRaw = await prisma.product.findMany({
    where: { published: true, categoryId: product.categoryId, id: { not: product.id } },
    include: productInclude,
    take: 4,
  });
  const related: CardModel[] = relatedRaw.map((item) => ({ ...toCard(item, Boolean(viewer), settings.memberDiscountPercent), currency: settings.currency }));
  const ratings = product.reviews.map((review) => review.rating);
  const average = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  const low = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((image) => image.url),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: settings.brandName },
    material: product.material,
    offers: {
      "@type": "Offer",
      priceCurrency: settings.currency,
      price: (low / 100).toFixed(2),
      availability: product.variants.some((variant) => variant.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(ratings.length ? { aggregateRating: { "@type": "AggregateRating", ratingValue: average.toFixed(1), reviewCount: ratings.length } } : {}),
  };
  return (
    <article className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }} />
      <p className="eyebrow"><Link href={`/${product.category.slug}`}>{product.category.name}</Link></p>
      <div className="gallery">
        <Gallery images={product.images} name={product.name} />
        <div>
          <h1 className="serif" style={{ fontSize: "clamp(2.8rem, 5vw, 4.4rem)", fontWeight: 500, lineHeight: 0.95, margin: "0.2rem 0 0.6rem" }}>{product.name}</h1>
          <p>{product.description}</p>
          <p className="price">{product.material}{product.gemstone ? ` · ${product.gemstone}` : ""}</p>
          {ratings.length ? <p className="price">{average.toFixed(1)} from {ratings.length} {ratings.length === 1 ? "note" : "notes"}</p> : <p className="price">Be the first to leave a note.</p>}
          <ProductPurchase product={product} currency={settings.currency} isMember={Boolean(viewer)} memberPercent={settings.memberDiscountPercent} />
          <div style={{ marginTop: "1.5rem" }} className="panel">
            <p><strong>Shipping.</strong> Complimentary insured shipping from {formatMoney(settings.shippingFreeOver, settings.currency)}. Standard delivery is {formatMoney(settings.shippingFlat, settings.currency)} below that.</p>
            <p><strong>Returns.</strong> Unworn pieces can be returned within 30 days. <Link href="/returns">Read the policy</Link>.</p>
            {product.details ? <p>{product.details}</p> : null}
          </div>
        </div>
      </div>
      <section style={{ marginTop: "3rem" }}>
        <h2 className="serif" style={{ fontSize: "2.4rem", fontWeight: 500 }}>Notes</h2>
        {product.reviews.length === 0 ? <p>No notes yet.</p> : product.reviews.map((review) => (
          <blockquote key={review.id} className="quote-card">
            <p style={{ fontSize: "1.4rem" }}>{review.title ? `${review.title}. ` : ""}{review.body}</p>
            <footer className="price">{review.user.name || "Client"} · {review.rating} / 5</footer>
          </blockquote>
        ))}
        {viewer ? (
          <ActionForm action={reviewAction.bind(null, product.id)} success="Thank you. Your note is with the piece." className="panel" >
            <div className="grid gap-3">
              <Field label="Rating"><Input name="rating" type="number" min={1} max={5} required defaultValue={5} /></Field>
              <Field label="Title"><Input name="title" /></Field>
              <Field label="Note"><TextArea name="body" required /></Field>
              <SubmitButton>Leave a note</SubmitButton>
            </div>
          </ActionForm>
        ) : <p><Link href={`/account/login?callbackUrl=/product/${product.slug}`}>Sign in</Link> to leave a note.</p>}
      </section>
      {related.length ? (
        <section style={{ marginTop: "3rem" }}>
          <h2 className="serif" style={{ fontSize: "2.4rem", fontWeight: 500 }}>You may also consider</h2>
          <div className="product-grid">{related.map((card) => <ProductCard key={card.id} product={card} />)}</div>
        </section>
      ) : null}
    </article>
  );
}
