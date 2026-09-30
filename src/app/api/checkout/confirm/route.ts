import { NextResponse } from "next/server";
import { confirmPaidOrder, findOrderBySession } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId || !sessionId.startsWith("cs_")) return NextResponse.json({ error: "Checkout session is invalid." }, { status: 400 });
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;
    if (session.payment_status !== "paid" || !orderId) return NextResponse.json({ error: "Payment is not confirmed yet. Please refresh in a moment." }, { status: 409 });
    confirmPaidOrder(orderId, session.id);
    const order = findOrderBySession(session.id);
    if (!order) return NextResponse.json({ error: "The paid order could not be found." }, { status: 404 });
    return NextResponse.json({ order: { orderNumber: order.orderNumber, customerName: order.customerName, total: order.total, status: order.status, items: order.items, address: order.address, city: order.city, country: order.country } });
  } catch {
    return NextResponse.json({ error: "We could not verify the payment right now." }, { status: 503 });
  }
}