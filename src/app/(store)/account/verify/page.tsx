import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailAction } from "@/server/store-actions";

export const metadata: Metadata = { title: "Confirm email" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const result = token ? await verifyEmailAction(token) : { ok: false as const, error: "This confirmation link is missing its token." };
  return (
    <div className="section" style={{ maxWidth: 560 }}>
      <h1 className="serif" style={{ fontSize: "3.2rem", fontWeight: 500 }}>{result.ok ? "Email confirmed." : "We could not confirm that email."}</h1>
      {"error" in result && result.error ? <p>{result.error}</p> : <p>Thank you. Your account email is confirmed.</p>}
      <Link className="btn btn-ink" href="/account">Go to your account</Link>
    </div>
  );
}
