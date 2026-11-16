import type { Metadata } from "next";
import { ShopView } from "@/components/shop/shop-view";
export const metadata: Metadata = { title: "Earrings" };
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ShopView searchParams={searchParams} fixedCategory="earrings" title="Earrings" lede="Studs, drops, and hoops with a quiet weight." />;
}
