import { ActionForm } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";
import { adminLoginAction } from "@/server/store-actions";

export const metadata = { title: "Atelier desk" };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : "/admin";
  return (
    <div className="section" style={{ maxWidth: 480, margin: "0 auto" }}>
      <p className="eyebrow">Atelier desk</p>
      <h1 className="serif" style={{ fontSize: "3.2rem", fontWeight: 500 }}>Sign in</h1>
      <p>Only atelier accounts can open this desk. A customer account will not be accepted.</p>
      {params.error === "config" ? <p className="form-error">Set AUTH_SECRET, ADMIN_EMAIL, and ADMIN_PASSWORD before signing in.</p> : null}
      <ActionForm action={adminLoginAction}>
        <div className="grid gap-3">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Field label="Email"><Input name="email" type="email" required autoComplete="username" /></Field>
          <Field label="Password"><Input name="password" type="password" required autoComplete="current-password" /></Field>
          <SubmitButton>Enter the desk</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
