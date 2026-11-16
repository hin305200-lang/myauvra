import { notFound } from "next/navigation";
import { formatDate, formatMoney } from "@/lib/format";
import { getPrisma } from "@/lib/db";
import { requireUser } from "@/lib/viewer";

export default async function OrderDetail({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const user = await requireUser();
  const prisma = await getPrisma();
  const order = await prisma.order.findFirst({ where: { number, userId: user.id }, include: { items: true } });
  if (!order) notFound();
  return (
    <div>
      <p className="eyebrow">{formatDate(order.createdAt)}</p>
      <h1 className="serif" style={{ fontSize: "3rem", fontWeight: 500 }}>{order.number}</h1>
      <p>Status: {order.status.toLowerCase()} · Payment: {order.paymentStatus.toLowerCase()}</p>
      {order.trackingNumber ? <p>Tracking: {order.trackingNumber}</p> : <p>Tracking appears here once the piece ships.</p>}
      {order.paymentStatus === "TEST" ? <p className="legal-note">Development checkout. No card was charged.</p> : null}
      <div className="panel" style={{ marginTop: "1rem" }}>
        {order.items.map((item) => (
          <p key={item.id} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{item.name} × {item.quantity}</span>
            <span>{formatMoney(item.lineTotal, order.currency)}</span>
          </p>
        ))}
        <p>Member pricing −{formatMoney(order.memberDiscount, order.currency)}</p>
        <p>Code −{formatMoney(order.codeDiscount, order.currency)}</p>
        <p>Shipping {formatMoney(order.shippingTotal, order.currency)}</p>
        <p>Tax {formatMoney(order.taxTotal, order.currency)}</p>
        <p><strong>Total {formatMoney(order.total, order.currency)}</strong></p>
      </div>
    </div>
  );
}
