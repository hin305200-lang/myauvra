import { formatDate, formatMoney } from "@/lib/format";
import { getPrisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { requireUser } from "@/lib/viewer";

export const metadata = { title: "Your pricing" };

export default async function DiscountsPage() {
  const user = await requireUser();
  const prisma = await getPrisma();
  const settings = await getSettings();
  const codes = await prisma.discount.findMany({ where: { active: true }, orderBy: { code: "asc" } });
  const now = new Date();
  return (
    <div>
      <h1 className="serif" style={{ fontSize: "3rem", fontWeight: 500 }}>Your pricing</h1>
      <p>As a signed-in member you receive {settings.memberDiscountPercent}% off the selling price. {settings.stackDiscounts ? "Codes can be combined with member pricing." : "A code replaces member pricing only when it saves more. They are not stacked."}</p>
      <div className="grid gap-3" style={{ marginTop: "1rem" }}>
        {codes.filter((code) => !code.expiresAt || code.expiresAt > now).map((code) => (
          <article key={code.id} className="panel">
            <p className="eyebrow">{code.code}</p>
            <p>{code.type === "PERCENTAGE" ? `${code.value}% off` : `${formatMoney(code.value, settings.currency)} off`}</p>
            {code.description ? <p>{code.description}</p> : null}
            {code.minPurchase > 0 ? <p className="price">From {formatMoney(code.minPurchase, settings.currency)}</p> : null}
            {code.expiresAt ? <p className="price">Until {formatDate(code.expiresAt)}</p> : null}
          </article>
        ))}
        {codes.length === 0 ? <p>No public codes are active. Your member pricing still applies.</p> : null}
      </div>
      <p className="price">Signed in as {user.email}</p>
    </div>
  );
}
