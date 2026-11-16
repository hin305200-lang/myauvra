import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/format";

export default function robots(): MetadataRoute.Robots {
  const origin = appUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/api"] },
    sitemap: `${origin}/sitemap.xml`,
  };
}
