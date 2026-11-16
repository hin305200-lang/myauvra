export async function sendEmail(input: { to: string; subject: string; text: string }) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Auvra <hello@auvra.store>";
  if (!key) return { delivered: false as const };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });
  return { delivered: response.ok as boolean };
}

export function devAuthLinksEnabled() {
  return process.env.ALLOW_DEV_AUTH_LINKS === "true" && process.env.NODE_ENV !== "production";
}
