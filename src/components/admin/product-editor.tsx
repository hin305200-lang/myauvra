"use client";

import { useState } from "react";
import { saveProductAction } from "@/server/admin-actions";
import { Field, Input, TextArea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit";

type VariantDraft = { sku: string; size: string; color: string; colorHex: string; stock: string; price: string };
type ImageDraft = { url: string; alt: string };

export type ProductDraft = {
  name: string;
  slug: string;
  description: string;
  details: string;
  price: string;
  salePrice: string;
  material: string;
  gemstone: string;
  categoryId: string;
  collectionIds: string[];
  featured: boolean;
  bestSeller: boolean;
  isNew: boolean;
  published: boolean;
  metaTitle: string;
  metaDescription: string;
  images: ImageDraft[];
  variants: VariantDraft[];
};

export function ProductEditor({
  id,
  categories,
  collections,
  initial,
}: {
  id?: string;
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  initial: ProductDraft;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  function patch(partial: Partial<ProductDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }
  return (
    <form
      className="grid gap-3"
      action={async (formData) => {
        setError("");
        const payload = {
          name: draft.name,
          slug: draft.slug,
          description: draft.description,
          details: draft.details,
          price: Number(draft.price),
          salePrice: draft.salePrice.trim() ? Number(draft.salePrice) : null,
          material: draft.material,
          gemstone: draft.gemstone,
          categoryId: draft.categoryId,
          collectionIds: draft.collectionIds,
          featured: draft.featured,
          bestSeller: draft.bestSeller,
          isNew: draft.isNew,
          published: draft.published,
          metaTitle: draft.metaTitle,
          metaDescription: draft.metaDescription,
          images: draft.images.filter((image) => image.url.trim()),
          variants: draft.variants.map((variant) => ({
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            colorHex: variant.colorHex,
            stock: Number(variant.stock || 0),
            price: variant.price.trim() ? Number(variant.price) : null,
          })),
        };
        formData.set("payload", JSON.stringify(payload));
        if (id) formData.set("id", id);
        const result = await saveProductAction(formData);
        if (result?.error) setError(result.error);
      }}
    >
      <Field label="Name"><Input value={draft.name} onChange={(event) => patch({ name: event.target.value, slug: id ? draft.slug : slugify(event.target.value) })} required /></Field>
      <Field label="Slug"><Input value={draft.slug} onChange={(event) => patch({ slug: event.target.value })} required /></Field>
      <Field label="Description"><TextArea value={draft.description} onChange={(event) => patch({ description: event.target.value })} required /></Field>
      <Field label="Details"><TextArea value={draft.details} onChange={(event) => patch({ details: event.target.value })} /></Field>
      <div className="product-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Price (USD)"><Input value={draft.price} onChange={(event) => patch({ price: event.target.value })} required /></Field>
        <Field label="Sale price"><Input value={draft.salePrice} onChange={(event) => patch({ salePrice: event.target.value })} /></Field>
        <Field label="Material"><Input value={draft.material} onChange={(event) => patch({ material: event.target.value })} required /></Field>
        <Field label="Gemstone"><Input value={draft.gemstone} onChange={(event) => patch({ gemstone: event.target.value })} /></Field>
      </div>
      <Field label="Category">
        <select className="field" value={draft.categoryId} onChange={(event) => patch({ categoryId: event.target.value })}>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </Field>
      <fieldset>
        <legend>Collections</legend>
        {collections.map((collection) => (
          <label key={collection.id} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={draft.collectionIds.includes(collection.id)}
              onChange={(event) => patch({
                collectionIds: event.target.checked
                  ? [...draft.collectionIds, collection.id]
                  : draft.collectionIds.filter((item) => item !== collection.id),
              })}
            /> {collection.name}
          </label>
        ))}
      </fieldset>
      <label><input type="checkbox" checked={draft.featured} onChange={(event) => patch({ featured: event.target.checked })} /> Featured</label>
      <label><input type="checkbox" checked={draft.bestSeller} onChange={(event) => patch({ bestSeller: event.target.checked })} /> Best seller</label>
      <label><input type="checkbox" checked={draft.isNew} onChange={(event) => patch({ isNew: event.target.checked })} /> New arrival</label>
      <label><input type="checkbox" checked={draft.published} onChange={(event) => patch({ published: event.target.checked })} /> Published</label>
      <h2 className="serif">Images</h2>
      {draft.images.map((image, index) => (
        <div key={index} className="grid gap-2">
          <Input placeholder="https:// or /uploads/" value={image.url} onChange={(event) => updateImage(index, { url: event.target.value })} />
          <Input placeholder="Alt text" value={image.alt} onChange={(event) => updateImage(index, { alt: event.target.value })} />
        </div>
      ))}
      <button className="btn btn-ghost" type="button" onClick={() => patch({ images: [...draft.images, { url: "", alt: "" }] })}>Add image URL</button>
      <Field label="Upload images"><input className="field" name="files" type="file" accept="image/jpeg,image/png,image/webp" multiple /></Field>
      <h2 className="serif">Variants</h2>
      {draft.variants.map((variant, index) => (
        <div key={index} className="panel grid gap-2">
          <Input placeholder="SKU" value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} />
          <Input placeholder="Size" value={variant.size} onChange={(event) => updateVariant(index, { size: event.target.value })} />
          <Input placeholder="Color" value={variant.color} onChange={(event) => updateVariant(index, { color: event.target.value })} />
          <Input placeholder="#hex" value={variant.colorHex} onChange={(event) => updateVariant(index, { colorHex: event.target.value })} />
          <Input placeholder="Stock" value={variant.stock} onChange={(event) => updateVariant(index, { stock: event.target.value })} />
          <Input placeholder="Override price" value={variant.price} onChange={(event) => updateVariant(index, { price: event.target.value })} />
        </div>
      ))}
      <button className="btn btn-ghost" type="button" onClick={() => patch({ variants: [...draft.variants, blankVariant()] })}>Add variant</button>
      <Field label="SEO title"><Input value={draft.metaTitle} onChange={(event) => patch({ metaTitle: event.target.value })} /></Field>
      <Field label="SEO description"><TextArea value={draft.metaDescription} onChange={(event) => patch({ metaDescription: event.target.value })} /></Field>
      {error ? <p className="form-error">{error}</p> : null}
      <SubmitButton>Save piece</SubmitButton>
    </form>
  );

  function updateImage(index: number, partial: Partial<ImageDraft>) {
    patch({ images: draft.images.map((image, imageIndex) => imageIndex === index ? { ...image, ...partial } : image) });
  }
  function updateVariant(index: number, partial: Partial<VariantDraft>) {
    patch({ variants: draft.variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, ...partial } : variant) });
  }
}

function blankVariant(): VariantDraft {
  return { sku: "", size: "", color: "", colorHex: "", stock: "1", price: "" };
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const emptyProduct = (categoryId: string): ProductDraft => ({
  name: "",
  slug: "",
  description: "",
  details: "",
  price: "",
  salePrice: "",
  material: "",
  gemstone: "",
  categoryId,
  collectionIds: [],
  featured: false,
  bestSeller: false,
  isNew: true,
  published: true,
  metaTitle: "",
  metaDescription: "",
  images: [{ url: "", alt: "" }],
  variants: [blankVariant()],
});
