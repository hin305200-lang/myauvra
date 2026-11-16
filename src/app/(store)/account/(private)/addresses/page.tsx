import { ActionForm } from "@/components/ui/action-form";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";
import { COUNTRIES } from "@/lib/copy";
import { getPrisma } from "@/lib/db";
import { requireUser } from "@/lib/viewer";
import { deleteAddressAction, saveAddressAction } from "@/server/store-actions";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser();
  const prisma = await getPrisma();
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });
  return (
    <div className="grid gap-4">
      <h1 className="serif" style={{ fontSize: "3rem", fontWeight: 500 }}>Addresses</h1>
      {addresses.map((address) => (
        <article key={address.id} className="panel">
          <p><strong>{address.fullName}</strong> {address.isDefault ? "· Default" : ""}</p>
          <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.region} {address.postalCode}, {address.country}</p>
          <form action={deleteAddressAction}>
            <input type="hidden" name="id" value={address.id} />
            <button className="btn btn-ghost" type="submit">Remove</button>
          </form>
        </article>
      ))}
      <ActionForm action={saveAddressAction} className="panel" success="Address saved.">
        <h2 className="serif" style={{ fontSize: "2rem", marginTop: 0 }}>Add an address</h2>
        <div className="grid gap-3">
          <Field label="Label"><Input name="label" placeholder="Home" /></Field>
          <Field label="Full name"><Input name="fullName" required defaultValue={user.name || ""} /></Field>
          <Field label="Address"><Input name="line1" required /></Field>
          <Field label="Apartment"><Input name="line2" /></Field>
          <Field label="City"><Input name="city" required /></Field>
          <Field label="Region"><Input name="region" required /></Field>
          <Field label="Postal code"><Input name="postalCode" required /></Field>
          <Field label="Country">
            <select className="field" name="country" defaultValue={COUNTRIES[0]}>{COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select>
          </Field>
          <Field label="Phone"><Input name="phone" /></Field>
          <label><input type="checkbox" name="isDefault" /> Use as default</label>
          <SubmitButton>Save address</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
