import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms and conditions">
      <p>By placing an order you agree to buy the pieces described on the product page, at the price calculated on our server at checkout. Prices shown to guests are public prices. Signed-in members see member pricing. Discount codes apply only when their conditions are met.</p>
      <p>Title passes when payment is confirmed and the piece is delivered. We may cancel an order if a piece is no longer in stock or if a payment cannot be verified.</p>
      <p>Accounts are personal. Changing your role in the browser does not grant access to the atelier desk.</p>
    </LegalPage>
  );
}
