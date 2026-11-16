import type { Metadata } from "next";
import { ShopView } from "@/components/shop/shop-view";
export const metadata: Metadata = { title: "Bracelets" };
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ShopView searchParams={searchParams} fixedCategory="bracelets" title="Bracelets" lede="Cuffs, bangles, and lines of light for the wrist." />;
}
