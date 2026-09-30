# Mini Mini Chinchin workspace

- App: Next.js App Router, TypeScript, React, and SQLite via `better-sqlite3`.
- Keep customer prices and inventory authoritative on the server; never mark an order paid without Stripe verification.
- Admin mutations require the signed HttpOnly session in `src/lib/admin-auth.ts`.
- Run `npm run lint` and `npm run build` after changing routes, data models, or shared storefront UI.
- Keep store-facing copy, product seed data, and responsive styles consistent with the bright food-shop design.