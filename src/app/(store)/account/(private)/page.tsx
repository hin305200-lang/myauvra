import { ActionForm } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";
import { membershipLevel } from "@/lib/format";
import { getPrisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { requireUser } from "@/lib/viewer";
import { changeEmailAction, changePasswordAction, resendVerificationAction, updateProfileAction } from "@/server/store-actions";

export const metadata = { title: "Your account" };

export default async function AccountHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const user = await requireUser();
  const prisma = await getPrisma();
  const [settings, spent] = await Promise.all([
    getSettings(),
    prisma.order.aggregate({
      where: { userId: user.id, paymentStatus: "PAID", status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
  ]);
  const level = membershipLevel(spent._sum.total ?? 0);
  return (
    <div className="grid gap-4">
      {params.welcome ? <p className="form-ok">Welcome. Member pricing is on for this visit.</p> : null}
      <div>
        <p className="eyebrow">{level.name}</p>
        <h1 className="serif" style={{ fontSize: "3rem", fontWeight: 500, margin: "0.2rem 0" }}>{user.name || "Member"}</h1>
        <p>{level.note} Your member discount is {settings.memberDiscountPercent}%.</p>
        {!user.emailVerified ? (
          <ActionForm action={resendVerificationAction} success="A confirmation link is ready.">
            <p>Your email is not confirmed yet.</p>
            <SubmitButton>Send confirmation</SubmitButton>
          </ActionForm>
        ) : null}
      </div>
      <ActionForm action={updateProfileAction} className="panel" success="Profile saved.">
        <h2 className="serif" style={{ fontSize: "2rem", marginTop: 0 }}>Personal details</h2>
        <div className="grid gap-3">
          <Field label="Name"><Input name="name" defaultValue={user.name || ""} required /></Field>
          <Field label="Phone"><Input name="phone" defaultValue={user.phone || ""} /></Field>
          <SubmitButton>Save details</SubmitButton>
        </div>
      </ActionForm>
      <ActionForm action={changeEmailAction} className="panel" success="Email updated. Confirm the new address.">
        <h2 className="serif" style={{ fontSize: "2rem", marginTop: 0 }}>Email</h2>
        <div className="grid gap-3">
          <Field label="Email"><Input name="email" type="email" defaultValue={user.email} required /></Field>
          <SubmitButton>Update email</SubmitButton>
        </div>
      </ActionForm>
      <ActionForm action={changePasswordAction} className="panel" success="Password updated.">
        <h2 className="serif" style={{ fontSize: "2rem", marginTop: 0 }}>Password</h2>
        <div className="grid gap-3">
          <Field label="Current password"><Input name="currentPassword" type="password" required /></Field>
          <Field label="New password"><Input name="nextPassword" type="password" required /></Field>
          <SubmitButton>Change password</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
