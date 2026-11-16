import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";
import { loginAction } from "@/server/store-actions";
import { MEMBER_NOTE } from "@/lib/copy";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : "/account";
  return (
    <div className="section" style={{ maxWidth: 520 }}>
      <p className="eyebrow">Account</p>
      <h1 className="serif" style={{ fontSize: "3.4rem", fontWeight: 500 }}>Sign in</h1>
      <p className="member-note">{MEMBER_NOTE}</p>
      {params.error === "config" ? <p className="form-error">Sign-in needs AUTH_SECRET before accounts can open.</p> : null}
      {params.reset ? <p className="form-ok">Your password is updated. Sign in with the new one.</p> : null}
      <ActionForm action={loginAction}>
        <div className="grid gap-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
          <Field label="Password"><Input name="password" type="password" required autoComplete="current-password" /></Field>
          <SubmitButton>Sign in</SubmitButton>
        </div>
      </ActionForm>
      <p><Link href="/account/forgot">Forgot your password?</Link></p>
      <p>New here? <Link href="/account/register">Create an account</Link></p>
    </div>
  );
}
