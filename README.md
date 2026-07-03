# Teyo Website

Production-hardened Node.js marketplace with Stripe checkout, admin approvals, and customer theme entitlements.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Fill real environment values.
3. Start server with `npm start`.
4. Run syntax checks with `npm run check`.
5. Run runtime API smoke checks with `npm run smoke`.

## Required Environment Variables

- `APP_BASE_URL` (public URL for checkout redirects)
- `DATABASE_URL` (Postgres connection string for production-scale persistence)
- `ADMIN_API_KEY` (minimum 32 random characters)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Security and Data Notes

- Runtime data is stored in Postgres when `DATABASE_URL` is set.
- Local fallback storage uses `storage/data.json` only when `DATABASE_URL` is not provided.
- Public static serving is allowlisted to site files only.
- API responses expose limited public fields unless a valid admin key is provided.
- Admin verification is rate-limited.
- CI runs syntax checks and API smoke tests on push and pull request.

## Health Endpoints

- `GET /api/health` for liveness checks.
- `GET /api/ready` for readiness checks.

## Launch Checklist

1. Set all required environment variables in hosting.
2. Set a strong `ADMIN_API_KEY` (32+ chars).
3. Configure Stripe webhook endpoint to `/api/stripe/webhook`.
4. Confirm `APP_BASE_URL` matches your production domain.
5. Confirm Postgres connectivity (`DATABASE_URL`) and check readiness endpoint reports storage ready.
6. Verify `GET /api/health` and `GET /api/ready` return healthy statuses.
7. Ensure CI workflow passes (`npm run ci`) before deploy.
