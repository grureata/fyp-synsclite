import base64
import binascii
import io
import json
import logging
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path

import mediapipe as mp
import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, ConfigDict, Field
from torchvision import transforms

from train import (
    ARTIFACTS,
    DISPLAY_LABELS,
    IMAGE_SIZE,
    MODEL_VERSION,
    NORMALIZE,
    make_model,
)


logger = logging.getLogger("signsync.inference")
MAX_IMAGE_BYTES = 2 * 1024 * 1024
MAX_IMAGE_BASE64_LENGTH = ((MAX_IMAGE_BYTES + 2) // 3) * 4
HAND_LANDMARKER_PATH = Path(__file__).resolve().parent / "models" / "hand_landmarker.task"
HAND_DETECTOR_VERSION = "mediapipe-hand-landmarker-full-v1"
HAND_DETECTION_CONFIDENCE = 0.2
HAND_DETECTION_LOCK = threading.Lock()
DEVICE = (
    torch.device("mps") if torch.backends.mps.is_available()
    else torch.device("cuda") if torch.cuda.is_available()
    else torch.device("cpu")
)
PREPROCESS = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    NORMALIZE,
])


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    imageBase64: str = Field(min_length=1, max_length=MAX_IMAGE_BASE64_LENGTH)


def load_model():
    weights_path = ARTIFACTS / "model_state.pt"
    metadata_path = ARTIFACTS / "model_metadata.json"
    if not weights_path.is_file() or not metadata_path.is_file():
        raise FileNotFoundError(
            "Trained artifacts are missing. Run ml-service/train.py before serving predictions."
        )
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    if metadata.get("modelVersion") != MODEL_VERSION:
        raise ValueError("Trained model version does not match this inference service.")
    labels = metadata.get("labels")
    if labels != list(DISPLAY_LABELS):
        raise ValueError("Model metadata labels do not match the supported vocabulary.")
    model = make_model(len(labels))
    model.load_state_dict(torch.load(weights_path, map_location="cpu", weights_only=True))
    model.to(DEVICE)
    model.eval()
    if not HAND_LANDMARKER_PATH.is_file():
        raise FileNotFoundError(
            f"Hand detector model is missing at {HAND_LANDMARKER_PATH}. "
            "Download the official MediaPipe Hand Landmarker task model as described in README.md."
        )
    hand_detector = mp.tasks.vision.HandLandmarker.create_from_options(
        mp.tasks.vision.HandLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(
                model_asset_path=str(HAND_LANDMARKER_PATH)
            ),
            running_mode=mp.tasks.vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=HAND_DETECTION_CONFIDENCE,
            min_hand_presence_confidence=HAND_DETECTION_CONFIDENCE,
        )
    )
    return model, metadata, hand_detector


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.model, app.state.metadata, app.state.hand_detector = load_model()
        app.state.model_error = None
        logger.info(
            "Loaded %s and %s on %s",
            app.state.metadata["modelVersion"],
            HAND_DETECTOR_VERSION,
            DEVICE,
        )
    except (FileNotFoundError, ValueError, RuntimeError) as error:
        app.state.model = None
        app.state.metadata = None
        app.state.hand_detector = None
        app.state.model_error = str(error)
        logger.error("Recognition model unavailable: %s", error)
    try:
        yield
    finally:
        if app.state.hand_detector is not None:
            app.state.hand_detector.close()


app = FastAPI(
    title="SignSync Static ASL Fingerspelling Recognition",
    version="1.1.0",
    lifespan=lifespan,
)


@app.get("/health")
def health():
    if app.state.model is None:
        raise HTTPException(status_code=503, detail="Trained recognition model is unavailable.")
    return {
        "status": "ok",
        "serviceVersion": app.version,
        "modelVersion": app.state.metadata["modelVersion"],
        "handDetectorVersion": HAND_DETECTOR_VERSION,
        "device": str(DEVICE),
        "supportedLabels": app.state.metadata["labels"],
    }


def decode_image(image_base64: str) -> Image.Image:
    try:
        encoded = image_base64.partition(",")[2] if image_base64.startswith("data:") else image_base64
        image_bytes = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as error:
        raise HTTPException(status_code=400, detail="Image must be valid base64 data.") from error
    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be no larger than 2 MB.")
    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            if image.format not in {"JPEG", "PNG", "WEBP"}:
                raise HTTPException(status_code=415, detail="Image must be JPEG, PNG, or WebP.")
            if image.width < 64 or image.height < 64 or image.width > 4096 or image.height > 4096:
                raise HTTPException(status_code=400, detail="Image dimensions must be between 64 and 4096 pixels.")
            image.load()
            return image.convert("RGB")
    except (UnidentifiedImageError, OSError) as error:
        raise HTTPException(status_code=400, detail="Image data could not be decoded.") from error


def classify_response(candidate: str, confidence: float, threshold: float,
                      hand_detected: bool) -> tuple[str, str | None]:
    if confidence < threshold:
        return "uncertain", None
    if candidate == "NOTHING":
        return "no_sign", candidate
    if not hand_detected:
        return "uncertain", None
    return "recognized", candidate


@app.post("/v1/predict")
def predict(request: PredictionRequest):
    model = app.state.model
    metadata = app.state.metadata
    hand_detector = app.state.hand_detector
    if model is None or metadata is None or hand_detector is None:
        raise HTTPException(status_code=503, detail="Trained recognition model is unavailable.")

    image = decode_image(request.imageBase64)
    started = time.perf_counter()
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=np.asarray(image),
    )
    with HAND_DETECTION_LOCK:
        hand_result = hand_detector.detect(mp_image)
    hand_detected = bool(hand_result.hand_landmarks)
    tensor = PREPROCESS(image).unsqueeze(0).to(DEVICE)
    with torch.inference_mode():
        probabilities = torch.softmax(model(tensor), dim=1)[0].cpu()
    latency_ms = (time.perf_counter() - started) * 1000
    confidence, index = probabilities.max(dim=0)
    confidence_value = float(confidence.item())
    threshold = float(metadata["training"]["confidenceThreshold"])
    candidate = metadata["labels"][int(index.item())]
    top_indices = torch.topk(probabilities, k=min(3, probabilities.numel())).indices.tolist()
    top_candidates = [
        {
            "label": metadata["labels"][item],
            "confidence": float(probabilities[item].item()),
        }
        for item in top_indices
    ]

    status, prediction = classify_response(
        candidate, confidence_value, threshold, hand_detected
    )

    return {
        "status": status,
        "prediction": prediction,
        "candidate": candidate,
        "confidence": confidence_value,
        "minimumConfidence": threshold,
        "topCandidates": top_candidates,
        "handDetected": hand_detected,
        "modelVersion": metadata["modelVersion"],
        "handDetectorVersion": HAND_DETECTOR_VERSION,
        "latencyMs": round(latency_ms, 2),
        "scope": "single static ASL fingerspelled handshape; not continuous signing or translation",
    }
