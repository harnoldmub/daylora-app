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

    const upsertSubscription = async (subscription: any, weddingId?: string) => {
      const wId = weddingId || subscription?.metadata?.weddingId;
      if (!wId) return;
      await storage.upsertStripeSubscription({
        weddingId: wId,
        stripeCustomerId: String(subscription?.customer || ""),
        stripeSubscriptionId: String(subscription?.id || ""),
        priceId: subscription?.items?.data?.[0]?.price?.id || null,
        status: String(subscription?.status || "incomplete"),
        currentPeriodEnd: subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
      });
      const isPremium = ["active", "trialing"].includes(String(subscription?.status || ""));
      await storage.updateWedding(wId, { currentPlan: isPremium ? "premium" : "free" });
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const weddingId = session.metadata?.weddingId;
        const purpose = session.metadata?.purpose;

        // Contributions also use Checkout Sessions in `mode=payment`. We only promote to Premium for billing flows.
        if (purpose !== "billing" || !weddingId) break;

        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(String(session.subscription));
          await upsertSubscription(sub, weddingId);
        } else {
          // One-time billing purchase: mark premium immediately.
          await storage.updateWedding(weddingId, { currentPlan: "premium" });
        }
        break;
      }
      case "invoice.paid":
      case "invoice_payment.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        let weddingId = invoice.metadata?.weddingId;
        if (!weddingId && subscriptionId) {
          const stripe = await getUncachableStripeClient();
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          weddingId = sub.metadata?.weddingId;
        }
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(String(subscriptionId));
          await upsertSubscription(sub, weddingId);
        } else if (weddingId) {
          // Safety for one-time billing invoices.
          await storage.updateWedding(weddingId, { currentPlan: "premium" });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        await upsertSubscription(sub);
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
