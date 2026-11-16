"use client";

import { useEffect, useState } from "react";

export function EnterGate({ brand, line }: { brand: string; line: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("auvra-enter") === "1") setVisible(false);
    } catch {
      setVisible(true);
    }
  }, []);
  if (!visible) return null;
  const letters = (brand.replace(/[^a-z]/gi, "") || "AUVRA").slice(0, 8).toUpperCase().split("");
  return (
    <div className="enter-gate" role="dialog" aria-label={`Enter ${brand}`}>
      <div className="enter-letters" aria-hidden="true">
        {letters.map((letter, index) => (
          <span key={`${letter}-${index}`} style={{ animationDelay: `${index * 0.07}s` }}>{letter}</span>
        ))}
      </div>
      <p className="enter-brand">{brand}</p>
      <p className="enter-line">{line}</p>
      <button
        className="enter-btn"
        type="button"
        onClick={() => {
          try { sessionStorage.setItem("auvra-enter", "1"); } catch { /* ignore */ }
          setVisible(false);
        }}
      >
        Enter the atelier
      </button>
    </div>
  );
}
