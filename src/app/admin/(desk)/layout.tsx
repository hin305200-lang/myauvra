import { AdminNav } from "@/components/admin/nav";
import { requireAdmin } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="admin">
      <AdminNav name={admin.name || admin.email} />
      <div className="admin-main">{children}</div>
    </div>
  );
}
