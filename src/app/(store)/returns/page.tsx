import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal";

export const metadata: Metadata = { title: "Returns" };

export default function ReturnsPage() {
  return (
    <LegalPage title="Returns and refunds">
      <p>Unworn pieces in their original condition can be returned within 30 days of delivery. Write to the atelier for a return authorization before sending anything back. Earrings that have been worn cannot be returned, for hygiene.</p>
      <p>Refunds are issued to the original payment method after the piece is received and inspected. Development checkout orders are not real charges and are not refunded by a card network.</p>
    </LegalPage>
  );
}
