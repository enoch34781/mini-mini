import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local.");
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}