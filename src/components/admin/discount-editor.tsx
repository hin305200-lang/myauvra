"use client";

import { useState } from "react";
import { saveDiscountAction } from "@/server/admin-actions";
import { Field, Input, TextArea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";

export function DiscountEditor({
  id,
  initial,
  products,
  collections,
  categories,
}: {
  id?: string;
  products: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  initial: {
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: string;
    description: string;
    minPurchase: string;
    usageLimit: string;
    perCustomerLimit: string;
    startsAt: string;
    expiresAt: string;
    active: boolean;
    productIds: string[];
    collectionIds: string[];
    categoryIds: string[];
  };
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  return (
    <form
      className="panel grid gap-3"
      action={async (formData) => {
        setError("");
        formData.set("payload", JSON.stringify({
          ...draft,
          value: Number(draft.value),
          minPurchase: Number(draft.minPurchase || 0),
          usageLimit: draft.usageLimit.trim() ? Number(draft.usageLimit) : null,
          perCustomerLimit: draft.perCustomerLimit.trim() ? Number(draft.perCustomerLimit) : null,
        }));
        if (id) formData.set("id", id);
        const result = await saveDiscountAction(formData);
        if (result?.error) setError(result.error);
        else setError("");
      }}
    >
      <Field label="Code"><Input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })} required /></Field>
      <Field label="Type">
        <select className="field" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as "PERCENTAGE" | "FIXED" })}>
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed amount</option>
        </select>
      </Field>
      <Field label={draft.type === "PERCENTAGE" ? "Percent" : "Amount"}><Input value={draft.value} onChange={(event) => setDraft({ ...draft, value: event.target.value })} required /></Field>
      <Field label="Minimum purchase"><Input value={draft.minPurchase} onChange={(event) => setDraft({ ...draft, minPurchase: event.target.value })} /></Field>
      <Field label="Usage limit"><Input value={draft.usageLimit} onChange={(event) => setDraft({ ...draft, usageLimit: event.target.value })} /></Field>
      <Field label="Per customer"><Input value={draft.perCustomerLimit} onChange={(event) => setDraft({ ...draft, perCustomerLimit: event.target.value })} /></Field>
      <Field label="Starts"><Input type="date" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} /></Field>
      <Field label="Expires"><Input type="date" value={draft.expiresAt} onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })} /></Field>
      <Field label="Note"><TextArea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field>
      <label><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /> Active</label>
      <Multi label="Products" options={products} selected={draft.productIds} onChange={(productIds) => setDraft({ ...draft, productIds })} />
      <Multi label="Collections" options={collections} selected={draft.collectionIds} onChange={(collectionIds) => setDraft({ ...draft, collectionIds })} />
      <Multi label="Categories" options={categories} selected={draft.categoryIds} onChange={(categoryIds) => setDraft({ ...draft, categoryIds })} />
      {error ? <p className="form-error">{error}</p> : null}
      <SubmitButton>{id ? "Update code" : "Create code"}</SubmitButton>
    </form>
  );
}

function Multi({ label, options, selected, onChange }: { label: string; options: { id: string; name: string }[]; selected: string[]; onChange: (ids: string[]) => void }) {
  return (
    <fieldset>
      <legend>{label} — leave empty for the whole collection</legend>
      <div style={{ maxHeight: 140, overflow: "auto" }}>
        {options.map((option) => (
          <label key={option.id} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={(event) => onChange(event.target.checked ? [...selected, option.id] : selected.filter((id) => id !== option.id))}
            /> {option.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export const blankDiscount = {
  code: "",
  type: "PERCENTAGE" as const,
  value: "10",
  description: "",
  minPurchase: "0",
  usageLimit: "",
  perCustomerLimit: "",
  startsAt: "",
  expiresAt: "",
  active: true,
  productIds: [] as string[],
  collectionIds: [] as string[],
  categoryIds: [] as string[],
};
