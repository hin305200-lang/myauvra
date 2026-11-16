"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

function displaySrc(src: string) {
  if (!src.includes("images.unsplash.com")) return src;
  try {
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", "1100");
    url.searchParams.set("q", "68");
    return url.toString();
  } catch {
    return src;
  }
}

export function Photo({
  src,
  alt,
  className,
  priority,
  sizes = "(min-width: 1200px) 25vw, (min-width: 800px) 33vw, 50vw",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={cn("bg-sand", className)} style={{ width: "100%", height: "100%" }} aria-hidden />;
  return (
    <Image
      src={displaySrc(src)}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
