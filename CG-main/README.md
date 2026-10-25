# QAdmin license management

QAdmin is a single Next.js App Router application. It contains the dashboard and Node.js Route Handlers, uses PostgreSQL through Drizzle ORM, and can be deployed as one Vercel project. There is no Express server.

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `ADMIN_HASH`, and a long random `JWT_SECRET`. Set `CORS_ORIGIN` to the exact external frontend origin, or leave it unset during local development to allow localhost origins.

3. Generate and apply schema:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

`npm run build` applies committed database migrations, generates the obfuscated
payload, and builds Next.js. `db:generate` is only needed after changing
`db/schema.ts` to create a new migration.

The admin login is at `/login`. The health endpoint is `/api/health`.

## API

- `POST /api/admin/login` with `{ "hash": "..." }`
- `GET /api/admin/users` with `Authorization: Bearer <admin JWT>`
- `POST /api/admin/users` with `{ "username": "...", "email": "...", "validityDays": 7 }`
- `PATCH /api/admin/users/:username/status` with `{ "status": "active|ended|revoked" }`
- `POST /api/activate` with `{ "licenseKey": "...", "deviceId": "..." }`

All API routes return JSON, support `OPTIONS`, include CORS headers, and run on the Node.js runtime. License device assignment is guarded by a conditional database update and a unique constraint.

## Vercel deployment

Import this repository as a single Vercel project. Configure the four
environment variables in Vercel Project Settings for the relevant
environments. Do not commit `.env`; Vercel supplies the variables at runtime.
Vercel runs `npm run build`, which automatically applies committed migrations
before building the application.

After deployment, verify `https://your-domain.vercel.app/api/health`, then use `/login` for administration. External clients can call the deployed API URL when their origin matches `CORS_ORIGIN`.
