import Link from "next/link";
import { CountUp } from "@/components/admin/count";
import { formatMoney } from "@/lib/format";
import { getPrisma } from "@/lib/db";

export const metadata = { title: "Overview" };

export default async function AdminHome() {
  const prisma = await getPrisma();
  const paid = { paymentStatus: { in: ["PAID", "TEST"] as ("PAID" | "TEST")[] }, status: { not: "CANCELLED" as const } };
  const [revenue, orders, customers, products, pending, low, recent, sales, best] = await Promise.all([
    prisma.order.aggregate({ where: paid, _sum: { total: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.productVariant.findMany({ where: { stock: { lte: 2 } }, include: { product: true }, take: 6, orderBy: { stock: "asc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.order.findMany({ where: paid, select: { total: true, createdAt: true } }),
    prisma.orderItem.groupBy({ by: ["name"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
  ]);
  const months = lastMonths(6);
  const bars = months.map((month) => ({
    label: month.label,
    total: sales.filter((order) => order.createdAt >= month.start && order.createdAt < month.end).reduce((sum, order) => sum + order.total, 0),
  }));
  const peak = Math.max(1, ...bars.map((bar) => bar.total));
  const currency = recent[0]?.currency || "USD";
  return (
    <div>
      <h1 className="serif" style={{ fontSize: "2.8rem", fontWeight: 500 }}>Overview</h1>
      <div className="stat-grid">
        <article className="stat"><span>Revenue</span><b><CountUp value={revenue._sum.total ?? 0} currency={currency} /></b></article>
        <article className="stat"><span>Orders</span><b><CountUp value={orders} /></b></article>
        <article className="stat"><span>Customers</span><b><CountUp value={customers} /></b></article>
        <article className="stat"><span>Products</span><b><CountUp value={products} /></b></article>
      </div>
      <div className="shop-layout" style={{ marginTop: "1.2rem" }}>
        <section className="panel">
          <h2 className="serif" style={{ marginTop: 0 }}>Sales</h2>
          <div className="bars" aria-label="Sales by month">
            {bars.map((bar) => <span key={bar.label} title={`${bar.label} ${formatMoney(bar.total, currency)}`} style={{ height: `${Math.max(4, (bar.total / peak) * 100)}%` }} />)}
          </div>
          <p className="price">{bars.map((bar) => bar.label).join(" · ")}</p>
          <p>Pending or processing: {pending}</p>
        </section>
        <section className="panel">
          <h2 className="serif" style={{ marginTop: 0 }}>Best sellers</h2>
          {best.length === 0 ? <p>No paid pieces yet.</p> : best.map((row) => <p key={row.name}>{row.name} · {row._sum.quantity}</p>)}
          <h2 className="serif">Low stock</h2>
          {low.length === 0 ? <p>Stock looks comfortable.</p> : low.map((variant) => (
            <p key={variant.id}><Link href={`/admin/products/${variant.productId}`}>{variant.product.name}</Link> · {variant.sku} · {variant.stock}</p>
          ))}
        </section>
      </div>
      <section className="panel" style={{ marginTop: "1rem" }}>
        <h2 className="serif" style={{ marginTop: 0 }}>Recent orders</h2>
        {recent.map((order) => (
          <p key={order.id}><Link href={`/admin/orders/${order.id}`}>{order.number}</Link> · {order.email} · {order.status.toLowerCase()} · {formatMoney(order.total, order.currency)}</p>
        ))}
      </section>
    </div>
  );
}

function lastMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { start, end, label: start.toLocaleString("en-US", { month: "short" }) };
  });
}
