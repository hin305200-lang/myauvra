"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { MEMBER_NOTE } from "@/lib/copy";
import { Photo } from "./photo";
import { Modal } from "@/components/ui/dialog";
import { toggleWishlistAction, addToCartAction } from "@/server/store-actions";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/site/cart-provider";

export type CardModel = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  material: string;
  gemstone: string | null;
  images: string[];
  publicPrice: number;
  memberPrice: number;
  isMember: boolean;
  memberPercent: number;
  inStock: boolean;
  badge?: string;
  wished?: boolean;
  currency: string;
  variantId?: string;
  bestSeller?: boolean;
  isNew?: boolean;
  featured?: boolean;
};

export function ProductCard({ product }: { product: CardModel }) {
  const [open, setOpen] = useState(false);
  const [wished, setWished] = useState(Boolean(product.wished));
  const price = product.isMember ? product.memberPrice : product.publicPrice;
  const compare = product.isMember ? product.publicPrice : product.salePrice ? product.price : null;
  return (
    <article className="product-card rise">
      <div className="frame">
        <Link href={`/product/${product.slug}`} className="block relative w-full h-full">
          <Photo src={product.images[0]} alt={product.name} className="primary object-cover" />
          {product.images[1] ? <Photo src={product.images[1]} alt="" className="alt object-cover" /> : null}
        </Link>
        {product.badge ? <span className="badge">{product.badge}</span> : null}
        <button
          className="icon-btn"
          style={{ position: "absolute", top: "0.4rem", right: "0.3rem", background: "rgba(250,248,243,0.85)" }}
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          onClick={async () => {
            const result = await toggleWishlistAction(product.id);
            if (result && "wished" in result) setWished(result.wished);
          }}
        >
          <Heart size={16} fill={wished ? "currentColor" : "none"} />
        </button>
      </div>
      <h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
      <p className="price">
        {compare && compare > price ? <s>{formatMoney(compare, product.currency)}</s> : null}
        <strong>{formatMoney(price, product.currency)}</strong>
        {product.isMember ? <span> · Member</span> : null}
      </p>
      {!product.isMember && product.memberPercent > 0 ? <p className="member-note">{MEMBER_NOTE}</p> : null}
      <button className="btn btn-ghost" type="button" onClick={() => setOpen(true)}>Quick view</button>
      <Modal open={open} onOpenChange={setOpen} title={product.name}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="frame" style={{ minHeight: "320px" }}>
            <Photo src={product.images[0]} alt={product.name} sizes="50vw" />
          </div>
          <div>
            <p>{product.material}{product.gemstone ? ` · ${product.gemstone}` : ""}</p>
            <p className="price"><strong>{formatMoney(price, product.currency)}</strong></p>
            <p>{product.description}</p>
            <QuickAdd slug={product.slug} variantId={product.variantId} onDone={() => setOpen(false)} />
          </div>
        </div>
      </Modal>
    </article>
  );
}

function QuickAdd({ slug, variantId, onDone }: { slug: string; variantId?: string; onDone: () => void }) {
  const add = useAddToBag();
  const [error, setError] = useState("");
  return (
    <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", flexWrap: "wrap" }}>
      <button
        className="btn btn-ink"
        type="button"
        onClick={async () => {
          if (!variantId) return;
          const message = await add(variantId, 1);
          if (message) setError(message);
          else onDone();
        }}
      >
        Add to bag
      </button>
      <Link className="btn btn-line" href={`/product/${slug}`} onClick={onDone}>View piece</Link>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}

export function useAddToBag() {
  const router = useRouter();
  const cart = useCart();
  return async (variantId: string, quantity: number) => {
    const result = await addToCartAction(variantId, quantity);
    if (result && "error" in result && result.error) return result.error;
    router.refresh();
    cart?.setOpen(true);
    return null;
  };
}
