import type { Request, Response } from "express";
import { getUncachableStripeClient } from "./stripeClient";
import { storage } from "./storage";

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string | undefined;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return res.status(400).send("Missing webhook signature");
  }

  try {
    const stripe = await getUncachableStripeClient();
    const event = stripe.webhooks.constructEvent(req.body, signature, secret);

    if (await storage.isStripeWebhookEventProcessed(event.id)) {
      return res.json({ received: true, deduped: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const weddingId = session.metadata?.weddingId;
        const purpose = session.metadata?.purpose;

        // Contributions also use Checkout Sessions in `mode=payment`. We only promote to Premium for billing flows.
        if (purpose === "billing" && weddingId) {
          await storage.updateWedding(weddingId, { currentPlan: "premium" });
        }
        if (session.subscription) {
          if (purpose !== "billing") break;
          await storage.upsertStripeSubscription({
            id: session.subscription,
            weddingId,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            priceId: session?.display_items?.[0]?.price?.id,
            status: "active",
            currentPeriodEnd: null,
          });
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        let weddingId = invoice.metadata?.weddingId;
        if (!weddingId && subscriptionId) {
          const stripe = await getUncachableStripeClient();
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          weddingId = sub.metadata?.weddingId;
        }
        if (weddingId) {
          await storage.updateWedding(weddingId, { currentPlan: "premium" });
        }
        if (subscriptionId) {
          await storage.upsertStripeSubscription({
            id: subscriptionId,
            weddingId,
            stripeCustomerId: invoice.customer,
            stripeSubscriptionId: subscriptionId,
            priceId: invoice.lines?.data?.[0]?.price?.id,
            status: "active",
            currentPeriodEnd: invoice.lines?.data?.[0]?.period?.end
              ? new Date(invoice.lines.data[0].period.end * 1000)
              : null,
          });
        }
        break;
      }
      default:
        break;
    }

    await storage.logStripeWebhookEvent(event.id, event.type);
    res.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
