import Link from "next/link";
import { getPrisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getViewer } from "@/lib/viewer";
import { queryCatalog, type CatalogFilters } from "@/lib/catalog";
import { ProductCard, type CardModel } from "@/components/product/product-card";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function ShopView({
  searchParams,
  fixedCategory,
  title,
  lede,
  path,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  fixedCategory?: string;
  title: string;
  lede?: string;
  path?: string;
}) {
  const params = await searchParams;
  const filters: CatalogFilters = {
    q: one(params.q) || "",
    category: fixedCategory || one(params.category) || "",
    material: one(params.material) || "",
    gemstone: one(params.gemstone) || "",
    availability: (one(params.availability) as CatalogFilters["availability"]) || "",
    sort: (one(params.sort) as CatalogFilters["sort"]) || "newest",
    min: one(params.min) ? Math.round(Number(one(params.min)) * 100) : undefined,
    max: one(params.max) ? Math.round(Number(one(params.max)) * 100) : undefined,
    page: Number(one(params.page) || 1),
    collection: one(params.collection) || "",
  };
  const prisma = await getPrisma();
  const [settings, viewer, categories] = await Promise.all([
    getSettings(),
    getViewer(),
    prisma.category.findMany({ orderBy: { position: "asc" } }),
  ]);
  const result = await queryCatalog(prisma, filters, Boolean(viewer), settings.memberDiscountPercent);
  const wished = viewer
    ? new Set((await prisma.wishlistItem.findMany({ where: { wishlist: { userId: viewer.id } }, select: { productId: true } })).map((item) => item.productId))
    : new Set<string>();
  const base = path || (fixedCategory ? `/${fixedCategory}` : "/shop");
  const cards: CardModel[] = result.cards.map((card) => ({ ...card, currency: settings.currency, wished: wished.has(card.id) }));
  const query = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      q: filters.q || undefined,
      category: fixedCategory ? undefined : filters.category || undefined,
      material: filters.material || undefined,
      gemstone: filters.gemstone || undefined,
      availability: filters.availability || undefined,
      sort: filters.sort || undefined,
      min: one(params.min),
      max: one(params.max),
      page: String(filters.page || 1),
      ...overrides,
    };
    for (const [key, value] of Object.entries(current)) if (value) next.set(key, value);
    const text = next.toString();
    return text ? `${base}?${text}` : base;
  };
  return (
    <div className="section">
      <header style={{ marginBottom: "2rem" }}>
        <p className="eyebrow">The collection</p>
        <h1 className="serif" style={{ fontSize: "clamp(3rem, 6vw, 5.2rem)", fontWeight: 500, margin: "0.3rem 0", letterSpacing: "-0.03em" }}>{title}</h1>
        {lede ? <p style={{ maxWidth: "40rem", color: "var(--stone)" }}>{lede}</p> : null}
      </header>
      <div className="shop-layout">
        <form className="filters" action={base}>
          <label className="lbl">Search<input className="field" name="q" defaultValue={filters.q} /></label>
          {!fixedCategory ? (
            <label className="lbl">Category
              <select className="field" name="category" defaultValue={filters.category}>
                <option value="">All</option>
                {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
              </select>
            </label>
          ) : null}
          <label className="lbl">Material
            <select className="field" name="material" defaultValue={filters.material}>
              <option value="">All</option>
              {result.materials.map((material) => <option key={material}>{material}</option>)}
            </select>
          </label>
          <label className="lbl">Gemstone
            <select className="field" name="gemstone" defaultValue={filters.gemstone}>
              <option value="">All</option>
              <option value="none">Without a stone</option>
              {result.gemstones.map((gemstone) => <option key={gemstone}>{gemstone}</option>)}
            </select>
          </label>
          <label className="lbl">Minimum price<input className="field" name="min" type="number" min="0" step="1" defaultValue={one(params.min) || ""} /></label>
          <label className="lbl">Maximum price<input className="field" name="max" type="number" min="0" step="1" defaultValue={one(params.max) || ""} /></label>
          <label className="lbl">Availability
            <select className="field" name="availability" defaultValue={filters.availability}>
              <option value="">All</option>
              <option value="in">In the atelier</option>
              <option value="out">Sold out</option>
            </select>
          </label>
          <label className="lbl">Sort
            <select className="field" name="sort" defaultValue={filters.sort}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
              <option value="popular">Popularity</option>
            </select>
          </label>
          <button className="btn btn-ink" type="submit">Apply</button>
        </form>
        <div>
          <p className="price">{result.total} pieces</p>
          {cards.length === 0 ? <p>Nothing matches. Ease a filter, or look through the whole collection.</p> : (
            <div className="product-grid">
              {cards.map((card) => <ProductCard key={card.id} product={card} />)}
            </div>
          )}
          <div className="pager">
            {result.page > 1 ? <Link className="btn btn-line" href={query({ page: String(result.page - 1) })}>Previous</Link> : null}
            {result.page < result.pageCount ? <Link className="btn btn-line" href={query({ page: String(result.page + 1) })}>Next</Link> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
