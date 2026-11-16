import type { Metadata } from "next";
import { ShopView } from "@/components/shop/shop-view";
export const metadata: Metadata = { title: "Rings" };
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ShopView searchParams={searchParams} fixedCategory="rings" title="Rings" lede="Bands, signets, and solitaires finished to sit close to the hand." />;
}
