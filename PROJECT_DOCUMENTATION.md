# SignSync Lite — Project Documentation

This guide describes the implementation currently in this repository. SignSync
Lite is a research prototype, not a production sign-language interpreter.

## 1. Project overview

SignSync Lite combines an account-backed web client, an API and PostgreSQL
database, and a separately run image-inference service. A signed-in user can
create a session, explicitly capture one camera frame, and request classification
of a held static ASL fingerspelling handshape. Accepted results are saved as
session records and shown in the dashboard. Users can also save calibration
values, submit contact messages, and export records.

Recognition is limited to static labels A–I and K–Y, plus the dataset's
`SPACE` and `NOTHING` classes. J and Z require movement and are unsupported.
The application does not recognize words, phrases, or continuous signing, does
not translate ASL grammar into English sentences, and is not an interpreter.
Do not rely on its predictions for consequential communication.

The main technologies are:

- **Web:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- **API:** Node.js, Express 5, Prisma 7, PostgreSQL, Zod.
- **Inference/training:** Python 3.11, FastAPI, PyTorch/TorchVision,
  MediaPipe, Pillow, NumPy, and scikit-learn.
- **Authentication:** bcrypt password hashes and HS256 JWTs in HttpOnly cookies.

## 2. Installation and setup

### Prerequisites

- Git
- Node.js 22.18 or later and npm
- Python 3.11
- PostgreSQL
- A browser that supports `getUserMedia`; camera access is available on
  `localhost` or an HTTPS origin
- For recognition, the Kaggle image archive and the official MediaPipe Hand
  Landmarker model asset (downloaded separately below)

Training uses a large image dataset and may require substantial storage, memory,
and compute. A trained model and source dataset are deliberately not committed.

### Clone and configure the API

```sh
git clone https://github.com/grureata/fyp-synsclite.git
cd fyp-synsclite
cd backend
cp .env.example .env
```

Edit `backend/.env` with a PostgreSQL connection string and a unique
`JWT_SECRET`. Do not commit `.env` or copy real secret values into documentation.
The API settings are:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` | Yes | Signs and verifies authentication JWTs |
| `PORT` | No | API listen port; defaults to `5000` |
| `CLIENT_URL` | No in development | Allowed web-client origin; defaults to `http://localhost:3000` |
| `JWT_EXPIRES_IN` | No | JWT lifetime; defaults to `7d` |
| `BCRYPT_SALT_ROUNDS` | No | Password-hash work factor; defaults to `10` |
| `RATE_LIMIT_WINDOW_MS` | No | General API rate-limit window; defaults to `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | No | Requests allowed per general window; defaults to `100` |
| `ML_SERVICE_URL` | No | Private inference-service base URL; defaults to `http://localhost:8000` |
| `NODE_ENV` | No | Runtime mode; production requires a 32-character JWT secret and `CLIENT_URL` |

Install and initialize the database:

```sh
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

`prisma:migrate` runs Prisma's development migration workflow. For a production
deployment, apply checked-in migrations with `npx prisma migrate deploy` instead.
The seed command upserts the Social, Medical, and Legal context presets and can
be rerun safely.

### Configure and run the inference service

In a separate terminal, download Kaggle's version 1 archive for
`grassknoted/asl-alphabet` to
`ml-service/data/raw/asl-alphabet-v1.zip`. The archive, extracted images, and
trained artifacts are local-only files. From the repository root:

```sh
cd ml-service
python3.11 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python train.py
mkdir -p models
curl -fL 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' \
  -o models/hand_landmarker.task
.venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Training writes model weights and metadata to the ignored `ml-service/artifacts/`
directory. The service loads both the classifier and the hand detector at
startup. The API forwards only explicitly captured images to this service;
keep it on a private/local network and do not expose it directly to the public
internet.

For the dataset format, license notes, evaluation methodology, and known
limitations, read [`ml-service/README.md`](ml-service/README.md). The dataset
publisher declares GPL-2 for its images; review that license before distributing
data or derived model artifacts. The MediaPipe task model is also downloaded
separately; review its current asset terms before redistribution.

### Configure and run the web client

In another terminal:

