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
- Marketplace map auto-discovers likely brand stores using OpenStreetMap services and merges them with manual store entries when provided.
- Stock levels remain brand-provided values unless the company submits per-store overrides.
- Product submissions now support size-aware inventory lines in the format `Store Name|Size|Stock Status|YYYY-MM-DD`.
- Marketplace size filters update both search results and the map, and customers can save browser-based restock reminders for exact size/store combinations.
- Owner/admin users can manage live product inventory directly from `inventory.html` using the same size-inventory format.
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

## Mobile App (Android + iOS)

A cross-platform wrapper is included in `teyo-mobile/` using Capacitor, pointed at the live Teyo site.

### Setup

1. `cd teyo-mobile`
2. `npm install`
3. `npm run cap:add:android`
4. `npm run cap:add:ios`
5. `npm run cap:sync`

### Open native projects

- Android Studio: `npm run cap:open:android`
- Xcode (macOS only): `npm run cap:open:ios`

### Publishing

- **Play Store (Android):** build signed AAB in Android Studio, then upload to Google Play Console.
- **App Store (iOS):** archive in Xcode and upload via App Store Connect (requires macOS + Apple Developer account).

### Branding

Set app icons/splash assets in native projects to match the Teyo logo (`favicon.svg`/brand assets in repo).
