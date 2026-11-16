import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { getPrisma } from "@/lib/db";

export const metadata = { title: "Orders" };

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : "";
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const prisma = await getPrisma();
  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: status as "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" } : {}),
      ...(q ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
      ...(from || to ? { createdAt: { gte: from ? new Date(from) : undefined, lte: to ? new Date(`${to}T23:59:59`) : undefined } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>Orders</h1>
      <form className="product-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }} action="/admin/orders">
        <input className="field" name="q" placeholder="Number or email" defaultValue={q} />
        <select className="field" name="status" defaultValue={status}>
          <option value="">Any status</option>
          {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input className="field" type="date" name="from" defaultValue={from} aria-label="From" />
        <input className="field" type="date" name="to" defaultValue={to} aria-label="To" />
        <button className="btn btn-ink" type="submit">Filter</button>
      </form>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><Link href={`/admin/orders/${order.id}`}>{order.number}</Link><div className="price">{formatDate(order.createdAt)}</div></td>
                <td>{order.email}</td>
                <td>{order.status.toLowerCase()}</td>
                <td>{order.paymentStatus.toLowerCase()}</td>
                <td>{formatMoney(order.total, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
