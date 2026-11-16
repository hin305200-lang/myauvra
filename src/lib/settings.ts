import { cache } from "react";
import { defaultSettingsData } from "./defaults";
import { getPrisma } from "./db";

export type StoreSettings = Awaited<ReturnType<typeof loadSettings>>;

async function loadSettings() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return { ...defaultSettingsData, updatedAt: new Date() };
  }
  const prisma = await getPrisma();
  return prisma.websiteSettings.findUnique({ where: { id: "default" } }).then(async (row) => {
    if (row) return row;
    const { ensureSettings } = await import("./bootstrap");
    return ensureSettings(prisma);
  });
}

export const getSettings = cache(loadSettings);

export const getSections = cache(async () => {
  if (process.env.NEXT_PHASE === "phase-production-build") return [];
  const prisma = await getPrisma();
  return prisma.homepageSection.findMany({ orderBy: { position: "asc" } });
});

export function sectionMap(sections: Awaited<ReturnType<typeof getSections>>) {
  return new Map(sections.map((section) => [section.key, section]));
}
