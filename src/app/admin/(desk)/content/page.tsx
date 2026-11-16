import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, TextArea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";
import { getSections, getSettings } from "@/lib/settings";
import { saveSectionAction } from "@/server/admin-actions";

export const metadata = { title: "Website" };

export default async function ContentPage() {
  const [settings, sections] = await Promise.all([getSettings(), getSections()]);
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>Website</h1>
        <p>Turn sections on or off and edit their copy. Saving publishes immediately. <Link href="/">Open the homepage</Link> to preview.</p>
      </div>
      <section className="panel" style={{ display: "grid", gridTemplateColumns: "minmax(0, 180px) 1fr", gap: "1rem" }}>
        <img src={settings.heroImage} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />
        <div>
          <p className="eyebrow">Published hero</p>
          <h2 className="serif" style={{ margin: "0.2rem 0" }}>{settings.heroTitle}</h2>
          <p>{settings.heroSubtitle}</p>
          <p className="price">Hero text, colors, announcement, and footer live in Settings.</p>
        </div>
      </section>
      {sections.map((section) => (
        <ActionForm key={section.id} action={saveSectionAction} className="panel" success="Section published.">
          <input type="hidden" name="id" value={section.id} />
          <p className="eyebrow">{section.key}</p>
          <div className="grid gap-3">
            <label><input type="checkbox" name="enabled" defaultChecked={section.enabled} /> Show this section</label>
            <Field label="Title"><Input name="title" defaultValue={section.title || ""} /></Field>
            <Field label="Subtitle"><Input name="subtitle" defaultValue={section.subtitle || ""} /></Field>
            <Field label="Body"><TextArea name="body" defaultValue={section.body || ""} /></Field>
            <Field label="Image"><Input name="image" defaultValue={section.image || ""} /></Field>
            <Field label="Button"><Input name="ctaLabel" defaultValue={section.ctaLabel || ""} /></Field>
            <Field label="Button link"><Input name="ctaHref" defaultValue={section.ctaHref || ""} /></Field>
            <Field label="Order"><Input name="position" defaultValue={String(section.position)} /></Field>
            {section.key === "testimonials" ? (
              <Field label="Quotes JSON"><TextArea name="extra" defaultValue={JSON.stringify(section.extra ?? { quotes: [] }, null, 2)} /></Field>
            ) : null}
            <SubmitButton>Publish section</SubmitButton>
          </div>
        </ActionForm>
      ))}
    </div>
  );
}
