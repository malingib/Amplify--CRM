# Deployment and release gate

This project is configured for Vercel with an Express API entry point at `api/index.ts` and a Prisma schema at `server/prisma/schema.prisma`. The schema declares PostgreSQL, so deploy against PostgreSQL/Neon.

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

## Build checks

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

The backend test suite currently expects a configured test database and seeded fixtures; CI must provide an isolated database before those tests can be relied on as a release gate.

## Production blockers to clear before release

1. **PostgreSQL migration compatibility:** the current workspace migration contains SQLite-specific SQL (`PRAGMA`, `INSERT OR IGNORE`, and SQLite-style schema types), while Prisma declares PostgreSQL. Convert and validate the migration against a disposable PostgreSQL database before running production migrations.
2. **Workspace SQL compatibility:** platform routes use `?` positional placeholders and SQLite-specific `INSERT OR IGNORE`; rewrite these queries for PostgreSQL and test all workspace operations.
3. **Tenant isolation:** legacy leads, clients, invoices, transactions, tasks, workflows, and communications must be scoped to the authenticated workspace. Test cross-workspace reads and writes, not only the newer workspace tables.
4. **Registration and RBAC:** public registration must always create a least-privileged account; workspace membership roles must be enforced per workspace rather than inferred from a global user role.
5. **Automated verification:** add an isolated PostgreSQL test job, regression tests for role escalation and cross-tenant access, and verify production health after deployment.

Do not apply a schema migration to production until it has been tested against a backup or disposable database and a rollback/recovery plan exists.

## Post-deployment smoke checks

- `GET /api/health` returns healthy database status.
- Unauthenticated API requests return `401` where authentication is required.
- A member of workspace A cannot read or mutate workspace B records by changing IDs or workspace headers.
- Registration cannot create an admin; only authorized admin workflows can grant roles.
- Lead conversion, activity timeline, communication logging, invoice/payment lifecycle, and workflow execution are tested end to end.
- Confirm Vercel deployment status and the deployed commit SHA; a successful GitHub build alone does not prove a deployment is live.
