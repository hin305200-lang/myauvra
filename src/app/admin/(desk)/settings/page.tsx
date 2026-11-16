import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, TextArea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";
import { paymentsActive, stripeConfigured } from "@/lib/stripe-events";
import { getSettings } from "@/lib/settings";
import { changeAdminPasswordAction, saveSettingsAction } from "@/server/admin-actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="grid gap-4">
      <h1 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>Settings</h1>
      <ActionForm action={changeAdminPasswordAction} className="panel" success="Password updated.">
        <h2 className="serif" style={{ marginTop: 0 }}>Your password</h2>
        <div className="grid gap-3">
          <Field label="Current password"><Input name="currentPassword" type="password" required /></Field>
          <Field label="New password"><Input name="nextPassword" type="password" required /></Field>
          <SubmitButton>Change password</SubmitButton>
        </div>
      </ActionForm>
      <ActionForm action={saveSettingsAction} className="panel" success="The live site is using these settings.">
        <h2 className="serif" style={{ marginTop: 0 }}>Store</h2>
        <div className="grid gap-3">
          <Field label="Brand name"><Input name="brandName" defaultValue={settings.brandName} /></Field>
          <Field label="Tagline"><Input name="tagline" defaultValue={settings.tagline} /></Field>
          <Field label="Logo URL"><Input name="logoUrl" defaultValue={settings.logoUrl || ""} /></Field>
          <Field label="Upload logo"><input className="field" name="logoFile" type="file" accept="image/jpeg,image/png,image/webp" /></Field>
          <Field label="Favicon URL"><Input name="faviconUrl" defaultValue={settings.faviconUrl || ""} /></Field>
          <div className="product-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            <Color name="colorBackground" label="Background" value={settings.colorBackground} />
            <Color name="colorSecondary" label="Secondary" value={settings.colorSecondary} />
            <Color name="colorGold" label="Gold" value={settings.colorGold} />
            <Color name="colorText" label="Text" value={settings.colorText} />
            <Color name="colorMuted" label="Muted" value={settings.colorMuted} />
          </div>
          <Field label="Typography">
            <select className="field" name="fontPair" defaultValue={settings.fontPair}>
              <option value="cormorant">Cormorant & Outfit</option>
              <option value="playfair">Playfair & Nunito</option>
              <option value="fraunces">Fraunces & Manrope</option>
            </select>
          </Field>
          <label><input type="checkbox" name="announcementEnabled" defaultChecked={settings.announcementEnabled} /> Show announcement bar</label>
          <Field label="Announcement"><Input name="announcementText" defaultValue={settings.announcementText || ""} /></Field>
          <Field label="Announcement link"><Input name="announcementLink" defaultValue={settings.announcementLink || ""} /></Field>
          <h2 className="serif">Homepage hero</h2>
          {settings.heroImage ? <img src={settings.heroImage} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} /> : null}
          <p className="price">This is the image currently published. Saving replaces it on the live homepage.</p>
          <Field label="Hero image URL"><Input name="heroImage" defaultValue={settings.heroImage} /></Field>
          <Field label="Upload hero"><input className="field" name="heroFile" type="file" accept="image/jpeg,image/png,image/webp" /></Field>
          <Field label="Hero title"><Input name="heroTitle" defaultValue={settings.heroTitle} /></Field>
          <Field label="Hero subtitle"><TextArea name="heroSubtitle" defaultValue={settings.heroSubtitle} /></Field>
          <Field label="Button label"><Input name="heroButtonLabel" defaultValue={settings.heroButtonLabel} /></Field>
          <Field label="Button link"><Input name="heroButtonHref" defaultValue={settings.heroButtonHref} /></Field>
          <Field label="Second button"><Input name="heroSecondaryLabel" defaultValue={settings.heroSecondaryLabel || ""} /></Field>
          <Field label="Second link"><Input name="heroSecondaryHref" defaultValue={settings.heroSecondaryHref || ""} /></Field>
          <Field label="Footer"><TextArea name="footerAbout" defaultValue={settings.footerAbout} /></Field>
          <Field label="Contact email"><Input name="contactEmail" defaultValue={settings.contactEmail} /></Field>
          <Field label="Phone"><Input name="contactPhone" defaultValue={settings.contactPhone} /></Field>
          <Field label="Address"><Input name="contactAddress" defaultValue={settings.contactAddress} /></Field>
          <Field label="Instagram"><Input name="instagram" defaultValue={settings.instagram || ""} /></Field>
          <Field label="Pinterest"><Input name="pinterest" defaultValue={settings.pinterest || ""} /></Field>
          <Field label="Facebook"><Input name="facebook" defaultValue={settings.facebook || ""} /></Field>
          <h2 className="serif">Money</h2>
          <Field label="Currency"><Input name="currency" defaultValue={settings.currency} /></Field>
          <Field label="Tax percent"><Input name="taxPercent" defaultValue={String(settings.taxRateBps / 100)} /></Field>
          <label><input type="checkbox" name="taxInclusive" defaultChecked={settings.taxInclusive} /> Prices already include tax</label>
          <Field label="Standard shipping"><Input name="shippingFlat" defaultValue={String(settings.shippingFlat / 100)} /></Field>
          <Field label="Express extra"><Input name="shippingExpressExtra" defaultValue={String(settings.shippingExpressExtra / 100)} /></Field>
          <Field label="Free shipping from"><Input name="shippingFreeOver" defaultValue={String(settings.shippingFreeOver / 100)} /></Field>
          <Field label="Member discount percent"><Input name="memberDiscountPercent" defaultValue={String(settings.memberDiscountPercent)} /></Field>
          <label><input type="checkbox" name="stackDiscounts" defaultChecked={settings.stackDiscounts} /> Stack codes on top of member pricing</label>
          <Field label="Legal name"><Input name="legalName" defaultValue={settings.legalName} /></Field>
          <Field label="Legal address"><Input name="legalAddress" defaultValue={settings.legalAddress} /></Field>
          <Field label="Materials"><Input name="materialOptions" defaultValue={settings.materialOptions.join(", ")} /></Field>
          <Field label="Gemstones"><Input name="gemstoneOptions" defaultValue={settings.gemstoneOptions.join(", ")} /></Field>
          <SubmitButton>Publish settings</SubmitButton>
        </div>
      </ActionForm>
      <section className="panel">
        <h2 className="serif" style={{ marginTop: 0 }}>Payments</h2>
        <p>{paymentsActive() ? "Stripe secret key is set. Checkout will open Stripe." : "Stripe is not configured. Checkout uses development mode and does not capture a card."}</p>
        <p>{stripeConfigured() ? "Webhook secret is set. Paid status is confirmed only from a verified webhook." : "Add STRIPE_WEBHOOK_SECRET so paid orders are confirmed. A return from Stripe alone never marks an order paid."}</p>
        <p className="price">Keys stay in the environment. They are not stored in the database or sent to the browser.</p>
      </section>
    </div>
  );
}

function Color({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <label className="lbl">{label}
      <input className="field" name={name} defaultValue={value} />
    </label>
  );
}
