import json
from collections import defaultdict
from datetime import datetime, timezone

import mediapipe as mp
import numpy as np
from PIL import Image
from torchvision.datasets import ImageFolder

from app import HAND_DETECTION_CONFIDENCE, HAND_LANDMARKER_PATH
from train import ARTIFACTS, DATA_ROOT, SEED, SUPPORTED_FOLDERS, stratified_split


CANDIDATE_THRESHOLDS = (0.01, 0.05, 0.1, 0.2, 0.5)
POSITIVE_SAMPLES_PER_CLASS = 30


def validation_samples():
    dataset = ImageFolder(DATA_ROOT / "train")
    if dataset.classes != list(SUPPORTED_FOLDERS):
        raise ValueError(f"Unexpected classes: {dataset.classes}")
    _, validation_indices = stratified_split(dataset.targets)
    by_class = defaultdict(list)
    for index in validation_indices:
        class_name = dataset.classes[dataset.targets[index]]
        by_class[class_name].append(dataset.samples[index][0])

    rng = np.random.default_rng(SEED)
    samples = []
    for class_name in SUPPORTED_FOLDERS:
        paths = by_class[class_name]
        if class_name == "nothing":
            selected = paths
        else:
            selected = [
                paths[index]
                for index in rng.choice(
                    len(paths),
                    size=min(POSITIVE_SAMPLES_PER_CLASS, len(paths)),
                    replace=False,
                )
            ]
        samples.extend(
            (class_name, np.asarray(Image.open(path).convert("RGB")))
            for path in selected
        )
    return samples


def evaluate_threshold(samples, threshold: float):
    options = mp.tasks.vision.HandLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(
            model_asset_path=str(HAND_LANDMARKER_PATH)
        ),
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        num_hands=1,
        min_hand_detection_confidence=threshold,
        min_hand_presence_confidence=threshold,
    )
    counts = defaultdict(lambda: {"samples": 0, "detectedHands": 0})
    with mp.tasks.vision.HandLandmarker.create_from_options(options) as detector:
        for class_name, pixels in samples:
            result = detector.detect(
                mp.Image(image_format=mp.ImageFormat.SRGB, data=pixels)
            )
            counts[class_name]["samples"] += 1
            counts[class_name]["detectedHands"] += bool(result.hand_landmarks)

    positive = [
        counts[name]
        for name in SUPPORTED_FOLDERS
        if name != "nothing"
    ]
    positive_samples = sum(row["samples"] for row in positive)
    detected_positive = sum(row["detectedHands"] for row in positive)
    no_hand = counts["nothing"]
    hand_recall = detected_positive / positive_samples
    specificity = 1 - no_hand["detectedHands"] / no_hand["samples"]
    return {
        "threshold": threshold,
        "positiveSamples": positive_samples,
        "detectedPositive": detected_positive,
        "handRecall": hand_recall,
        "noHandSamples": no_hand["samples"],
        "falsePositiveNoHand": no_hand["detectedHands"],
        "noHandSpecificity": specificity,
        "balancedAccuracy": (hand_recall + specificity) / 2,
        "perClass": {
            name: {
                "samples": counts[name]["samples"],
                "detectedHands": counts[name]["detectedHands"],
            }
            for name in SUPPORTED_FOLDERS
        },
    }


def main():
    if not HAND_LANDMARKER_PATH.is_file():
        raise FileNotFoundError(
            f"Download the official MediaPipe hand task model to {HAND_LANDMARKER_PATH}."
        )
    samples = validation_samples()
    results = [
        evaluate_threshold(samples, threshold)
        for threshold in CANDIDATE_THRESHOLDS
    ]
    selected = max(
        results,
        key=lambda row: (row["balancedAccuracy"], row["noHandSpecificity"]),
    )
    if selected["threshold"] != HAND_DETECTION_CONFIDENCE:
        raise RuntimeError(
            f"Configured hand threshold {HAND_DETECTION_CONFIDENCE} does not match "
            f"validation-selected threshold {selected['threshold']}."
        )

    report = {
        "evaluatedAt": datetime.now(timezone.utc).isoformat(),
        "detectorVersion": "mediapipe-hand-landmarker-full-v1",
        "modelPath": str(HAND_LANDMARKER_PATH),
        "selectionRule": "Maximize balanced accuracy over detected-hand recall and no-hand specificity.",
        "positiveSamplesPerClass": POSITIVE_SAMPLES_PER_CLASS,
        "noHandSamples": sum(label == "nothing" for label, _ in samples),
        "selectedThreshold": selected["threshold"],
        "selectedMetrics": selected,
        "candidates": results,
        "limitations": (
            "Image-level validation from the Kaggle source; not signer-independent "
            "and not representative of arbitrary camera backgrounds."
        ),
    }
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    report_path = ARTIFACTS / "hand_detector_validation.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
