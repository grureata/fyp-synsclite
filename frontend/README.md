# Frontend

The Next.js App Router client is in `app/`; it talks to the Express API using
`lib/api.ts` and the `NEXT_PUBLIC_API_BASE_URL` setting.

From this directory, copy `.env.example` to `.env.local`, install dependencies,
and start the development server:

```sh
cp .env.example .env.local
npm ci
npm run dev
```

The client is available at `http://localhost:3000`. Configure the backend's
`CLIENT_URL` to match this origin. For the full setup, workflows, API routes,
and architecture, see [`../PROJECT_DOCUMENTATION.md`](../PROJECT_DOCUMENTATION.md).
