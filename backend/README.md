# Backend

The API is an Express 5 application using Prisma 7 with PostgreSQL. The API listens on `PORT` (default `5000`) and is mounted at `/api/v1`.

## Setup

Copy `.env.example` to `.env`, set `DATABASE_URL` and a unique, strong `JWT_SECRET`, then run:

```sh
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The server verifies both the PostgreSQL connection and a query before listening. The seed command creates standard context presets and is safe to re-run.

## Authentication and routes

Registration and login issue an HttpOnly cookie. Browser requests must include credentials and the configured `CLIENT_URL` must match the web client origin. Public registration always creates a `DEAF_USER`; administrator roles must be provisioned out-of-band.

The API's routes are mounted in `src/app.js`; OpenAPI documentation is served at `/api/docs`. User-owned sessions, dashboard records, recognition, and calibration profiles require authentication. The recognition endpoint accepts one validated base64 camera frame, forwards it to `ML_SERVICE_URL` with a timeout, validates the returned prediction schema, and maps service failures to explicit gateway errors.

## Recognition boundary

`POST /api/v1/recognition/predict` proxies a single static frame to the Python service at `POST /v1/predict`. The inference service must remain on a private/local network; the Express endpoint is the authenticated public boundary. The recognition model only classifies the limited static fingerspelling labels documented in `ml-service/README.md`; it does not perform continuous signing or translation.

The health endpoint checks PostgreSQL. The dashboard's system-health route also checks whether the inference service has successfully loaded its trained model.

Run tests with `npm test`.
