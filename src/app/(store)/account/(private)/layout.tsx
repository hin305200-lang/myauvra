import Link from "next/link";
import { requireUser } from "@/lib/viewer";
import { logoutAction } from "@/server/store-actions";

const LINKS = [
  ["/account", "Profile"],
  ["/account/orders", "Orders"],
  ["/account/addresses", "Addresses"],
  ["/account/wishlist", "Wishlist"],
  ["/account/discounts", "Pricing"],
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="section account-grid">
      <aside>
        <p className="eyebrow">Account</p>
        <p>{user.name || user.email}</p>
        <nav className="grid gap-2" style={{ margin: "1rem 0" }}>
          {LINKS.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <form action={logoutAction}><button className="btn btn-ghost" type="submit">Sign out</button></form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
