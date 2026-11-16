import { getSettings } from "@/lib/settings";

export async function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <article className="section" style={{ maxWidth: 760 }}>
      <p className="legal-note">This page uses placeholder legal language for {settings.legalName}. Have counsel review it before you rely on it.</p>
      <h1 className="serif" style={{ fontSize: "clamp(2.8rem, 5vw, 4.2rem)", fontWeight: 500 }}>{title}</h1>
      <p className="price">{settings.legalName} · {settings.legalAddress}</p>
      {children}
    </article>
  );
}
