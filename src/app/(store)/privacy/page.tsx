import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>We collect the details you give us to place an order, create an account, or write to the atelier: name, email, phone, addresses, and order history. Passwords are stored only as a hash. Card numbers are handled by Stripe and are never written to our database.</p>
      <p>We use this information to fulfill orders, apply member pricing, send the letters you ask for, and keep the site secure. We do not sell personal information.</p>
      <p>You can update your profile, addresses, and password from your account. To ask for a copy or deletion of your information, write to the contact address on this page.</p>
    </LegalPage>
  );
}