```sh
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

`frontend/.env.local` uses `NEXT_PUBLIC_API_BASE_URL` to locate the API. Set
`backend/.env`'s `CLIENT_URL` to the client origin. Open
`http://localhost:3000`, register or sign in, grant camera permission, start a
session, and explicitly capture a held handshape to request recognition.

### Production commands

```sh
# frontend/
npm run build
npm run start

# backend/
npm start
```

Run the Python service separately using Uvicorn with a private bind address and
configure `ML_SERVICE_URL` on the API. Production also needs a reachable
PostgreSQL database, the migrated schema, generated Prisma client, secure
environment variables, HTTPS for the web origin, and matching CORS settings.
The repository does not include a Docker, cloud-hosting, or CI deployment
configuration.

## 3. Relevant folder structure

Generated dependencies, build output, virtual environments, local environment
files, model assets, and datasets are excluded below.

```text
fyp-synsclite/
├── PROJECT_DOCUMENTATION.md
├── PILOT_READINESS.md
├── README.md
├── .gitignore
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── README.md
│   ├── package.json
│   ├── package-lock.json
│   ├── prisma.config.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   │       ├── migration_lock.toml
│   │       └── 20261007121100_init/migration.sql
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   ├── env.js
│   │   │   ├── socket.js
│   │   │   └── swagger.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── errorHandler.middleware.js
│   │   │   ├── notFound.middleware.js
│   │   │   ├── rateLimiter.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   └── validate.middleware.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.service.js
│   │   │   │   └── auth.validation.js
│   │   │   ├── calibration/
│   │   │   │   ├── calibration.controller.js
│   │   │   │   ├── calibration.routes.js
│   │   │   │   └── calibration.service.js
│   │   │   ├── contact/
│   │   │   │   ├── contact.controller.js
│   │   │   │   ├── contact.routes.js
│   │   │   │   └── contact.service.js
│   │   │   ├── content/
│   │   │   │   ├── content.controller.js
│   │   │   │   └── content.routes.js
│   │   │   ├── contextPresets/
│   │   │   │   ├── contextPreset.controller.js
│   │   │   │   ├── contextPreset.routes.js
│   │   │   │   ├── contextPreset.service.js
│   │   │   │   └── contextPreset.validation.js
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.controller.js
│   │   │   │   ├── dashboard.routes.js
│   │   │   │   └── dashboard.service.js
│   │   │   ├── recognition/
│   │   │   │   ├── mlClient.service.js
│   │   │   │   ├── recognition.controller.js
│   │   │   │   ├── recognition.routes.js
│   │   │   │   ├── recognition.service.js
│   │   │   │   └── recognition.validation.js
│   │   │   ├── sessions/
│   │   │   │   ├── session.controller.js
│   │   │   │   ├── session.routes.js
│   │   │   │   ├── session.service.js
│   │   │   │   └── session.validation.js
│   │   │   └── users/
│   │   │       ├── user.controller.js
│   │   │       ├── user.routes.js
│   │   │       └── user.service.js
│   │   └── utils/
│   │       ├── ApiError.js
│   │       ├── ApiResponse.js
│   │       ├── asyncHandler.js
│   │       └── logger.js
│   └── tests/
│       ├── auth.test.js
│       ├── contact.test.js
│       ├── dashboard.test.js
│       ├── recognition-service.test.js
│       ├── recognition.test.js
│       └── sessions.test.js
├── frontend/
│   ├── .env.example
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── README.md
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── favicon.ico
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── privacy/
│   │   │   └── page.tsx
│   │   ├── terms/
│   │   │   └── page.tsx
│   │   └── translate/
│   │       └── page.tsx
│   └── lib/api.ts
└── ml-service/
    ├── README.md
    ├── requirements.txt
    ├── app.py
    ├── train.py
    ├── evaluate_hand_detector.py
    ├── evaluate_service.py
    ├── pilot_data/
    │   ├── README.md
    │   └── validate_manifest.py
    └── tests/
        ├── test_pipeline.py
        └── test_pilot_manifest.py
```

No custom `next.config.ts` is needed; the app uses Next.js defaults. File names
are expanded in the tree to show the relevant source and test layout.

### Important directories and project files

- `backend/src/config/` configures environment values, Prisma/PostgreSQL,
  Socket.IO, and the OpenAPI document.
