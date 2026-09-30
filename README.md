# Mini Mini Chinchin

A mobile-friendly snack shop built with Next.js, TypeScript, SQLite, and Stripe Checkout. The catalog, inventory, orders, and admin changes are stored server-side. The browser cart is persisted locally, but prices and available stock are rechecked by the server before checkout.

## Run locally

Requirements: Node.js 22 or newer and npm.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET`. Use a long unique password and at least 32 random characters for the session secret. For example, generate the session secret with `openssl rand -base64 32`.
4. Add Stripe test credentials for `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
5. Start with `npm run dev` and open `http://localhost:3000`.

SQLite is created and seeded automatically at `.data/mini-mini.sqlite` on first request. The starter catalog includes Mini Mini Chinchin and Honey Cornflake Crunch. Product images can be changed in the admin area; uploaded images are stored under `public/uploads`.

## Stripe test checkout

Use Stripe test-mode API keys. Forward Stripe events to `http://localhost:3000/api/webhooks/stripe` with the Stripe CLI, then put the CLI's signing secret in `STRIPE_WEBHOOK_SECRET`. The relevant events are `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.expired`. Stripe Checkout redirects back to the confirmation page, which independently retrieves the session and verifies its paid status. The webhook and confirmation route are both idempotent.

Checkout is disabled below the $50 minimum. The server recalculates prices from SQLite, validates available inventory, reserves stock transactionally, and restores reservations when a Stripe session expires or cannot be created. A payment is never marked paid from browser-provided data.

## Store owner

Visit `/admin/login` and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env.local`. Admin mutations use a signed, 12-hour HttpOnly, SameSite=Strict cookie. The dashboard manages products, images, stock, order details, fulfillment status, and paid sales totals.

## Production notes

Run on a Node.js host with a persistent writable disk. SQLite and uploaded product images are stored locally; ephemeral/serverless filesystems will lose them. For horizontally scaled or serverless hosting, move the database to a managed relational database and product images to durable object storage before launch. Set production Stripe keys and a webhook endpoint for the deployed HTTPS URL. Keep `.env.local` and all provider secrets out of source control.

## Checks

- `npm run lint`
- `npm run build`