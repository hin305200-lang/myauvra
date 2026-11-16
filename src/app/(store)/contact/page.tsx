import type { Metadata } from "next";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input, TextArea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";
import { contactAction } from "@/server/store-actions";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact" };

const FAQ = [
  ["How does member pricing work?", "Create an account and sign in. The member discount is applied to the selling price of every piece, in the bag and at checkout. It is calculated on the server."],
  ["Can I use a discount code with member pricing?", "Only when the atelier has turned stacking on. Otherwise the better of the two prices is used."],
  ["How long does delivery take?", "Standard insured delivery is usually five to eight days. Express is two to four. You will receive a tracking number once a piece leaves."],
  ["What is the return window?", "Unworn pieces can be returned within 30 days. Read the returns policy for the details."],
];

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <div className="section">
      <p className="eyebrow">Atelier</p>
      <h1 className="display" style={{ fontSize: "clamp(3rem, 6vw, 5.4rem)" }}>Write to us.</h1>
      <div className="shop-layout" style={{ marginTop: "2rem" }}>
        <ActionForm action={contactAction} success="Received. We will reply from the atelier.">
          <div className="grid gap-3">
            <Field label="Name"><Input name="name" required /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Subject"><Input name="subject" required /></Field>
            <Field label="Message"><TextArea name="message" required /></Field>
            <SubmitButton pendingLabel="Sending">Send the note</SubmitButton>
          </div>
        </ActionForm>
        <aside className="panel">
          <p><strong>Email.</strong> {settings.contactEmail}</p>
          <p><strong>Phone.</strong> {settings.contactPhone}</p>
          <p><strong>Address.</strong> {settings.contactAddress}</p>
          <p>
            {settings.instagram ? <a href={settings.instagram}>Instagram</a> : null}{" "}
            {settings.pinterest ? <a href={settings.pinterest}>Pinterest</a> : null}{" "}
            {settings.facebook ? <a href={settings.facebook}>Facebook</a> : null}
          </p>
        </aside>
      </div>
      <section style={{ marginTop: "3rem" }}>
        <h2 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>Questions we hear often</h2>
        {FAQ.map(([question, answer]) => (
          <details key={question} className="panel" style={{ marginBottom: "0.6rem" }}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
