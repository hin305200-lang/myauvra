# Auvra

Auvra is a luxury jewelry store: a public shop, customer accounts with member pricing, a cart and checkout, and an atelier desk for products, orders, customers, discounts, and the homepage.

## Run it locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The shop is at [http://localhost:3847](http://localhost:3847). The atelier desk is at [http://localhost:3847/admin/login](http://localhost:3847/admin/login).

If `DATABASE_URL` is unset, the app uses an embedded Postgres database in `.data/pglite` and seeds a catalog the first time it starts. Set `DATABASE_URL` to your own Postgres and the same schema is applied from `migrations/` on boot. `npm run build` also runs those SQL migrations when `DATABASE_URL` is set.

## Admin

There is no default password in the code. Set these before the first boot, or run `npm run admin:create` afterward:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` — at least 8 characters

The server creates that account if the email does not exist, and promotes it if it does. Registration always creates a customer. Desk access is only granted from those variables or by an existing admin who types `GRANT` on a customer page.

## Accounts and pricing

Guests see the public price. A signed-in customer receives the member percentage from Settings. The line on the shop is: “Member Exclusive: Sign in to unlock your special jewelry pricing.”

Discount codes are created in the desk. They can be a percentage or a fixed amount, with dates, a minimum, usage limits, and optional product, collection, or category limits. Codes do not stack on member pricing unless stacking is turned on. Every total is recalculated on the server.

Password reset and email confirmation are sent with Resend when `RESEND_API_KEY` and `EMAIL_FROM` are set. For local development, `ALLOW_DEV_AUTH_LINKS=true` shows the one-time link on screen. That switch does nothing in production.

## Checkout

With `STRIPE_SECRET_KEY` set, checkout opens Stripe Checkout for the server-computed total. An order becomes paid only when a signed webhook (`STRIPE_WEBHOOK_SECRET`) confirms the amount and currency. Point Stripe at `/api/webhooks/stripe`.

Without Stripe keys, checkout is a clearly labeled development mode. It records the order as a test and does not capture a card.

Card numbers are never stored.

## Images

Paste an `http(s)` or `/uploads/` image address in the desk. If Cloudinary is configured (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), uploads go there. Otherwise they are stored in `public/uploads` as jpeg, png, or webp, up to 5 MB.

## Scripts

- `npm run dev` — shop on port 3847
- `npm run build` / `npm start` — production
- `npm test` — pricing, accounts, cart, checkout totals, and webhook verification
- `npm run db:seed` — settings, homepage sections, and the sample catalog (skipped once products exist)
- `npm run admin:create` — bootstrap the admin from the environment

## Environment

See `.env.example` for `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, Stripe, Cloudinary, and email. Do not commit `.env.local`.

Legal pages are placeholders. Review them, and the phone and address in Settings, before publishing the shop.
