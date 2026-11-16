export type DiscountType = "PERCENTAGE" | "FIXED";
export type ShippingMethod = "standard" | "express";

export type DiscountRule = {
  type: DiscountType;
  value: number;
  minPurchase: number;
  productIds: string[];
  collectionIds: string[];
  categoryIds: string[];
};

export type LineInput = {
  productId: string;
  variantId: string;
  categoryId: string;
  collectionIds: string[];
  quantity: number;
  unitPublicPrice: number;
};

export type QuoteInput = {
  lines: LineInput[];
  isMember: boolean;
  memberPercent: number;
  code: DiscountRule | null;
  stackDiscounts: boolean;
  shippingMethod: ShippingMethod;
  shippingFlat: number;
  shippingExpressExtra: number;
  shippingFreeOver: number;
  taxRateBps: number;
  taxInclusive: boolean;
};

export type CodeStatus =
  | "none"
  | "applied"
  | "replaced_member"
  | "not_stacked"
  | "min_purchase"
  | "not_eligible";

export type QuotedLine = LineInput & {
  unitPrice: number;
  linePublic: number;
  lineCharged: number;
};

export type Quote = {
  publicSubtotal: number;
  memberDiscount: number;
  codeDiscount: number;
  discountTotal: number;
  merchandiseCharged: number;
  shipping: number;
  tax: number;
  total: number;
  codeStatus: CodeStatus;
  lines: QuotedLine[];
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function publicUnitPrice(
  price: number,
  salePrice?: number | null,
  variantPrice?: number | null,
) {
  if (variantPrice != null && variantPrice >= 0) return variantPrice;
  if (salePrice != null && salePrice >= 0 && salePrice < price) return salePrice;
  return Math.max(0, price);
}

export function memberUnitPrice(publicPrice: number, isMember: boolean, memberPercent: number) {
  if (!isMember || memberPercent <= 0 || publicPrice <= 0) return publicPrice;
  const percent = clamp(memberPercent, 0, 100);
  return Math.max(0, Math.round((publicPrice * (100 - percent)) / 100));
}

function lineEligible(line: LineInput, rule: DiscountRule) {
  const hasProducts = rule.productIds.length > 0;
  const hasCollections = rule.collectionIds.length > 0;
  const hasCategories = rule.categoryIds.length > 0;
  if (!hasProducts && !hasCollections && !hasCategories) return true;
  if (hasProducts && rule.productIds.includes(line.productId)) return true;
  if (hasCategories && rule.categoryIds.includes(line.categoryId)) return true;
  if (hasCollections && line.collectionIds.some((id) => rule.collectionIds.includes(id))) return true;
  return false;
}

function savingsFor(amount: number, rule: DiscountRule) {
  if (amount <= 0) return 0;
  if (rule.type === "PERCENTAGE") {
    return Math.round((amount * clamp(rule.value, 0, 100)) / 100);
  }
  return Math.min(Math.max(0, rule.value), amount);
}

function shippingAmount(goods: number, input: QuoteInput) {
  if (goods <= 0 && input.lines.length === 0) return 0;
  const standard = goods >= input.shippingFreeOver ? 0 : Math.max(0, input.shippingFlat);
  if (input.shippingMethod === "express") return standard + Math.max(0, input.shippingExpressExtra);
  return standard;
}

function taxAmount(net: number, shipping: number, input: QuoteInput) {
  const rate = Math.max(0, input.taxRateBps);
  if (rate === 0) return 0;
  const base = Math.max(0, net) + Math.max(0, shipping);
  if (input.taxInclusive) return Math.round((base * rate) / (10000 + rate));
  return Math.round((base * rate) / 10000);
}

export function quoteCart(input: QuoteInput): Quote {
  const lines = input.lines.map((line) => {
    const quantity = Math.max(0, Math.floor(line.quantity));
    const unitPublicPrice = Math.max(0, line.unitPublicPrice);
    const unitMember = memberUnitPrice(unitPublicPrice, input.isMember, input.memberPercent);
    return {
      ...line,
      quantity,
      unitPublicPrice,
      unitMember,
      linePublic: unitPublicPrice * quantity,
      lineMember: unitMember * quantity,
    };
  });

  const publicSubtotal = lines.reduce((sum, line) => sum + line.linePublic, 0);
  const memberSubtotal = lines.reduce((sum, line) => sum + line.lineMember, 0);
  const fullMemberDiscount = publicSubtotal - memberSubtotal;

  let useMember = input.isMember && fullMemberDiscount > 0;
  let codeDiscount = 0;
  let codeStatus: CodeStatus = input.code ? "none" : "none";

  if (input.code) {
    const basis = input.stackDiscounts ? memberSubtotal : publicSubtotal;
    if (basis < Math.max(0, input.code.minPurchase)) {
      codeStatus = "min_purchase";
    } else {
      const eligible = lines.reduce((sum, line) => {
        if (!lineEligible(line, input.code!)) return sum;
        return sum + (input.stackDiscounts ? line.lineMember : line.linePublic);
      }, 0);
      if (eligible <= 0) {
        codeStatus = "not_eligible";
      } else {
        const savings = savingsFor(eligible, input.code);
        if (!input.stackDiscounts && useMember) {
          if (savings > fullMemberDiscount) {
            useMember = false;
            codeDiscount = savings;
            codeStatus = "replaced_member";
          } else {
            codeStatus = "not_stacked";
          }
        } else if (savings > 0) {
          codeDiscount = savings;
          codeStatus = "applied";
        }
      }
    }
  }

  const memberDiscount = useMember ? fullMemberDiscount : 0;
  const discountTotal = memberDiscount + codeDiscount;
  const merchandiseCharged = Math.max(0, publicSubtotal - discountTotal);
  const shipping = shippingAmount(merchandiseCharged, input);
  const tax = taxAmount(merchandiseCharged, shipping, input);
  const total = input.taxInclusive ? merchandiseCharged + shipping : merchandiseCharged + shipping + tax;

  const quoted: QuotedLine[] = lines.map((line) => {
    const unitPrice = useMember ? line.unitMember : line.unitPublicPrice;
    return {
      productId: line.productId,
      variantId: line.variantId,
      categoryId: line.categoryId,
      collectionIds: line.collectionIds,
      quantity: line.quantity,
      unitPublicPrice: line.unitPublicPrice,
      unitPrice,
      linePublic: line.linePublic,
      lineCharged: unitPrice * line.quantity,
    };
  });

  return {
    publicSubtotal,
    memberDiscount,
    codeDiscount,
    discountTotal,
    merchandiseCharged,
    shipping,
    tax,
    total,
    codeStatus,
    lines: quoted,
  };
}
