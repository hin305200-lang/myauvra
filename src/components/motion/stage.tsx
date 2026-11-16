"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Photo } from "@/components/product/photo";

export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  if (reduce) return null;
  return <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} />;
}

export function HeroStage({
  image,
  brand,
  title,
  subtitle,
  primary,
  secondary,
}: {
  image: string;
  brand: string;
  title: string;
  subtitle: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string } | null;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1.28]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0.2]);
  const words = title.split(/\s+/).filter(Boolean);

  return (
    <section className="hero" ref={ref}>
      <motion.div className="hero-media" style={reduce ? undefined : { y, scale }}>
        <Photo src={image} alt="" priority sizes="100vw" />
      </motion.div>
      <div className="hero-veil" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <motion.div className="hero-copy" style={reduce ? undefined : { opacity: fade }}>
        <p className="eyebrow hero-kicker">{brand} · Atelier 01</p>
        <h1 className="display">
          {words.map((word, index) => (
            <span className="hero-mask" key={`${word}-${index}`}>
              <motion.span
                className="hero-word"
                initial={reduce ? false : { y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.9, delay: 0.12 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
        >
          {subtitle}
        </motion.p>
        <div className="hero-actions">
          <Link className="btn btn-gold" href={primary.href}>{primary.label}</Link>
          {secondary ? <Link className="btn btn-line hero-ghost" href={secondary.href}>{secondary.label}</Link> : null}
        </div>
      </motion.div>
      <div className="scroll-cue" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
}

export function ParallaxFrame({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1.02]);
  return (
    <div ref={ref} className={className || "visual"}>
      <motion.div className="parallax-fill" style={reduce ? undefined : { y, scale }}>
        {src ? <Photo src={src} alt={alt} sizes="50vw" /> : null}
      </motion.div>
    </div>
  );
}

export function ScrollRail({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["6%", "-18%"]);
  return (
    <div className="rail-wrap" ref={ref}>
      <motion.div className="rail" style={reduce ? undefined : { x }}>
        {children}
      </motion.div>
    </div>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const line = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {line.map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}
