# Deployment and release gate

This project is configured for Vercel with an Express API entry point at `api/index.ts` and a Prisma schema at `server/prisma/schema.prisma`. Deploy against PostgreSQL/Neon. This is a **single-tenant application for one organization**; do not introduce multi-customer tenant isolation as a release prerequisite.

## Required environment

Set these in the deployment environment (not in Git):

- `DATABASE_URL` — PostgreSQL/Neon connection string
- `JWT_SECRET` — high-entropy production secret; required when `NODE_ENV=production`
- `CORS_ORIGINS` — JSON array or comma-separated list of exact trusted origins
- `APP_URL` — canonical public app URL

Optional integration variables:

- Google sign-in: `GOOGLE_CLIENT_ID`, `GOOGLE_ALLOWED_DOMAIN`
- Google Workspace APIs: `GOOGLE_SERVICE_ACCOUNT_KEY`, `GMAIL_SENDER`, `GOOGLE_CALENDAR_ID`, `GOOGLE_CHAT_VERIFICATION_TOKEN`
- AI: `GEMINI_API_KEY`
- Telegram: `TELEGRAM_BOT_TOKEN`
- WhatsApp provider: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`
- Payment integration: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`
- MobiWave messaging: `MOBIWAVE_API_KEY`, `MOBIWAVE_SENDER_ID`

Only enable integrations whose credentials and callback URLs have been configured and tested.

## Build and test checks

```bash
npm ci
npx prisma generate --schema=server/prisma/schema.prisma
npm run build
cd server
npm ci
npx prisma generate
npm run build
npm test
```

CI runs the backend tests against a disposable PostgreSQL service and applies the platform migration there. Never use the CI database settings in production.

## Database release safety

The platform migration is PostgreSQL-specific. Before applying schema changes to the production database, take a backup and verify the migration against a disposable copy. Confirm the production environment points to the intended PostgreSQL database and keep a recovery plan.

## Post-deployment smoke checks

- `GET /api/health` reports healthy database status.
- Unauthenticated API requests return `401` where authentication is required.
- Registration cannot grant an administrator role by supplying a request field.
- Verify core CRM create, read, update and delete flows.
- Verify lead conversion, activity timeline, communication logging, invoice/payment lifecycle, and workflow execution.
- Confirm Vercel deployment status and deployed commit SHA; a successful GitHub build alone does not prove production is live.
