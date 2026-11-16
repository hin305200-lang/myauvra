import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section">
      <p className="eyebrow">404</p>
      <h1 className="display" style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}>This page has left the atelier.</h1>
      <Link className="btn btn-ink" href="/shop">Return to the collection</Link>
    </div>
  );
}
