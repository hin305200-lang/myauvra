import { notFound } from "next/navigation";
import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit";
import { formatDate, formatMoney, membershipLevel } from "@/lib/format";
import { getPrisma } from "@/lib/db";
import { grantAdminAction, suspendCustomerAction, verifyCustomerAction } from "@/server/admin-actions";

export default async function CustomerAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prisma = await getPrisma();
  const customer = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, role: true, suspended: true, emailVerified: true, createdAt: true,
      orders: { orderBy: { createdAt: "desc" }, select: { id: true, number: true, total: true, currency: true, status: true, paymentStatus: true, createdAt: true } },
    },
  });
  if (!customer || customer.role === "ADMIN") notFound();
  const spend = customer.orders.filter((order) => order.paymentStatus === "PAID" && order.status !== "CANCELLED").reduce((sum, order) => sum + order.total, 0);
  const level = membershipLevel(spend);
  return (
    <div>
      <h1 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>{customer.name || customer.email}</h1>
      <p>{customer.email} · {customer.phone || "No phone"}</p>
      <p>{level.name} · spent {formatMoney(spend, customer.orders[0]?.currency || "USD")} · joined {formatDate(customer.createdAt)}</p>
      <p>Account {customer.suspended ? "suspended" : "active"} · email {customer.emailVerified ? "confirmed" : "not confirmed"}</p>
      <ActionForm action={suspendCustomerAction} success={customer.suspended ? "Account restored." : "Account suspended."}>
        <input type="hidden" name="id" value={customer.id} />
        <input type="hidden" name="suspended" value={customer.suspended ? "0" : "1"} />
        <SubmitButton>{customer.suspended ? "Restore account" : "Suspend account"}</SubmitButton>
      </ActionForm>
      {!customer.emailVerified ? (
        <form action={verifyCustomerAction}>
          <input type="hidden" name="id" value={customer.id} />
          <button className="btn btn-line" type="submit">Mark email confirmed</button>
        </form>
      ) : null}
      <h2 className="serif">Orders</h2>
      {customer.orders.map((order) => (
        <p key={order.id}><Link href={`/admin/orders/${order.id}`}>{order.number}</Link> · {order.paymentStatus.toLowerCase()} · {formatMoney(order.total, order.currency)}</p>
      ))}
      <p className="price">Passwords are never shown here. Member pricing is the store-wide percentage in settings.</p>
      <GrantForm />
    </div>
  );
}

function GrantForm() {
  return (
    <ActionForm action={grantAdminAction} className="panel" success="That account can now open the desk.">
      <h2 className="serif" style={{ marginTop: 0 }}>Grant desk access</h2>
      <p>Type GRANT and the email of an existing account. Customers cannot do this themselves.</p>
      <input className="field" name="email" type="email" required placeholder="Email" />
      <input className="field" name="confirm" required placeholder="GRANT" />
      <SubmitButton>Grant access</SubmitButton>
    </ActionForm>
  );
}
