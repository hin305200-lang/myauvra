"use client";

import { useState } from "react";
import { checkoutAction } from "@/server/checkout-actions";
import { COUNTRIES } from "@/lib/copy";
import { formatMoney } from "@/lib/format";
import type { Quote } from "@/lib/pricing";
import { Field, Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";

export function CheckoutForm({
  email,
  phone,
  currency,
  quotes,
  testMode,
  codeMessage,
}: {
  email?: string | null;
  phone?: string | null;
  currency: string;
  quotes: { standard: Quote; express: Quote };
  testMode: boolean;
  codeMessage?: string | null;
}) {
  const [same, setSame] = useState(true);
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [key] = useState(() => crypto.randomUUID());
  const [error, setError] = useState("");
  const quote = quotes[method];
  return (
    <form
      className="shop-layout"
      action={async (formData) => {
        setError("");
        formData.set("idempotencyKey", key);
        formData.set("same", same ? "1" : "0");
        formData.set("shippingMethod", method);
        const result = await checkoutAction(formData);
        if (result?.error) setError(result.error);
      }}
    >
      <div className="grid gap-4">
        {testMode ? <p className="legal-note">Development checkout — no payment will be captured. Add Stripe keys to take real payments.</p> : <p className="price">You will continue to Stripe to pay. The order is confirmed only after Stripe notifies the atelier.</p>}
        <Field label="Email"><Input name="email" type="email" required defaultValue={email || ""} /></Field>
        <Field label="Phone"><Input name="phone" required defaultValue={phone || ""} /></Field>
        <h2 className="serif" style={{ fontSize: "2rem", margin: "0.4rem 0" }}>Shipping</h2>
        <AddressFields prefix="ship_" />
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input type="checkbox" checked={same} onChange={(event) => setSame(event.target.checked)} /> Billing address is the same
        </label>
        {!same ? (
          <>
            <h2 className="serif" style={{ fontSize: "2rem" }}>Billing</h2>
            <AddressFields prefix="bill_" />
          </>
        ) : null}
        <h2 className="serif" style={{ fontSize: "2rem" }}>Delivery</h2>
        <label><input type="radio" name="method-ui" checked={method === "standard"} onChange={() => setMethod("standard")} /> Standard — {quoteLabel(quotes.standard.shipping, currency)}</label>
        <label><input type="radio" name="method-ui" checked={method === "express"} onChange={() => setMethod("express")} /> Express — {quoteLabel(quotes.express.shipping, currency)}</label>
        {error ? <p className="form-error">{error}</p> : null}
        <SubmitButton pendingLabel="Placing order">{testMode ? "Place a test order" : "Continue to payment"}</SubmitButton>
      </div>
      <aside className="panel">
        <h2 className="serif" style={{ fontSize: "2rem", marginTop: 0 }}>Summary</h2>
        <Row label="Merchandise" value={formatMoney(quote.publicSubtotal, currency)} />
        {quote.memberDiscount > 0 ? <Row label="Member pricing" value={`-${formatMoney(quote.memberDiscount, currency)}`} /> : null}
        {quote.codeDiscount > 0 ? <Row label="Code" value={`-${formatMoney(quote.codeDiscount, currency)}`} /> : null}
        <Row label="Shipping" value={quote.shipping === 0 ? "Complimentary" : formatMoney(quote.shipping, currency)} />
        <Row label="Tax" value={formatMoney(quote.tax, currency)} />
        <Row label="Total" value={formatMoney(quote.total, currency)} />
        {codeMessage ? <p className="form-error">{codeMessage}</p> : null}
      </aside>
    </form>
  );
}

function quoteLabel(cents: number, currency: string) {
  return cents === 0 ? "Complimentary" : formatMoney(cents, currency);
}

function Row({ label, value }: { label: string; value: string }) {
  return <p style={{ display: "flex", justifyContent: "space-between" }}><span>{label}</span><span>{value}</span></p>;
}

function AddressFields({ prefix }: { prefix: string }) {
  return (
    <div className="grid gap-3">
      <Field label="Full name"><Input name={`${prefix}fullName`} required /></Field>
      <Field label="Address"><Input name={`${prefix}line1`} required /></Field>
      <Field label="Apartment"><Input name={`${prefix}line2`} /></Field>
      <Field label="City"><Input name={`${prefix}city`} required /></Field>
      <Field label="Region"><Input name={`${prefix}region`} required /></Field>
      <Field label="Postal code"><Input name={`${prefix}postalCode`} required /></Field>
      <Field label="Country">
        <select className="field" name={`${prefix}country`} defaultValue={COUNTRIES[0]}>
          {COUNTRIES.map((country) => <option key={country}>{country}</option>)}
        </select>
      </Field>
      <Field label="Phone"><Input name={`${prefix}phone`} /></Field>
    </div>
  );
}
