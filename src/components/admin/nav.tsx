"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/server/store-actions";

const LINKS = [
  ["/admin", "Overview"],
  ["/admin/products", "Products"],
  ["/admin/orders", "Orders"],
  ["/admin/customers", "Customers"],
  ["/admin/discounts", "Discounts"],
  ["/admin/content", "Website"],
  ["/admin/messages", "Messages"],
  ["/admin/settings", "Settings"],
];

export function AdminNav({ name }: { name: string }) {
  const path = usePathname();
  return (
    <aside className="admin-side">
      <Link href="/" className="wordmark" style={{ color: "white", padding: "0.4rem 0.7rem" }}>Auvra</Link>
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} data-active={path === href || (href !== "/admin" && path.startsWith(href))}>{label}</Link>
      ))}
      <p style={{ marginTop: "auto", padding: "0.7rem", fontSize: "0.85rem" }}>{name}</p>
      <form action={logoutAction}><button className="btn btn-line" type="submit" style={{ color: "white", borderColor: "white" }}>Sign out</button></form>
    </aside>
  );
}
