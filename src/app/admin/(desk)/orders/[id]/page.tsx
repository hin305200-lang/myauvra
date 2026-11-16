import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit";
import { formatDate, formatMoney } from "@/lib/format";
import { getPrisma } from "@/lib/db";
import { markPaidAction, refundOrderAction, updateOrderAction } from "@/server/admin-actions";

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prisma = await getPrisma();
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, user: { select: { id: true, name: true, email: true } } } });
  if (!order) notFound();
  const shipping = order.shippingAddress as { fullName?: string; line1?: string; city?: string; country?: string } | null;
  return (
    <div className="grid gap-4">
      <div>
        <p className="eyebrow">{formatDate(order.createdAt)}</p>
        <h1 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>{order.number}</h1>
        <p>{order.user ? <a href={`/admin/customers/${order.user.id}`}>{order.user.name || order.email}</a> : order.email}</p>
        <p>Payment {order.paymentStatus.toLowerCase()} · {formatMoney(order.total, order.currency)}</p>
        {order.paymentStatus === "TEST" ? <p className="legal-note">Recorded through development checkout. No card was charged.</p> : null}
        {shipping ? <p>{shipping.fullName}, {shipping.line1}, {shipping.city}, {shipping.country}</p> : null}
      </div>
      <div className="panel">
        {order.items.map((item) => <p key={item.id}>{item.name} · {item.sku} × {item.quantity} · {formatMoney(item.lineTotal, order.currency)}</p>)}
      </div>
      <ActionForm action={updateOrderAction} className="panel" success="Order updated.">
        <input type="hidden" name="id" value={order.id} />
        <label className="lbl">Status
          <select className="field" name="status" defaultValue={order.status}>
            {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="lbl">Tracking<input className="field" name="trackingNumber" defaultValue={order.trackingNumber || ""} /></label>
        <SubmitButton>Update order</SubmitButton>
      </ActionForm>
      {order.paymentStatus === "PENDING" ? (
        <ActionForm action={markPaidAction} success="Marked paid.">
          <input type="hidden" name="id" value={order.id} />
          <SubmitButton>Mark paid</SubmitButton>
        </ActionForm>
      ) : null}
      {order.paymentStatus === "PAID" ? (
        <ActionForm action={refundOrderAction} success="Refund recorded and the order cancelled.">
          <input type="hidden" name="id" value={order.id} />
          <SubmitButton>Refund and cancel</SubmitButton>
        </ActionForm>
      ) : null}
    </div>
  );
}