- `backend/src/middlewares/` holds authentication, role checks, Zod validation,
  rate limiting, not-found handling, and centralized error responses.
- `backend/src/modules/` contains API route/controller/service code grouped by
  application domain.
- `backend/prisma/` defines the PostgreSQL data model, migration history, and
  idempotent context-preset seed.
- `backend/tests/` exercises API behavior using Jest and Supertest; database
  operations are mocked, so these tests do not replace a PostgreSQL integration
  test.
- `frontend/app/` contains the App Router pages, global styling, and shared
  navigation. `frontend/lib/api.ts` is the typed JSON API client.
- `ml-service/` contains training, inference, evaluation, and pilot-data
  validation. Its `data/`, `artifacts/`, `models/`, and `.venv/` directories are
  created locally and ignored by Git.
- `README.md` is the short repository guide; this file is the detailed
  implementation reference. `PILOT_READINESS.md` records the separate,
  not-yet-ready research-pilot gates.
- `frontend/AGENTS.md` and `frontend/CLAUDE.md` contain contributor/tooling
  guidance. They are not runtime dependencies.

## 4. Architecture

```text
Browser (Next.js / React)
  ├── JSON API requests + HttpOnly cookie
  │     ↓
  │   Express API (/api/v1)
  │     ├── auth, validation, rate limits, role checks
  │     ├── Prisma ─────────────── PostgreSQL
  │     └── recognition proxy ──── private FastAPI service
  │                                  ├── MediaPipe hand detector
  │                                  └── PyTorch static-label classifier
  └── Camera preview remains local until user requests a single-frame capture
```

The browser uses `frontend/lib/api.ts` for JSON requests and includes
credentials. Authentication, session, dashboard, calibration, context-preset,
contact, and recognition behavior is exposed by the Express API. Prisma writes
application data to PostgreSQL. Recognition frames travel from the browser
through the authenticated Express endpoint to the Python service; the API
validates the service response before returning it. Accepted results are then
posted to the owning session and persisted in PostgreSQL. The camera frame is
not stored by application code.

Socket.IO is attached to the backend HTTP server and emits a `connection`
status event. The current frontend does not use a Socket.IO client or depend on
real-time events for its workflows.

## 5. Important source-file guide

### Backend entry points, configuration, and shared middleware

| File | Responsibility and interactions |
| --- | --- |
| `backend/src/server.js` | Creates the HTTP server, attaches Socket.IO, connects Prisma, checks the database, and listens on `PORT`. Startup fails explicitly if PostgreSQL is unavailable. |
| `backend/src/app.js` | Creates the Express app, installs security/CORS/compression/logging/JSON middleware and API rate limiting, mounts all routers, exposes health and Swagger UI, then installs not-found and error handlers. |
| `backend/src/config/env.js` | Loads `.env`, validates required database/JWT settings and numeric limits, normalizes the client origin, and exports the runtime `env` object. |
| `backend/src/config/db.js` | Creates the Prisma client with the PostgreSQL adapter and connection-pool limits. |
| `backend/src/config/socket.js` | Creates the Socket.IO server with the configured client origin and sends a connection status event. |
| `backend/src/config/swagger.js` | Builds the OpenAPI 3 path summaries and cookie/Bearer authentication schemes used by `/api/docs`. |
| `backend/src/middlewares/auth.middleware.js` | Verifies HS256 JWTs from a Bearer header or `token` cookie, validates user ID and role claims, and assigns `req.user`. |
| `backend/src/middlewares/role.middleware.js` | Enforces an exact role such as `ADMIN` after authentication. |
| `backend/src/middlewares/validate.middleware.js` | Parses body, params, or query data with Zod; replaces request data with the parsed result or forwards a 400 error. |
| `backend/src/middlewares/rateLimiter.middleware.js` | Configures the general API rate limit from environment settings. |
| `backend/src/middlewares/notFound.middleware.js` | Converts unmatched API paths to the common 404 error response. |
| `backend/src/middlewares/errorHandler.middleware.js` | Maps application and known Prisma errors to HTTP responses, hides 5xx details, and logs server-side failures. |
| `backend/src/utils/ApiError.js` | Carries an HTTP status and optional validation details through the error middleware. |
| `backend/src/utils/ApiResponse.js` | Produces the common `{ success, data, message }` response envelope. |
| `backend/src/utils/asyncHandler.js` | Forwards rejected async route-handler promises to Express error middleware. |
| `backend/src/utils/logger.js` | Configures JSON-formatted Winston console logging. |

