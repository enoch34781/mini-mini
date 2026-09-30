"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/components/store-provider";

type DeliveryDetails = { fullName: string; email: string; phone: string; address: string; city: string; country: string };
const emptyDetails: DeliveryDetails = { fullName: "", email: "", phone: "", address: "", city: "", country: "" };

export default function CheckoutPage() {
  const { cartItems, cartTotal } = useStore();
  const [details, setDetails] = useState(emptyDetails);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cartTotal < 50) {
      setMessage("Minimum order amount is $50.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: details, items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Checkout could not be started.");
      window.location.assign(result.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout could not be started.");
      setBusy(false);
    }
  };

  if (!cartItems.length) return <main className="wrap empty-state"><h1>Your bag is empty.</h1><p>Add a few favorites before checkout.</p><Link className="button button-dark" href="/shop">Shop snacks</Link></main>;

  return <main className="wrap"><div className="page-intro"><span className="eyebrow">ALMOST THERE</span><h1 className="page-title">The final details.</h1><p>Your snacks are one good click away.</p></div><div className="checkout-layout"><form className="form-stack" onSubmit={submit}><div className="form-grid"><label className="field">Full name<input required autoComplete="name" value={details.fullName} onChange={(event) => setDetails({ ...details, fullName: event.target.value })} /></label><label className="field">Email<input required type="email" autoComplete="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} /></label><label className="field">Phone number<input required type="tel" autoComplete="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} /></label><label className="field">Country<input required autoComplete="country-name" value={details.country} onChange={(event) => setDetails({ ...details, country: event.target.value })} /></label></div><label className="field">Delivery address<input required autoComplete="street-address" value={details.address} onChange={(event) => setDetails({ ...details, address: event.target.value })} /></label><label className="field">City<input required autoComplete="address-level2" value={details.city} onChange={(event) => setDetails({ ...details, city: event.target.value })} /></label>{message && <p className="checkout-message" role="alert">{message}</p>}<button className="button button-dark" type="submit" disabled={busy || cartTotal < 50}>{busy ? "Opening secure payment..." : <>Pay ${cartTotal.toFixed(2)} securely <LockKeyhole size={16} /></>}</button><Link className="continue-link" href="/cart">Back to your bag</Link></form><aside className="checkout-aside"><h2>Your order</h2>{cartItems.map(({ product, quantity }) => <div className="order-mini-line" key={product.id}><span>{product.name} × {quantity}</span><strong>${(product.price * quantity).toFixed(2)}</strong></div>)}<div className="summary-row total"><span>Total in USD</span><span>${cartTotal.toFixed(2)}</span></div><p className="checkout-secure"><LockKeyhole size={14} /> Secure payment powered by Stripe</p></aside></div></main>;
}