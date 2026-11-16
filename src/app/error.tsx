"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="section">
      <h1 className="serif" style={{ fontSize: "3rem", fontWeight: 500 }}>Something interrupted this page.</h1>
      <button className="btn btn-ink" type="button" onClick={() => reset()}>Try again</button>
    </div>
  );
}