### Backend domain files

Each domain's `*.routes.js` file wires an Express route to middleware and its
controller. Controllers read validated request data and the authenticated
`req.user`, call their service or Prisma operation, and return the common
response envelope. Services contain persistence or external-service logic.

| Files | Responsibility, data, and interactions |
| --- | --- |
| `backend/src/modules/auth/auth.routes.js`, `auth.validation.js`, `auth.controller.js`, `auth.service.js` | Register/login validation, account creation, bcrypt verification, JWT creation, HttpOnly cookie management, logout, and current-user lookup. Public registration assigns `DEAF_USER`; password hashes are omitted from responses. |
| `backend/src/modules/users/user.routes.js`, `user.controller.js`, `user.service.js` | Administrator-only listing of up to 100 users, selecting only ID, username, email, role, and creation time. |
| `backend/src/modules/sessions/session.routes.js`, `session.validation.js`, `session.controller.js`, `session.service.js` | Owner-scoped session creation/list/detail/end/delete and record creation. A new accepted record and the session's `totalSignsDetected` increment are committed in one Prisma transaction. Ended sessions reject additional records. |
| `backend/src/modules/calibration/calibration.routes.js`, `calibration.controller.js`, `calibration.service.js` | Get, upsert, and delete the current user's numeric calibration profile. Values are validated before persistence. |
| `backend/src/modules/contextPresets/contextPreset.routes.js`, `contextPreset.validation.js`, `contextPreset.controller.js`, `contextPreset.service.js` | List authenticated context presets; administrators can create validated presets. `backend/prisma/seed.js` supplies the standard Social, Medical, and Legal presets. |
| `backend/src/modules/dashboard/dashboard.routes.js`, `dashboard.controller.js`, `dashboard.service.js` | Aggregate per-user session/record metrics, build a seven-day confidence trend, check PostgreSQL and inference-service health, list up to 100 newest records, and export records as CSV. |
| `backend/src/modules/recognition/recognition.routes.js`, `recognition.validation.js`, `recognition.controller.js`, `recognition.service.js`, `mlClient.service.js` | Validate and proxy a base64 image to Python, validate the prediction schema, translate upstream failures to API errors, and query inference-service health. |
| `backend/src/modules/contact/contact.routes.js`, `contact.controller.js`, `contact.service.js` | Rate-limit and validate contact form submissions, then save them to PostgreSQL. This does not send email. |
| `backend/src/modules/content/content.routes.js`, `content.controller.js` | Publicly retrieve a legal document by slug and let administrators validate/create/update a legal-document row. The current legal pages are rendered from frontend code and do not fetch this API. |

### Frontend source files

| File | Responsibility and interactions |
| --- | --- |
| `frontend/app/layout.tsx` | Defines the shared HTML document and page metadata. |
| `frontend/app/globals.css` | Defines design tokens, responsive layout utilities, components, and animations. |
| `frontend/app/page.tsx` | Public landing page describing the prototype and linking to its workflows. |
| `frontend/app/components/Navbar.tsx` | Shared responsive navigation; checks `/auth/me`, displays the signed-in user, and submits logout requests. |
| `frontend/app/login/page.tsx` | Combined registration/login form that posts to the auth API and navigates to the dashboard after success. |
| `frontend/app/translate/page.tsx` | Loads presets, user records, sessions, calibration, and health; controls local camera access; captures a single JPEG frame on demand; displays uncertainty; saves accepted labels; and manages calibration and CSV export. |
| `frontend/app/dashboard/page.tsx` | Loads summary, records, and system health; validates the response shapes; filters records by context and exports the visible rows. |
| `frontend/app/contact/page.tsx` | Collects contact form fields and submits them to the backend. |
| `frontend/app/about/page.tsx` | Describes actual project components and recognition limitations. |
| `frontend/app/privacy/page.tsx`, `frontend/app/terms/page.tsx` | Static informational pages describing current application data flows, prototype scope, and limitations. |
| `frontend/app/favicon.ico` | Browser tab icon. |
| `frontend/lib/api.ts` | Adds the configured API base URL, credentials, JSON headers, response-envelope checks, and `ApiRequestError` handling to client requests. |

