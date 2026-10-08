# SignSync Lite

SignSync Lite contains a Next.js client, an Express API backed by PostgreSQL/Prisma, and a separate Python inference service.

For setup, architecture, database and API details, workflows, and troubleshooting,
see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).

## Current prototype recognition

The initial recognition feature is **single-frame static ASL fingerspelling classification**. It returns one English letter label for supported static handshapes (A–I and K–Y), plus the Kaggle dataset's `SPACE` and `NOTHING` classes. It intentionally excludes J and Z because those letters require movement. It does not recognize words, phrases, continuous signing, ASL grammar, facial expression, or spoken-language translations and is not an interpreter.

The user must hold one handshape in the on-screen guide and explicitly capture a frame. The browser sends that one JPEG frame through the authenticated backend to the inference service. The service runs both a MediaPipe hand-landmark detector and the trained sign classifier; an alphabet prediction is accepted only when classifier confidence meets its validation threshold and the hand detector confirms a hand. Otherwise it returns an uncertain or no-sign status, and the result is not saved as an accepted record. Camera frames are processed for the request and are not persisted by the application.

This limited classifier is a prototype. Dataset-level test images do not establish performance across real signers, lighting, camera placements, or backgrounds. Do not use it for consequential communication.

## Controlled pilot readiness

The proposed pilot narrows the task to isolated static ASL fingerspelled letters A–I and K–Y; the legacy `SPACE` class is excluded, and `NOTHING` is only a negative/no-hand outcome. It is private, supervised, consent-based, and non-consequential. It is **not yet ready for pilot use**: the current 26-image held-out pipeline result has only 69.2% coverage with hand detection and is not signer-independent. See [pilot scope, data protocol, acceptance gates, and blockers](./PILOT_READINESS.md), and the [consented signer-disjoint manifest format and validator](./ml-service/pilot_data/README.md).

## Run locally

Requirements: Node.js 22.18+, Python 3.11, and PostgreSQL.

1. Create a PostgreSQL database and configure `backend/.env` from `backend/.env.example`. Use a strong `JWT_SECRET`, set `CLIENT_URL`, and keep `.env` private.
2. Download version 1 of the Kaggle dataset `grassknoted/asl-alphabet` to `ml-service/data/raw/asl-alphabet-v1.zip`. The public dataset is about 1.1 GB. The training script uses its separate test images and does not commit the dataset or trained weights.
3. In `ml-service/`, create a Python 3.11 virtual environment, install `requirements.txt`, and train:

   ```sh
   python -m venv .venv
   .venv/bin/python -m pip install -r requirements.txt
   .venv/bin/python train.py
   ```

   Training creates ignored local files under `ml-service/data/` and `ml-service/artifacts/`. The MobileNetV3-Small sign classifier is trained from random initialization using the Kaggle images; it does not download external classifier weights. Review the generated `model_metadata.json` and `heldout_test_predictions.csv`; no model is emitted if validation does not meet the configured selective-precision rule.
4. Download the official MediaPipe Hand Landmarker model to `ml-service/models/hand_landmarker.task` as described in [ml-service/README.md](./ml-service/README.md).
5. Start the local-only inference service in `ml-service/`:

   ```sh
   .venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8000
   ```

6. From `backend/`, run `npm ci`, `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:seed`, then `npm run dev`. `ML_SERVICE_URL` defaults to `http://localhost:8000`.
7. From `frontend/`, run `npm ci` and `npm run dev`. Set `NEXT_PUBLIC_API_BASE_URL` using `frontend/.env.example`; open `http://localhost:3000`, register/sign in, enable the camera, start a session, and capture one held handshape at a time.

Do not expose the inference service directly to the public internet. Route inference through the authenticated backend.

## Dataset and model notes

The dataset source, declared license, supported labels, split policy, preprocessing, model architecture, metrics, confusion matrix, per-image test table, and measured model latency are documented in [ml-service/README.md](./ml-service/README.md) and generated into the ignored local report after training. Kaggle's metadata declares GPL-2 for its images; review that license before distributing data or derived artifacts. The held-out result is only one supplied image per class and is not real-signer validation.

## Checks

- Backend: `cd backend && npm test`
- Frontend lint: `cd frontend && npm run lint`
- Frontend production build: `cd frontend && npm run build`
- Inference-service tests: `cd ml-service && .venv/bin/python -m unittest discover -s tests`
- Pilot-manifest validator tests are included in the same inference-service test command.
