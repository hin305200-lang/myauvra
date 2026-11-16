"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
