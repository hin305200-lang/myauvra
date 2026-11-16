import { describe, expect, it } from "vitest";
import { memberUnitPrice, publicUnitPrice, quoteCart, type DiscountRule, type LineInput } from "./pricing";

const ring: LineInput = {
  productId: "ring",
  variantId: "v1",
  categoryId: "rings",
  collectionIds: ["bridal"],
  quantity: 1,
  unitPublicPrice: 100000,
};

const base = {
  lines: [ring],
  isMember: false,
  memberPercent: 10,
  code: null as DiscountRule | null,
  stackDiscounts: false,
  shippingMethod: "standard" as const,
  shippingFlat: 2500,
  shippingExpressExtra: 3500,
  shippingFreeOver: 50000,
  taxRateBps: 0,
  taxInclusive: false,
};

describe("public and member prices", () => {
  it("uses a sale price when it is lower than the list price", () => {
    expect(publicUnitPrice(420000, 380000)).toBe(380000);
    expect(publicUnitPrice(420000, 450000)).toBe(420000);
    expect(publicUnitPrice(420000, null, 390000)).toBe(390000);
  });

  it("applies member pricing only for members", () => {
    expect(memberUnitPrice(100000, false, 10)).toBe(100000);
    expect(memberUnitPrice(100000, true, 10)).toBe(90000);
    expect(memberUnitPrice(100050, true, 10)).toBe(90045);
  });
});

describe("quoteCart", () => {
  it("charges guests the public price plus shipping", () => {
    const quote = quoteCart(base);
    expect(quote.publicSubtotal).toBe(100000);
    expect(quote.memberDiscount).toBe(0);
    expect(quote.shipping).toBe(0);
    expect(quote.total).toBe(100000);
  });

  it("gives members their discount and keeps it off the payable merchandise", () => {
    const quote = quoteCart({ ...base, isMember: true, lines: [{ ...ring, unitPublicPrice: 20000 }] });
    expect(quote.memberDiscount).toBe(2000);
    expect(quote.merchandiseCharged).toBe(18000);
    expect(quote.shipping).toBe(2500);
    expect(quote.total).toBe(20500);
    expect(quote.lines[0].unitPrice).toBe(18000);
  });

  it("does not stack a weaker code onto member pricing", () => {
    const quote = quoteCart({
      ...base,
      isMember: true,
      code: { type: "PERCENTAGE", value: 5, minPurchase: 0, productIds: [], collectionIds: [], categoryIds: [] },
    });
    expect(quote.codeStatus).toBe("not_stacked");
    expect(quote.memberDiscount).toBe(10000);
    expect(quote.codeDiscount).toBe(0);
    expect(quote.total).toBe(90000);
  });

  it("lets a stronger code replace member pricing when stacking is off", () => {
    const quote = quoteCart({
      ...base,
      isMember: true,
      code: { type: "PERCENTAGE", value: 20, minPurchase: 0, productIds: [], collectionIds: [], categoryIds: [] },
    });
    expect(quote.codeStatus).toBe("replaced_member");
    expect(quote.memberDiscount).toBe(0);
    expect(quote.codeDiscount).toBe(20000);
    expect(quote.total).toBe(80000);
    expect(quote.lines[0].unitPrice).toBe(100000);
  });

  it("stacks member pricing and a code when the atelier allows it", () => {
    const quote = quoteCart({
      ...base,
      isMember: true,
      stackDiscounts: true,
      code: { type: "PERCENTAGE", value: 10, minPurchase: 0, productIds: [], collectionIds: [], categoryIds: [] },
    });
    expect(quote.codeStatus).toBe("applied");
    expect(quote.memberDiscount).toBe(10000);
    expect(quote.codeDiscount).toBe(9000);
    expect(quote.merchandiseCharged).toBe(81000);
  });

  it("caps a fixed code at the merchandise it can touch", () => {
    const quote = quoteCart({
      ...base,
      lines: [{ ...ring, unitPublicPrice: 5000 }],
      code: { type: "FIXED", value: 8000, minPurchase: 0, productIds: [], collectionIds: [], categoryIds: [] },
    });
    expect(quote.codeDiscount).toBe(5000);
    expect(quote.total).toBe(2500);
  });

  it("refuses a code below the minimum purchase", () => {
    const quote = quoteCart({
      ...base,
      lines: [{ ...ring, unitPublicPrice: 4000 }],
      code: { type: "PERCENTAGE", value: 50, minPurchase: 10000, productIds: [], collectionIds: [], categoryIds: [] },
    });
    expect(quote.codeStatus).toBe("min_purchase");
    expect(quote.codeDiscount).toBe(0);
  });

  it("limits a code to the categories it names", () => {
    const quote = quoteCart({
      ...base,
      lines: [ring, { ...ring, productId: "chain", variantId: "v2", categoryId: "necklaces", collectionIds: [], unitPublicPrice: 8000 }],
      code: { type: "FIXED", value: 3000, minPurchase: 0, productIds: [], collectionIds: [], categoryIds: ["rings"] },
    });
    expect(quote.codeStatus).toBe("applied");
    expect(quote.codeDiscount).toBe(3000);
    expect(quote.merchandiseCharged).toBe(105000);
  });

  it("adds express shipping and exclusive tax", () => {
    const quote = quoteCart({
      ...base,
      lines: [{ ...ring, unitPublicPrice: 10000 }],
      shippingMethod: "express",
      taxRateBps: 800,
    });
    expect(quote.shipping).toBe(6000);
    expect(quote.tax).toBe(1280);
    expect(quote.total).toBe(17280);
  });

  it("extracts inclusive tax without raising the total", () => {
    const quote = quoteCart({
      ...base,
      lines: [{ ...ring, unitPublicPrice: 11000 }],
      shippingFlat: 0,
      shippingFreeOver: 0,
      taxRateBps: 1000,
      taxInclusive: true,
    });
    expect(quote.shipping).toBe(0);
    expect(quote.tax).toBe(1000);
    expect(quote.total).toBe(11000);
  });
});
