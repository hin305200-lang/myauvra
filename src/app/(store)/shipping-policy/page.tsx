import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal";
import { formatMoney } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Shipping" };

export default async function ShippingPage() {
  const settings = await getSettings();
  return (
    <LegalPage title="Shipping policy">
      <p>Standard insured delivery is {formatMoney(settings.shippingFlat, settings.currency)}. It is complimentary on merchandise of {formatMoney(settings.shippingFreeOver, settings.currency)} or more after discounts. Express delivery adds {formatMoney(settings.shippingExpressExtra, settings.currency)}.</p>
      <p>Orders ship with tracking. The number appears on your order once the status is marked shipped. Delivery times depend on the destination and are estimates, not guarantees.</p>
    </LegalPage>
  );
}
