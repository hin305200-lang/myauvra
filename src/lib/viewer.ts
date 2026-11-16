import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "./db";

export const getViewer = cache(async () => {
  if (!process.env.AUTH_SECRET || process.env.NEXT_PHASE === "phase-production-build") return null;
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        suspended: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    if (!user || user.suspended) return null;
    return user;
  } catch {
    return null;
  }
});

export async function requireUser() {
  const viewer = await getViewer();
  if (!viewer) redirect("/account/login");
  return viewer;
}

export async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "ADMIN") redirect("/admin/login");
  return viewer;
}
