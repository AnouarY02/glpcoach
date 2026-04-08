import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createServerClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Disable body parsing — Stripe needs raw body for signature verification
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature failed" },
      { status: 400 }
    );
  }

  // Use service role for admin writes (bypasses RLS)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.CheckoutSession;
      const userId = session.client_reference_id;

      if (userId) {
        await supabase
          .from("user_profiles")
          .update({ subscription_tier: "pro" })
          .eq("id", userId);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const customer = (await stripe.customers.retrieve(
        customerId
      )) as Stripe.Customer;

      if (customer.email) {
        await supabase
          .from("user_profiles")
          .update({ subscription_tier: "free" })
          .eq("email", customer.email);
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const isActive =
        subscription.status === "active" ||
        subscription.status === "trialing";

      const customer = (await stripe.customers.retrieve(
        customerId
      )) as Stripe.Customer;

      if (customer.email) {
        await supabase
          .from("user_profiles")
          .update({ subscription_tier: isActive ? "pro" : "free" })
          .eq("email", customer.email);
      }
    }
  } catch (err: unknown) {
    console.error("Webhook handler error:", err);
    // Return 200 to prevent Stripe from retrying for non-signature errors
    return NextResponse.json({ received: true, warning: "Handler error" });
  }

  return NextResponse.json({ received: true });
}
