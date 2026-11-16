import Link from "next/link";
import { newsletterAction } from "@/server/store-actions";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit";

export function Footer({
  settings,
}: {
  settings: {
    brandName: string;
    footerAbout: string;
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    instagram?: string | null;
    pinterest?: string | null;
    facebook?: string | null;
  };
}) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h3>{settings.brandName}</h3>
          <p className="muted">{settings.footerAbout}</p>
        </div>
        <div>
          <h3>Visit</h3>
          <p><Link href="/shop">Shop</Link></p>
          <p><Link href="/collections">Collections</Link></p>
          <p><Link href="/about">About</Link></p>
          <p><Link href="/contact">Contact</Link></p>
        </div>
        <div>
          <h3>Care</h3>
          <p><Link href="/shipping-policy">Shipping</Link></p>
          <p><Link href="/returns">Returns</Link></p>
          <p><Link href="/privacy">Privacy</Link></p>
          <p><Link href="/terms">Terms</Link></p>
          <p><Link href="/orders/track">Track an order</Link></p>
        </div>
        <div>
          <h3>A letter, rarely</h3>
          <ActionForm action={newsletterAction} success="You are on the list.">
            <input className="field" name="email" type="email" required placeholder="Email address" aria-label="Email address" />
            <div style={{ marginTop: "0.6rem" }}><SubmitButton pendingLabel="Joining">Join</SubmitButton></div>
          </ActionForm>
          <p className="muted" style={{ marginTop: "1rem" }}>{settings.contactEmail}<br />{settings.contactPhone}</p>
          <p>
            {settings.instagram ? <a href={settings.instagram}>Instagram</a> : null}{" "}
            {settings.pinterest ? <a href={settings.pinterest}>Pinterest</a> : null}{" "}
            {settings.facebook ? <a href={settings.facebook}>Facebook</a> : null}
          </p>
        </div>
      </div>
      <p className="muted" style={{ marginTop: "2.5rem", fontSize: "0.85rem" }}>
        © {new Date().getFullYear()} {settings.brandName}. {settings.contactAddress}
      </p>
    </footer>
  );
}
