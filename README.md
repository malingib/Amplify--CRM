# Amplify CRM

Amplify CRM is a React 19 + Vite + TypeScript CRM with an Express API, Prisma data layer, PostgreSQL/Neon configuration, and optional Google Workspace, Telegram, WhatsApp-provider, and AI integrations.

## Current architecture

- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **API:** Express under `server/src`, exposed by `api/index.ts` for Vercel
- **Data access:** Prisma Client with PostgreSQL
- **Authentication:** bcrypt password hashing, JWT bearer tokens, optional Google sign-in
- **CRM areas:** leads and pipeline, contacts/clients, activities, opportunities, tasks, invoices, transactions, workflows, communications, and workspace discovery features

This deployment is **single-tenant** and is intended for one organization. Workspace-related tables support the application's internal organization and membership features; multi-customer tenant isolation is not a release requirement.

## Local development

Requirements: Node.js 20+ and a PostgreSQL database.

1. Copy `.env.example` to `.env` and configure the required values.
2. Install frontend dependencies: `npm ci`.
3. Install API dependencies: `cd server && npm ci`.
4. Generate Prisma Client: `cd .. && npx prisma generate --schema=server/prisma/schema.prisma`.
5. Start the frontend: `npm run dev`.
6. Start the API in a second terminal: `cd server && npm run dev`.

The API requires `DATABASE_URL` and a strong `JWT_SECRET`; production must never use a development fallback. Optional integrations require their own credentials.

## Quality checks

- Frontend production build: `npm run build`
- Backend TypeScript build: `cd server && npm run build`
- Backend tests: `cd server && npm test`
- CI validates the Prisma schema and workspace platform migration against an isolated PostgreSQL service.

## Deployment

The repository includes a Vercel configuration for the frontend and API entry point. Configure secrets in the deployment environment; never commit real `.env` files or credentials. See [DEPLOY.md](DEPLOY.md) for production configuration and smoke checks.
