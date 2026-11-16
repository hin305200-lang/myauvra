import type { Metadata } from "next";
import localFont from "next/font/local";
import { getSettings } from "@/lib/settings";
import { appUrl } from "@/lib/format";
import "./globals.css";

const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-400.woff", weight: "400", style: "normal" },
    { path: "../fonts/cormorant-500.woff", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-600.woff", weight: "600", style: "normal" },
    { path: "../fonts/cormorant-400i.woff", weight: "400", style: "italic" },
    { path: "../fonts/cormorant-400i.woff", weight: "500", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});
const outfit = localFont({
  src: [
    { path: "../fonts/outfit-300.woff", weight: "300", style: "normal" },
    { path: "../fonts/outfit-400.woff", weight: "400", style: "normal" },
    { path: "../fonts/outfit-500.woff", weight: "500", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
});
const playfair = localFont({
  src: [
    { path: "../fonts/playfair-400.woff", weight: "400", style: "normal" },
    { path: "../fonts/playfair-500.woff", weight: "500", style: "normal" },
    { path: "../fonts/playfair-600.woff", weight: "600", style: "normal" },
    { path: "../fonts/playfair-400i.woff", weight: "400", style: "italic" },
  ],
  variable: "--font-playfair",
  display: "swap",
});
const nunito = localFont({
  src: [
    { path: "../fonts/nunito-400.woff", weight: "400", style: "normal" },
    { path: "../fonts/nunito-500.woff", weight: "500", style: "normal" },
    { path: "../fonts/nunito-600.woff", weight: "600", style: "normal" },
  ],
  variable: "--font-nunito",
  display: "swap",
});
const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces-400.woff", weight: "400", style: "normal" },
    { path: "../fonts/fraunces-500.woff", weight: "500", style: "normal" },
    { path: "../fonts/fraunces-600.woff", weight: "600", style: "normal" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});
const manrope = localFont({
  src: [
    { path: "../fonts/manrope-400.woff", weight: "400", style: "normal" },
    { path: "../fonts/manrope-500.woff", weight: "500", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = `${settings.brandName} — Fine jewelry`;
  return {
    metadataBase: new URL(appUrl()),
    title: { default: title, template: `%s · ${settings.brandName}` },
    description: settings.tagline,
    openGraph: { title, description: settings.tagline, images: [settings.heroImage], type: "website" },
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html
      lang="en"
      data-fonts={settings.fontPair}
      className={`${cormorant.variable} ${outfit.variable} ${playfair.variable} ${nunito.variable} ${fraunces.variable} ${manrope.variable}`}
      style={{
        ["--ivory" as string]: settings.colorBackground,
        ["--sand" as string]: settings.colorSecondary,
        ["--gold" as string]: settings.colorGold,
        ["--ink" as string]: settings.colorText,
        ["--stone" as string]: settings.colorMuted,
      }}
    >
      <body>{children}</body>
    </html>
  );
}
