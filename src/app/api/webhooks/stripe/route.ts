import { getPrisma } from "@/lib/db";
import { applyStripeEvent, verifyStripeWebhook } from "@/lib/stripe-events";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  try {
    const event = verifyStripeWebhook(payload, signature);
    const prisma = await getPrisma();
    const result = await applyStripeEvent(prisma, event);
    return Response.json(result);
  } catch {
    return Response.json({ error: "The webhook signature could not be verified." }, { status: 400 });
  }
}
