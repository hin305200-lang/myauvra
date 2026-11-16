import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/product/photo";
import { getPrisma } from "@/lib/db";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const prisma = await getPrisma();
  const collections = await prisma.collection.findMany({ orderBy: { position: "asc" } });
  return (
    <div className="section">
      <p className="eyebrow">Edit</p>
      <h1 className="display" style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}>Collections</h1>
      <div className="product-grid" style={{ marginTop: "2rem" }}>
        {collections.map((collection) => (
          <Link key={collection.id} href={`/collections/${collection.slug}`} className="product-card">
            <div className="frame"><Photo src={collection.image} alt={collection.name} sizes="30vw" /></div>
            <h3>{collection.name}</h3>
            <p className="price">{collection.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
