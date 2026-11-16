import type { Metadata } from "next";
import { ActionForm } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";
import { forgotPasswordAction } from "@/server/store-actions";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <div className="section" style={{ maxWidth: 520 }}>
      <h1 className="serif" style={{ fontSize: "3.2rem", fontWeight: 500 }}>Reset your password</h1>
      <p>If an account uses this email, we will send a reset link. The reply is the same either way.</p>
      <ActionForm action={forgotPasswordAction} success="If that email has an account, a reset link is on its way.">
        <div className="grid gap-3">
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <SubmitButton>Send the link</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
