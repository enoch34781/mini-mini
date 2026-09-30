import { NextResponse } from "next/server";
import { attachStripeSession, releaseOrderReservation, reserveOrder } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
const minimumOrderCents = 5000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { customer?: Record<string, unknown>; items?: { productId?: unknown; quantity?: unknown }[] } | null;
  const customer = body?.customer;
  const requiredFields = ["fullName", "email", "phone", "address", "city", "country"] as const;
  if (!customer || requiredFields.some((field) => typeof customer[field] !== "string" || !String(customer[field]).trim())) return NextResponse.json({ error: "Complete all delivery details before checkout." }, { status: 400 });
  const email = String(customer.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!Array.isArray(body?.items) || body.items.length === 0 || body.items.length > 30) return NextResponse.json({ error: "Your bag is empty or contains too many items." }, { status: 400 });
  const items = body.items.map((item) => ({ productId: typeof item.productId === "string" ? item.productId : "", quantity: Number(item.quantity) }));
  if (items.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100)) return NextResponse.json({ error: "One or more quantities are invalid." }, { status: 400 });

  let order: ReturnType<typeof reserveOrder>;
  try {
    order = reserveOrder({
      fullName: String(customer.fullName).trim().slice(0, 120),
      email: email.slice(0, 254),
      phone: String(customer.phone).trim().slice(0, 40),
      address: String(customer.address).trim().slice(0, 240),
      city: String(customer.city).trim().slice(0, 120),
      country: String(customer.country).trim().slice(0, 120),
      }, items, minimumOrderCents);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Your bag could not be reserved.";
    return NextResponse.json({ error: message }, { status: message === "Minimum order amount is $50." ? 400 : 409 });
  }

  try {
    const stripe = getStripe();
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      payment_intent_data: { metadata: { orderId: order.id } },
      line_items: order.lines.map((line) => ({
        quantity: line.quantity,
        price_data: { currency: "usd", unit_amount: line.priceCents, product_data: { name: line.name, description: line.description.slice(0, 500) } },
      })),
      success_url: `${origin}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    attachStripeSession(order.id, session.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    releaseOrderReservation(order.id);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Secure checkout is unavailable." }, { status: 503 });
  }
}