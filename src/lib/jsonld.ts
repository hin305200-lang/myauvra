export function safeJson(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