### Inference and model-development files

| File | Responsibility and interactions |
| --- | --- |
| `ml-service/app.py` | FastAPI health and prediction endpoints; validates base64 image requests, decodes and bounds image dimensions, runs hand detection and PyTorch classification, then returns an accepted, uncertain, or no-sign result. |
| `ml-service/train.py` | Extracts the filtered Kaggle archive, performs seeded stratified image-level training/validation, trains MobileNetV3-Small from random initialization, selects a confidence threshold, and writes local weights/metadata/reports. |
| `ml-service/evaluate_hand_detector.py` | Evaluates MediaPipe hand-detection thresholds on validation images and writes a local detector report. |
| `ml-service/evaluate_service.py` | Sends the held-out Kaggle test images to a running inference service and writes local per-image and summary reports. |
| `ml-service/pilot_data/validate_manifest.py` | Checks consent metadata, safe image paths, classes, data quality, and signer-disjoint pilot splits; it does not collect or include participant data. |
| `ml-service/tests/test_pipeline.py`, `test_pilot_manifest.py` | Cover image decoding, uncertainty behavior, stratified splitting, threshold selection, and pilot manifest rules. |
| `ml-service/requirements.txt` | Declares Python service, model-training, image-processing, and evaluation dependencies. |

## 6. Application workflows

### Registration and login

1. The login page submits validated account fields to `POST /auth/register` or
   `POST /auth/login`.
2. The API lowercases validated email addresses, hashes new passwords with
   bcrypt, and creates a JWT containing the user ID and role.
3. The JWT is set as an HttpOnly cookie. Public registration always creates a
   `DEAF_USER`.
4. The navbar checks `GET /auth/me` to identify the current user. Logout clears
   the cookie; it does not delete the account.

### Starting and ending a recognition session

1. The translator loads context presets, existing records, sessions,
   calibration, and inference/database health.
2. The browser asks for camera permission and displays a local preview. Starting
   a session requires an active camera stream and selected context preset; the
   API stores a session linked to the signed-in user and preset.
3. The user holds one handshape and presses **Capture and recognize one
   handshape**. The browser center-crops and encodes one video frame as JPEG; it
   does not stream frames continuously.
4. The authenticated API validates and forwards the base64 image to
   `POST /v1/predict` on the configured inference service.
5. The Python service runs MediaPipe Hand Landmarker and the trained
   MobileNetV3-Small classifier. An accepted static label is returned only when
   its confidence meets the trained threshold and a hand is detected.
   `NOTHING` produces a `no_sign` result; uncertain predictions are not
   accepted.
6. For an accepted label, the browser posts a record to the active session. The
   API atomically creates the record and increments `totalSignsDetected`.
   Uncertain and no-sign results are not saved by this workflow.
7. The user can end the session. Ended sessions cannot receive new records.

The record's `rawGlossSequence` and `synthesizedSentence` currently both hold
the single recognized label. This is a storage/API shape, not evidence of
sentence translation.

### Dashboard, calibration, and contact

- The dashboard retrieves per-user summary, records, and service health; its
  context filters operate on the loaded records. CSV export uses the currently
  displayed subset.
- Calibration is entered by the user and saved with ranges enforced by the
  API. These values are stored settings; the recognition model does not measure
  or consume them.
- The contact form validates and stores a message. The application has no email
  notification or contact-message management UI.
- Privacy and terms pages are static frontend content. Backend legal-document
  GET/PUT routes exist separately and are not currently used by those pages.

## 7. Database

The database is PostgreSQL. Prisma 7 uses the PostgreSQL adapter configured in
`backend/src/config/db.js`; the schema is in `backend/prisma/schema.prisma` and
the initial migration is checked in under `backend/prisma/migrations/`.

