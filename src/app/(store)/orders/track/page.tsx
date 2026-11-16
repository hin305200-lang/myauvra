import type { Metadata } from "next";
import { formatDate, formatMoney } from "@/lib/format";
import { getPrisma } from "@/lib/db";

export const metadata: Metadata = { title: "Track an order" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const number = typeof params.number === "string" ? params.number.trim() : "";
  const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
  const prisma = await getPrisma();
  const order = number && email
    ? await prisma.order.findFirst({ where: { number, email }, include: { items: { select: { id: true, name: true, quantity: true } } } })
    : null;
  return (
    <div className="section" style={{ maxWidth: 640 }}>
      <h1 className="serif" style={{ fontSize: "3.4rem", fontWeight: 500 }}>Track an order</h1>
      <form className="grid gap-3" action="/orders/track">
        <label className="lbl">Order number<input className="field" name="number" defaultValue={number} required /></label>
        <label className="lbl">Email<input className="field" name="email" type="email" defaultValue={email} required /></label>
        <button className="btn btn-ink" type="submit">Look up</button>
      </form>
      {number && email && !order ? <p className="form-error">We could not match that order and email.</p> : null}
      {order ? (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <p>{order.number} · {formatDate(order.createdAt)}</p>
          <p>Status: {order.status.toLowerCase()}</p>
          <p>Payment: {order.paymentStatus.toLowerCase()}</p>
          <p>Tracking: {order.trackingNumber || "Not yet assigned"}</p>
          <p>Total {formatMoney(order.total, order.currency)}</p>
          {order.items.map((item) => <p key={item.id}>{item.name} × {item.quantity}</p>)}
        </div>
      ) : null}
    </div>
  );
}
