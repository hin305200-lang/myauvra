import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { getViewer } from "@/lib/viewer";

export const metadata = { title: "Order received" };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const number = typeof params.order === "string" ? params.order : "";
  const key = typeof params.key === "string" ? params.key : "";
  if (!number) notFound();
  const prisma = await getPrisma();
  const viewer = await getViewer();
  const order = await prisma.order.findUnique({ where: { number }, include: { items: true } });
  if (!order) notFound();
  const allowed = (key && order.idempotencyKey === key) || (viewer && order.userId === viewer.id);
  if (!allowed) notFound();
  const paid = order.paymentStatus === "PAID" || order.paymentStatus === "TEST";
  return (
    <div className="section" style={{ maxWidth: 760 }}>
      <p className="eyebrow">Order {order.number}</p>
      <h1 className="serif" style={{ fontSize: "clamp(3rem, 6vw, 4.8rem)", fontWeight: 500 }}>{paid ? "We have your order." : "We are waiting for payment."}</h1>
      {order.paymentStatus === "TEST" ? <p className="legal-note">Development checkout. No card was charged. This order is recorded so you can follow it in your account and in the atelier desk.</p> : null}
      {order.paymentStatus === "PENDING" ? <p>Stripe has not confirmed payment yet. This page does not mark an order paid on its own. Refresh in a moment, or check your account after the webhook arrives.</p> : null}
      {order.paymentStatus === "PAID" ? <p>Payment is confirmed. We will write when the piece leaves the atelier.</p> : null}
      <p>Placed {formatDate(order.createdAt)} · {formatMoney(order.total, order.currency)}</p>
      <div className="panel">
        {order.items.map((item) => (
          <p key={item.id} style={{ display: "flex", justifyContent: "space-between" }}><span>{item.name} × {item.quantity}</span><span>{formatMoney(item.lineTotal, order.currency)}</span></p>
        ))}
        <p>Status: {order.status.toLowerCase()} · Payment: {order.paymentStatus.toLowerCase()}</p>
      </div>
      <Link className="btn btn-ink" href={viewer ? `/account/orders/${order.number}` : "/orders/track"}>Track this order</Link>
    </div>
  );
}