| Model | Important fields and relationships |
| --- | --- |
| `User` | Unique `username` and `email`, `passwordHash`, `role`, `createdAt`. Owns zero or one calibration profile and many translation sessions. |
| `CalibrationProfile` | Unique `userId`; `armLengthRatio`, `handScaleFactor`, `signingSpeedFps`, `calibratedAt`. Belongs to a user; user deletion cascades. |
| `ContextPreset` | Unique `name` and `vocabularyDomainDescription`. Referenced by sessions. |
| `TranslationSession` | `userId`, `presetId`, `startTime`, optional `endTime`, `totalSignsDetected`. Belongs to a user and preset; owns translation records. |
| `TranslationRecord` | `sessionId`, `rawGlossSequence`, `synthesizedSentence`, `confidenceScore`, `timestamp`. Belongs to a session; session deletion cascades. |
| `ContactMessage` | Name, email, subject, message, creation time, and `NEW`/`READ`/`RESPONDED` status. |
| `LegalDocument` | Unique slug, title, JSON sections, effective date, and last-updated date. |

```text
User 1 ─── 0..1 CalibrationProfile
User 1 ─── many TranslationSession many ─── 1 ContextPreset
TranslationSession 1 ─── many TranslationRecord
ContactMessage (independent)
LegalDocument (independent)
```

The current API exposes no account-deletion endpoint. Session deletion cascades
to its records; user deletion cascades to calibration profiles and sessions.

## 8. API documentation

Base path: `/api/v1`. Successful and failed API responses use a JSON envelope
with `success`, `data`, and `message`; errors may include `details`.
`/api/docs` serves the generated Swagger UI. It documents route summaries and
authentication schemes, while this table records the implemented behavior.

| Method and path | Authentication | Purpose and input |
| --- | --- | --- |
| `GET /health` | Public | Checks PostgreSQL with `SELECT 1`; returns 503 if unavailable. |
| `POST /auth/register` | Public; auth-attempt limit | Creates an account from username, email, and password; sets auth cookie. |
| `POST /auth/login` | Public; auth-attempt limit | Authenticates email/password; sets auth cookie. |
| `POST /auth/logout` | Public | Clears the auth cookie. |
| `GET /auth/me` | Signed in | Returns the current user without the password hash. |
| `GET /users` | Admin | Lists at most 100 non-sensitive user fields. |
| `GET /calibration/me` | Signed in | Gets the current user's calibration profile (404 if absent). |
| `POST /calibration` | Signed in | Upserts numeric settings: arm/hand ratios 0.5–2 and speed 5–60 fps. |
| `DELETE /calibration` | Signed in | Deletes the current user's calibration profile. |
| `GET /context-presets` | Signed in | Lists presets ordered by name. |
| `POST /context-presets` | Admin | Creates a preset with a 2–80 character name and 10–1000 character description. |
| `GET /sessions` | Signed in | Lists up to 100 sessions owned by the current user, including records and preset. |
| `POST /sessions` | Signed in | Creates a session from a UUID `presetId`. |
| `GET /sessions/{id}` | Signed in, owner only | Retrieves an owned session and its records/preset. |
| `PATCH /sessions/{id}/end` | Signed in, owner only | Sets the session end time; repeated calls return the ended session. |
| `DELETE /sessions/{id}` | Signed in, owner only | Deletes the owned session and its records. |
| `POST /sessions/{id}/records` | Signed in, owner only | Saves a record with gloss (1–1000 chars), sentence (1–2000 chars), and confidence (0–1); rejects ended sessions. |
| `GET /dashboard/summary` | Signed in | Returns the current user's KPIs, seven-day confidence trend, and preset usage. |
| `GET /dashboard/system-health` | Signed in | Reports PostgreSQL and model-service health. |
| `GET /dashboard/records` | Signed in | Returns up to 100 newest records belonging to the current user. |
| `GET /dashboard/records/export` | Signed in | Streams the current user's latest records as CSV. |
| `POST /recognition/predict` | Signed in | Accepts `{ "imageBase64": "..." }` for one image of at most 2 MB and proxies it to the inference service. |
| `POST /contact` | Public; contact limit | Saves validated name, email, subject, and message; does not send email. |
| `GET /content/{slug}` | Public | Retrieves a legal-document row by lowercase slug. |
| `PUT /content/{slug}` | Admin | Creates or updates a legal document with title, sections, and effective date. |

