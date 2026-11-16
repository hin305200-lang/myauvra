import type { Metadata } from "next";
import { ShopView } from "@/components/shop/shop-view";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ShopView searchParams={searchParams} title="The collection" lede="Gold, platinum, and stones chosen for character. Filter by what you are looking for, or simply wander." />;
}
