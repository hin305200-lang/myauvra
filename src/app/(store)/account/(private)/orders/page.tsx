import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { getPrisma } from "@/lib/db";
import { requireUser } from "@/lib/viewer";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await requireUser();
  const prisma = await getPrisma();
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="serif" style={{ fontSize: "3rem", fontWeight: 500 }}>Orders</h1>
      {orders.length === 0 ? <p>You have not placed an order yet.</p> : (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Payment</th><th>Total</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><Link href={`/account/orders/${order.number}`}>{order.number}</Link></td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.status.toLowerCase()}</td>
                  <td>{order.paymentStatus.toLowerCase()}</td>
                  <td>{formatMoney(order.total, order.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