Auth attempts are limited to five per 15 minutes per process; contact submissions
to five per hour; the general API limit defaults to 100 requests per 15 minutes.
`POST /recognition/predict` requires base64 image data and returns status,
accepted prediction or `null`, candidate/confidence values, top candidates,
hand-detection state, model/detector versions, latency, and scope.

## 9. Authentication and authorization

Passwords are hashed with bcrypt; plaintext passwords are not stored. On
registration or login, the API signs a JWT using `JWT_SECRET`, with the account
ID and role as claims. The JWT is returned to the browser as an HttpOnly cookie
named `token`, with `SameSite=Lax`; the `Secure` flag is enabled in production.
The API also accepts a Bearer token for non-browser clients. Tokens use HS256 and
expire according to `JWT_EXPIRES_IN` (default seven days).

Authentication middleware verifies the token and assigns `req.user.id` and
`req.user.role`. Route middleware restricts user listing and preset creation
and legal-document updates to `ADMIN`. Public registration cannot set a role.
Sessions, dashboard data, calibration, recognition, context-preset listing,
and `/auth/me` require authentication. Session and record lookups are scoped to
the authenticated user. Admin accounts must be provisioned out of band; no
admin-creation endpoint exists.

## 10. Important logic and constraints

- The recognition path is **one image → one label**, not a video stream.
  Browser capture is explicit, JPEG-encoded, square center-cropped to 224 px,
  and sent through the API.
- The classifier is TorchVision MobileNetV3-Small trained from random
  initialization. The separately downloaded MediaPipe Hand Landmarker provides
  a hand-presence gate. Trained weights and that detector asset are not
  committed.
- Training selects a confidence threshold from its image-level validation data
  and does not publish model artifacts if the selective-precision rule fails.
  A classifier confidence score is not an open-set guarantee.
- Dataset test coverage is limited. `ml-service/README.md` records an HTTP
  evaluation of 18 accepted predictions out of 26 held-out images (69.2%
  coverage; all accepted outputs in that small set were correct). This is not
  signer-independent or real-world validation.
- Only accepted results enter session history. `NOTHING` is a no-sign outcome;
  uncertain candidate labels are never treated as accepted predictions.
- Context presets currently label a session and are shown in record/dashboard
  views; they do not alter classifier vocabulary or perform context-aware
  translation.
- Calibration values are saved profile fields and are not used by the current
  inference model.
- Dashboard latency and camera-FPS KPIs are intentionally `null` because those
  values are not aggregated in the database.

## 11. Error handling and validation

Backend request validation uses Zod. Auth validation trims and lowercases
emails, checks username/password bounds, requires a digit at registration, and
caps password UTF-8 length for bcrypt. Session IDs and preset IDs must be UUIDs;
record text and confidence have explicit length/range limits. Recognition input
is base64-validated and length-limited before proxying; Python validates image
format, byte size, and dimensions.

The shared Express error handler returns a consistent error envelope, maps
duplicate-key/not-found/foreign-key Prisma errors to HTTP status codes, reports
malformed JSON as 400, and suppresses internal messages for 5xx responses while
logging server-side details. The recognition proxy uses a 10-second timeout and
maps timeout, unavailable-service, invalid upstream response, and rejected
image failures to explicit gateway/client errors.

The frontend API client reports connection, JSON parsing, envelope, and
non-success status errors as `ApiRequestError`. Pages also validate important
response shapes before using them. Camera permission, not-ready video, frame
encoding, and service-unavailable states are shown to the user. Uncertain
recognition is presented without saving a record.

## 12. Dependencies

### Frontend

- `next`, `react`, `react-dom`: App Router server/build and client UI.
- `tailwindcss`, `@tailwindcss/postcss`: utility styling integration (the
  stylesheet also defines project-specific CSS).
- `eslint`, `eslint-config-next`: frontend lint rules.
- TypeScript and `@types/*`: static type checking and editor types.

### Backend

- `express`, `cors`, `helmet`, `compression`, `cookie-parser`, `morgan`:
  HTTP routing, cross-origin configuration, security headers, compression,
  cookie parsing, and request logging.
- `@prisma/client`, `@prisma/adapter-pg`, `pg`, `prisma`: ORM/client,
  PostgreSQL driver/adapter, schema generation, and migrations.
