import type { Metadata } from "next";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";
import { resetPasswordAction } from "@/server/store-actions";

export const metadata: Metadata = { title: "Choose a password" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <div className="section" style={{ maxWidth: 520 }}>
      <h1 className="serif" style={{ fontSize: "3.2rem", fontWeight: 500 }}>Choose a new password</h1>
      {!token ? <p className="form-error">This reset link is missing its token.</p> : (
        <ActionForm action={resetPasswordAction}>
          <div className="grid gap-3">
            <input type="hidden" name="token" value={token} />
            <Field label="New password"><Input name="password" type="password" required autoComplete="new-password" /></Field>
            <SubmitButton>Update password</SubmitButton>
          </div>
        </ActionForm>
      )}
    </div>
  );
}
