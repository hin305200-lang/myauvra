import type { Metadata } from "next";
import { ShopView } from "@/components/shop/shop-view";
export const metadata: Metadata = { title: "Necklaces" };
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ShopView searchParams={searchParams} fixedCategory="necklaces" title="Necklaces" lede="Chains, pendants, and strands drawn for the line of the collarbone." />;
}
