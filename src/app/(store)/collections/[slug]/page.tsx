import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopView } from "@/components/shop/shop-view";
import { getPrisma } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const prisma = await getPrisma();
  const collection = await prisma.collection.findUnique({ where: { slug } });
  return { title: collection?.name || "Collection", description: collection?.description || undefined };
}

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const prisma = await getPrisma();
  const collection = await prisma.collection.findUnique({ where: { slug } });
  if (!collection) notFound();
  const current = await searchParams;
  return <ShopView path={`/collections/${slug}`} searchParams={Promise.resolve({ ...current, collection: slug })} title={collection.name} lede={collection.description || undefined} />;
}
