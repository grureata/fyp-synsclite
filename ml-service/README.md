# Static ASL fingerspelling recognition service

## Defined initial task

- **Sign language:** American Sign Language (ASL).
- **Task:** classify one held, static camera frame as a single fingerspelled label.
- **Supported output labels:** A–I, K–Y (24 static letters), plus `SPACE` and `NOTHING` dataset classes.
- **Excluded:** J and Z, which require movement; continuous fingerspelling; words, phrases, ASL grammar, facial/non-manual markers, and translation into English sentences.
- **Output language:** the English letter label only. A letter gloss is not a sentence translation.

The capture control deliberately requests a single frame; it does not classify consecutive frames as a phrase.

## Dataset

- **Source:** [Kaggle ASL Alphabet, `grassknoted/asl-alphabet`, version 1](https://www.kaggle.com/datasets/grassknoted/asl-alphabet).
- **Creator and license reported by Kaggle:** Akash Nagaraj; license metadata says **GPL-2**. The dataset's associated [creator project](https://github.com/grassknoted/Unvoiced) says the dataset was created by the repository owner. Retain attribution and review GPL-2 obligations before distributing trained artifacts; this project does not commit the dataset or weights.
- **Published size and format:** 87,000 200×200 image files in the training directory, organized into 29 letter/utility folders, and 28 separate test images. JPEG, RGB image classification; each training folder name is the class label. J, Z, and `del` are deliberately excluded from the supported labels.
- **Selected vocabulary:** 26 output classes (24 static letters, `SPACE`, and `NOTHING`). `NOTHING` represents the dataset's no-sign/background category; `SPACE` is a dataset UI/control class, not an ASL word.
- **Exact filtered sample counts:** 78,000 selected training images and 26 held-out test images; the training images are split into 66,300 training and 11,700 validation samples.
- **Train/validation/test:** deterministic, seeded, stratified 85/15 split by image within the selected Kaggle training folders; the Kaggle-provided test directory is held out and evaluated once. It contains one external test image per selected output class. The test image set is separate from the training images, but 26 examples are too few for a stable estimate of real-world error.
- **Signer split limitation:** the dataset supplies no signer identifiers or reliable per-image signer metadata, so neither the random validation split nor the provided one-image-per-class test set can establish signer-independent generalization.
- **Preprocessing:** training images receive random resized crop, horizontal flip, small rotation, and color/brightness augmentation, then resize to 224×224 and ImageNet normalization. Inference center-crops the camera stream to a square in the browser and applies the same 224×224 resize and normalization.

The Kaggle API reports 87,000 training images and a separate 28-image test directory. In the downloaded version, filtering to the supported labels produced 78,000 training images and 26 test images (one per supported class); 66,300 were used for training and 11,700 for image-level validation. The code verifies actual counts/classes and fails rather than silently using a missing test class.

## Model and uncertainty

The sign classifier is TorchVision **MobileNetV3-Small**, trained from random initialization on the Kaggle images; it uses no external pretrained classifier weights. The service also runs Google's MediaPipe **Hand Landmarker full** model (`hand_landmarker.task`, SHA-256 `fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1`). The detector is an external pretrained component, not trained on this project's dataset. A threshold of **0.20** was selected on the image-level validation data to maximize balanced hand/no-hand accuracy across tested candidates. Both models are loaded once at service startup. The Apple Silicon MPS device is used when available for the classifier; CUDA and CPU are fallbacks.

Training run on Python 3.11 / Apple MPS (seed 20261007, five epochs, batch size 64) selected the epoch-4 checkpoint:

- Validation: **99.30% accuracy**, **99.32% macro precision**, **99.30% macro recall**, **99.30% macro F1** across 11,700 image-level validation examples.
- Validation-selected threshold: **0.4112**, yielding **99.30% selective precision at 100% validation coverage**. Threshold selection maximizes coverage subject to at least 95% precision and at least 10% coverage.
- Classifier-only Kaggle held-out set: **26/26 correct (100%)**, with 100% classifier-threshold coverage. This does not include the hand-detector gate. The full API pipeline is separately measured by `evaluate_service.py`; there is only one supplied image per class, so neither result is a reliable population estimate.
- Classifier-only forward latency after warm-up: **3.66 ms mean, 3.57 ms median, 4.06 ms p95** on this machine. Live-service latency, including hand detection, preprocessing, and classification, is measured separately by `evaluate_service.py`.

Run `python evaluate_hand_detector.py` to reproduce detector-threshold selection. On the current image-level validation sample (30 hand examples per supported handshape plus all 450 `NOTHING` validation images), the selected 0.20 threshold detected **625/750 hand images (83.3% recall)** and correctly rejected **443/450 no-hand images (98.4% specificity)**. This detector misses some valid signs, so those frames are not automatically accepted even if the classifier is confident.

The final live HTTP service was evaluated on all 26 Kaggle-provided test images: **18/26 exact outputs (69.2% coverage)**; all 18 accepted outputs were correct (**100% selective accuracy**). Eight supported handshape test images (A, C, D, E, N, U, V, X) were withheld as uncertain because the hand detector did not confirm them, despite high classifier scores. Across all 450 validation `NOTHING` images sent through HTTP, the service returned `no_sign` for all 450. A JPEG-encoded random-noise probe produced candidate X at 97.8% classifier confidence, but was marked `uncertain`, with no accepted prediction, because no hand was detected. This is direct evidence that the classifier confidence alone is not an open-set confidence measure.

On the local Apple M4 run, full detector + classifier inference latency was **17.05 ms mean, 17.32 ms median, and 18.49 ms p95** over the 26 held-out requests; localhost HTTP round trip was **18.29 ms mean, 18.36 ms median, and 19.51 ms p95**. These are machine-specific image-request timings, not browser camera-to-screen measurements.

The generated metadata contains classifier per-class scores and confusion matrix; the training CSV contains every held-out image's expected/actual labels, confidence, correctness, acceptance, and testing-condition notes. The detector report is written to `artifacts/hand_detector_validation.json`; full live-service results are in `artifacts/service_test_predictions.csv` and `artifacts/service_test_summary.json`.

The classifier confidence threshold is not a guessed UI constant. If validation cannot meet the threshold rule, training exits without publishing model artifacts. The detector threshold is independently selected by its validation report. These image-level rules are **not calibrated guarantees** for new signers or unknown handshapes.

## Setup and execution

Place the Kaggle archive at `data/raw/asl-alphabet-v1.zip`. The repository ignores the archive, extracted images, and model artifacts.

```sh
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python train.py
mkdir -p models
curl -fL 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' \
  -o models/hand_landmarker.task
.venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

The hand-detector task file is downloaded from Google's official MediaPipe model host and is not committed. The MediaPipe project code is Apache-2.0 licensed; check the current model-asset terms before redistributing it. Run `python evaluate_hand_detector.py` to calibrate that detector on the same image-level validation partition. For a short classifier pipeline smoke test, `train.py --epochs 1 --workers 0` runs the full filtered dataset and held-out evaluation with one epoch; it is not a final quality run. After starting the service, `python evaluate_service.py` sends every separate held-out image through the HTTP endpoint and writes a per-image table and full-pipeline latency summary. Review `artifacts/model_metadata.json`, `artifacts/heldout_test_predictions.csv`, `artifacts/hand_detector_validation.json`, `artifacts/service_test_predictions.csv`, and `artifacts/confusion-matrix.csv`.

The service exposes:

- `GET /health` — service, classifier, and detector versions, device, and supported labels; returns 503 until both models load.
- `POST /v1/predict` — JSON `{ "imageBase64": "<base64 JPEG/PNG/WebP>" }`, capped at 2 MB decoded input. Returns status (`recognized`, `uncertain`, or `no_sign`), `handDetected`, candidate/prediction, classifier confidence, threshold, full inference latency, and model versions. A high-confidence alphabet candidate is accepted only when the hand detector also detects a hand; otherwise it is `uncertain` and no prediction is accepted. `NOTHING` yields `no_sign`. Malformed or oversized images are rejected with 4xx responses.

Keep this service private; the Express API is the authenticated application boundary. Camera frames are handled in memory and are not written to disk by this service.

## Evaluation and known limitations

The generated held-out CSV is a reproducible dataset-level per-class test, not a real-user study. The Kaggle description provides only a single separate image per class and no signer/environment metadata. Visual inspection also shows test and training examples with highly similar framing/backgrounds. This cannot systematically test signer diversity, distance, lighting, backgrounds, speed, or camera angles. A real-user test matrix with several consenting signers and those conditions is still required before any claim of real-world readiness.

Static-frame classification cannot distinguish movement-dependent J/Z, transitions between letters, or continuous signing. A random-noise image was classified as X at 97.8% confidence by the classifier alone; the hand-detection gate prevented it from being emitted as a recognized X in the observed probe. The detector has validation false negatives, so valid handshapes can return uncertain, as seen on eight held-out classes. It does not solve open-set recognition: an unknown handshape (including excluded signs) can still be detected as a hand and receive a confident, incorrect supported label. Thresholds and measured results are image-level, source-specific, and do not establish real-user performance.