- `bcrypt`, `jsonwebtoken`: password hashing and JWT authentication.
- `zod`: request and upstream-response validation.
- `axios`: calls to the private inference service.
- `express-rate-limit`: request throttling.
- `socket.io`: the backend's connection-status event server.
- `swagger-jsdoc`, `swagger-ui-express`: OpenAPI generation and API docs.
- `winston`: structured application logging.
- `jest`, `supertest`, `nodemon`: API tests and development reloads.

### Python inference and training

`requirements.txt` includes FastAPI/Uvicorn for HTTP serving, MediaPipe for
hand detection, PyTorch/TorchVision for classification, Pillow and NumPy for
image processing, and scikit-learn for metrics and stratified splitting.

## 13. Deployment

There is no checked-in deployment manifest or CI workflow. A deployment must
provide a PostgreSQL database; run Prisma client generation and
`npx prisma migrate deploy`; configure strong production `JWT_SECRET`,
`DATABASE_URL`, `CLIENT_URL`, and `NEXT_PUBLIC_API_BASE_URL`; build and start
the Next.js app; and run the Python model service with its local weights and
MediaPipe model asset available.

The browser origin must match the API's CORS `CLIENT_URL`. Use HTTPS so
production authentication cookies can be marked Secure. Keep the inference
service on a private network and permit access only from the API. Configure
backups, logging retention, model/data license compliance, and monitoring in
the hosting environment; the repository does not implement those operational
controls.

## 14. Troubleshooting

| Symptom | Checks |
| --- | --- |
| API exits before listening | Confirm PostgreSQL is running, `DATABASE_URL` is valid, and the database is reachable. |
| Missing environment-variable error | Copy `backend/.env.example` to `backend/.env`; set `DATABASE_URL` and `JWT_SECRET`. |
| Prisma client/schema errors | Run `npm ci` and `npm run prisma:generate` from `backend/`; apply migrations and verify PostgreSQL version/connectivity. |
| Empty context selector | Run `npm run prisma:seed` from `backend/`. |
| Browser API request fails | Confirm the API is running, `NEXT_PUBLIC_API_BASE_URL` targets `/api/v1`, and backend `CLIENT_URL` matches the exact client origin. Restart Next.js after editing `.env.local`. |
| Camera is unavailable | Use localhost or HTTPS, grant browser permission, and check that another application is not holding the camera. |
| Recognition reports unavailable | Confirm training artifacts exist under `ml-service/artifacts/`, `models/hand_landmarker.task` exists, Uvicorn is reachable at `ML_SERVICE_URL`, and `/health` returns success. |
| Training cannot find data | Download the expected Kaggle archive to `ml-service/data/raw/asl-alphabet-v1.zip`; verify the archive contains the expected training and test folders. |
| Recognition says uncertain | The hand detector or validation-selected classifier threshold did not accept the result. Center a single handshape and retry; uncertainty is an expected safe outcome. |
| Python package installation fails | Use Python 3.11 in a virtual environment and install the requirements for the current platform; PyTorch/MediaPipe wheels and accelerator support are platform-dependent. |

## 15. Development notes

- Run backend tests with `cd backend && npm test`.
- Run frontend lint/build with `cd frontend && npm run lint` and
  `cd frontend && npm run build`.
- Run inference and pilot-manifest tests with
  `cd ml-service && .venv/bin/python -m unittest discover -s tests`.
- Backend tests mock Prisma; run an actual PostgreSQL migration and a manual
  local workflow when validating integration or schema changes.
- The generated MobileNet model, Kaggle archive, extracted images, MediaPipe
  asset, evaluation outputs, environment files, Python caches, and dependency
  folders are local-only and ignored. Do not force-add them.
- `PILOT_READINESS.md` documents a proposed consented signer-disjoint pilot and
  explicitly records that the project is not yet ready for that pilot.
- The frontend's context, calibration, and legal-document surfaces should not
  be described as model capabilities: preset selection only labels sessions,
  calibration is not consumed by inference, and legal pages are static.
- The inference implementation and sample-level results do not establish
  accuracy or accessibility for unseen signers, devices, lighting, backgrounds,
  or other sign languages.
