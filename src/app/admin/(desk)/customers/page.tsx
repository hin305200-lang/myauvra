import Link from "next/link";
import { getPrisma } from "@/lib/db";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const prisma = await getPrisma();
  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}),
    },
    select: { id: true, name: true, email: true, suspended: true, emailVerified: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="serif" style={{ fontSize: "2.6rem", fontWeight: 500 }}>Customers</h1>
      <form action="/admin/customers"><input className="field" name="q" placeholder="Search name or email" defaultValue={q} /></form>
      <table className="data">
        <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td><Link href={`/admin/customers/${customer.id}`}>{customer.name || "—"}</Link></td>
              <td>{customer.email}</td>
              <td>{customer.suspended ? "Suspended" : "Active"}{customer.emailVerified ? "" : " · unverified"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
