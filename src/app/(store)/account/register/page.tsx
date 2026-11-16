import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";
import { registerAction } from "@/server/store-actions";
import { MEMBER_NOTE } from "@/lib/copy";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <div className="section" style={{ maxWidth: 520 }}>
      <p className="eyebrow">Membership</p>
      <h1 className="serif" style={{ fontSize: "3.4rem", fontWeight: 500 }}>Create an account</h1>
      <p className="member-note">{MEMBER_NOTE}</p>
      <ActionForm action={registerAction}>
        <div className="grid gap-3">
          <Field label="Name"><Input name="name" required autoComplete="name" /></Field>
          <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
          <Field label="Password"><Input name="password" type="password" required autoComplete="new-password" /></Field>
          <p className="price">At least 8 characters, with a letter and a number.</p>
          <SubmitButton>Create account</SubmitButton>
        </div>
      </ActionForm>
      <p>Already a member? <Link href="/account/login">Sign in</Link></p>
    </div>
  );
}
