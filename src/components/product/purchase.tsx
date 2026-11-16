"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { memberUnitPrice, publicUnitPrice } from "@/lib/pricing";
import { MEMBER_NOTE } from "@/lib/copy";
import { addToCartAction, toggleWishlistAction } from "@/server/store-actions";
import { useCart } from "@/components/site/cart-provider";

type Variant = { id: string; sku: string; size: string | null; color: string | null; colorHex: string | null; stock: number; price: number | null };

export function ProductPurchase({
  product,
  currency,
  isMember,
  memberPercent,
}: {
  product: { id: string; slug: string; name: string; price: number; salePrice: number | null; variants: Variant[] };
  currency: string;
  isMember: boolean;
  memberPercent: number;
}) {
  const first = product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(first?.id);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [wished, setWished] = useState(false);
  const router = useRouter();
  const cart = useCart();
  const variant = product.variants.find((item) => item.id === variantId) ?? first;
  const colors = useMemo(() => unique(product.variants.map((item) => item.color).filter(Boolean) as string[]), [product.variants]);
  const sizes = useMemo(() => {
    const pool = product.variants.filter((item) => !variant?.color || item.color === variant.color);
    return unique(pool.map((item) => item.size).filter(Boolean) as string[]);
  }, [product.variants, variant?.color]);
  if (!variant) return <p>This piece is being finished. Please write to the atelier.</p>;
  const unitPublic = publicUnitPrice(product.price, product.salePrice, variant.price);
  const unit = isMember ? memberUnitPrice(unitPublic, true, memberPercent) : unitPublic;
  const compare = product.price > unitPublic ? product.price : isMember && unitPublic > unit ? unitPublic : null;

  async function add(buyNow = false) {
    setError("");
    const result = await addToCartAction(variant.id, quantity);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    if (buyNow) {
      router.push("/checkout");
      return;
    }
    router.refresh();
    cart?.setOpen(true);
  }

  return (
    <div>
      <p className="price" style={{ fontSize: "1.2rem" }}>
        {compare ? <s>{formatMoney(compare, currency)}</s> : null}
        <strong>{formatMoney(unit, currency)}</strong>
        {isMember ? " · Member price" : ""}
      </p>
      {!isMember && memberPercent > 0 ? <p className="member-note">{MEMBER_NOTE}</p> : null}
      {product.salePrice ? <p className="price">Atelier offer from {formatMoney(product.price, currency)}</p> : null}
      {colors.length > 0 ? (
        <div style={{ marginTop: "1rem" }}>
          <p className="eyebrow">Metal</p>
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
            {colors.map((color) => {
              const match = product.variants.find((item) => item.color === color);
              return (
                <button key={color} type="button" className="swatch-btn" data-active={variant.color === color} onClick={() => {
                  const next = product.variants.find((item) => item.color === color && item.stock > 0) ?? product.variants.find((item) => item.color === color);
                  if (next) setVariantId(next.id);
                }}>
                  <span className="swatch" style={{ background: match?.colorHex || "#ccc", display: "inline-block", marginRight: 6 }} />
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {sizes.length > 0 ? (
        <div style={{ marginTop: "1rem" }}>
          <p className="eyebrow">Size</p>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
            {sizes.map((size) => {
              const match = product.variants.find((item) => item.size === size && item.color === variant.color) ?? product.variants.find((item) => item.size === size);
              return (
                <button key={size} type="button" className="size-btn" data-active={variant.size === size} disabled={!match || match.stock < 1} onClick={() => match && setVariantId(match.id)}>
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <p className="price" style={{ marginTop: "0.8rem" }}>{variant.stock > 0 ? (variant.stock < 4 ? `Only ${variant.stock} in the atelier` : "In the atelier") : "Made to order — currently sold out"}</p>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "1rem" }}>
        <button className="size-btn" type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button>
        <span>{quantity}</span>
        <button className="size-btn" type="button" onClick={() => setQuantity((value) => Math.min(variant.stock || 1, value + 1))}>+</button>
      </div>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "1rem" }}>
        <button className="btn btn-ink" type="button" disabled={variant.stock < 1} onClick={() => add(false)}>Add to bag</button>
        <button className="btn btn-line" type="button" disabled={variant.stock < 1} onClick={() => add(true)}>Buy now</button>
        <button className="btn btn-ghost" type="button" onClick={async () => { const result = await toggleWishlistAction(product.id); if (result && "wished" in result) setWished(result.wished); }}>{wished ? "Saved" : "Save"}</button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <p className="price">SKU {variant.sku}</p>
    </div>
  );
}

function unique(values: string[]) {
  return [...new Set(values)];
}
