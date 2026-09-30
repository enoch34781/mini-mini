"use client";

import Link from "next/link";
import { Check, PackageCheck } from "lucide-react";
import { useEffect, useState } from "react";

type ConfirmedOrder = { orderNumber: string; customerName: string; total: number; status: string; items: { name: string; quantity: number }[]; address: string; city: string; country: string };

export default function ConfirmationPage() {
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);
  const [message, setMessage] = useState("Confirming your payment...");

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      window.setTimeout(() => setMessage("We could not find that checkout session. Check your email for payment updates."), 0);
      return;
    }
    fetch(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Payment confirmation is still pending.");
        setOrder(result.order);
        setMessage("");
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Payment confirmation is still pending."));
  }, []);

  if (!order) return <main className="wrap empty-state"><PackageCheck size={38} /><h1>{message}</h1><p>We will only confirm an order after Stripe verifies payment.</p><Link className="button button-dark" href="/shop">Back to the shop</Link></main>;

  return <main className="confirmation"><div className="confirmation-mark"><Check size={28} /></div><span className="eyebrow" style={{ marginTop: 20 }}>THAT&apos;S A WRAP</span><h1>Order Confirmed!</h1><p>Thanks, {order.customerName}. Your fresh batch is on its way to the packing table.</p><section className="confirmation-box"><h2>Order {order.orderNumber}</h2>{order.items.map((item, index) => <p key={`${item.name}-${index}`}>{item.name} × {item.quantity}</p>)}<div className="confirmation-total"><span>Total paid</span><span>${order.total.toFixed(2)} USD</span></div><h2 style={{ marginTop: 22 }}>Delivery information</h2><p>{order.customerName}<br />{order.address}<br />{order.city}, {order.country}</p></section><Link className="button button-dark" style={{ marginTop: 23 }} href="/shop">Back to the shop</Link></main>;
}