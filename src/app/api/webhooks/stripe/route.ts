import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { confirmPaidOrder, releaseOrderReservation } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId;
  if (orderId && (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && session.payment_status === "paid") {
    confirmPaidOrder(orderId, session.id);
  }
  if (orderId && event.type === "checkout.session.expired") releaseOrderReservation(orderId);
  return NextResponse.json({ received: true });
}