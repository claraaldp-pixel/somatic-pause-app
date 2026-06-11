import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  if (!signature) {
    return new Response("Missing Stripe-Signature header.", { status: 400 });
  }

  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.error("Subscription event missing metadata.user_id", subscription.id);
          break;
        }

        // current_period_end moved from the subscription to its items in
        // newer Stripe API versions; fall back to the legacy field for safety.
        const periodEndSeconds =
          subscription.items.data[0]?.current_period_end ?? subscription.current_period_end;

        const { error } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          current_period_end: periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null,
          price_id: subscription.items.data[0]?.price.id ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        if (error) {
          console.error("Failed to upsert subscription", error);
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
        break;
      }
      default:
        // Ignore other event types
        break;
    }
  } catch (err) {
    console.error("Webhook handler error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
