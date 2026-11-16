type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true as const };
  }
  if (current.count >= limit) {
    return { ok: false as const, retryAt: current.reset };
  }
  current.count += 1;
  return { ok: true as const };
}

export function clientKey(headers: Headers, action: string, extra = "") {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip") || "local";
  return `${action}:${ip}:${extra.toLowerCase()}`;
}
