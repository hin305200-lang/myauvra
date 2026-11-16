"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { NAV } from "@/lib/copy";
import { useCart } from "./cart-provider";
import { ScrollProgress } from "@/components/motion/stage";

export function Header({
  brand,
  logoUrl,
  cartCount,
  wishCount,
  signedIn,
}: {
  brand: string;
  logoUrl?: string | null;
  cartCount: number;
  wishCount: number;
  signedIn: boolean;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const cart = useCart();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [path]);
  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <ScrollProgress />
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <button className="icon-btn menu-toggle" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={20} /></button>
        <Link href="/" className="wordmark">
          {logoUrl ? <img src={logoUrl} alt={brand} style={{ height: 42, width: "auto" }} /> : brand}
          <small>Fine jewelry</small>
        </Link>
      </div>
      <nav className="nav-desktop" aria-label="Primary">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} data-active={path === item.href}>{item.label}</Link>
        ))}
      </nav>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="icon-btn" aria-label="Search" onClick={() => setSearch(true)}><Search size={18} /></button>
        <Link className="icon-btn" href={signedIn ? "/account" : "/account/login"} aria-label="Account"><User size={18} /></Link>
        <Link className="icon-btn" href="/wishlist" aria-label="Wishlist">
          <Heart size={18} />
          {wishCount > 0 ? <span className="count">{wishCount}</span> : null}
        </Link>
        <button className="icon-btn" aria-label="Shopping bag" onClick={() => cart?.setOpen(true)}>
          <ShoppingBag size={18} />
          {cartCount > 0 ? <span className="count">{cartCount}</span> : null}
        </button>
      </div>
      {open ? (
        <div className="mobile-panel">
          <button className="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)}><X /></button>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </div>
      ) : null}
      {search ? (
        <form
          className="mobile-panel"
          onSubmit={(event) => {
            event.preventDefault();
            router.push(`/shop?q=${encodeURIComponent(query)}`);
            setSearch(false);
          }}
        >
          <button className="icon-btn" type="button" aria-label="Close search" onClick={() => setSearch(false)}><X /></button>
          <p className="eyebrow">Search the atelier</p>
          <input className="field" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rings, pearls, gold" aria-label="Search" />
          <button className="btn btn-ink" type="submit">Search</button>
        </form>
      ) : null}
    </header>
  );
}
