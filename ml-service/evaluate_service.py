import argparse
import base64
import csv
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import numpy as np

from train import ARTIFACTS, DATA_ROOT, DISPLAY_LABELS


def post_json(url: str, payload: dict, timeout: float):
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read()), response.status


def main():
    parser = argparse.ArgumentParser(
        description="Exercise the running HTTP inference service on the held-out Kaggle images."
    )
    parser.add_argument("--url", default="http://127.0.0.1:8000")
    parser.add_argument("--timeout", type=float, default=10.0)
    args = parser.parse_args()
    if args.timeout <= 0:
        parser.error("timeout must be positive.")

    metadata_path = ARTIFACTS / "model_metadata.json"
    if not metadata_path.is_file():
        raise FileNotFoundError("Train the model before evaluating the HTTP service.")
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    test_root = DATA_ROOT / "test"
    if not test_root.is_dir():
        raise FileNotFoundError("Run train.py first to prepare the dataset test images.")

    rows = []
    elapsed_ms = []
    for label in DISPLAY_LABELS:
        folder = label.lower() if label in {"NOTHING", "SPACE"} else label
        images = sorted((test_root / folder).glob("*"))
        if len(images) != 1:
            raise ValueError(
                f"Expected exactly one held-out test image for {label}, found {len(images)}."
            )
        image_path = images[0]
        encoded = base64.b64encode(image_path.read_bytes()).decode("ascii")
        started = time.perf_counter()
        try:
            response, status_code = post_json(
                f"{args.url.rstrip('/')}/v1/predict",
                {"imageBase64": encoded},
                args.timeout,
            )
        except HTTPError as error:
            detail = error.read(1024).decode("utf-8", errors="replace")
            raise RuntimeError(
                f"Inference service returned HTTP {error.code}: {detail}"
            ) from error
        except URLError as error:
            raise RuntimeError(f"Could not reach the inference service: {error.reason}") from error
        elapsed_ms.append((time.perf_counter() - started) * 1000)
        if status_code != 200:
            raise RuntimeError(f"Inference service returned unexpected HTTP {status_code}.")
        if (
            not isinstance(response, dict)
            or response.get("modelVersion") != metadata["modelVersion"]
            or response.get("status") not in {"recognized", "uncertain", "no_sign"}
            or not isinstance(response.get("confidence"), (int, float))
            or not isinstance(response.get("minimumConfidence"), (int, float))
            or not isinstance(response.get("handDetected"), bool)
            or not isinstance(response.get("handDetectorVersion"), str)
        ):
            raise ValueError("Inference service returned an invalid prediction shape.")

        output_label = response.get("prediction")
        if output_label not in DISPLAY_LABELS:
            output_label = None
        rows.append({
            "expected": label,
            "actual": output_label or "",
            "candidate": response.get("candidate", ""),
            "status": response["status"],
            "confidence": float(response["confidence"]),
            "threshold": float(response["minimumConfidence"]),
            "handDetected": response["handDetected"],
            "handDetectorVersion": response["handDetectorVersion"],
            "correct": bool(output_label == label),
            "accepted": bool(response["status"] in {"recognized", "no_sign"}),
            "inferenceLatencyMs": float(response.get("latencyMs", 0)),
            "httpRoundTripMs": round(elapsed_ms[-1], 2),
            "conditions": "Kaggle-provided separate still image; capture conditions not documented",
        })

    accepted = [row for row in rows if row["accepted"]]
    inference_latencies = [row["inferenceLatencyMs"] for row in rows]
    report = {
        "evaluatedAt": datetime.now(timezone.utc).isoformat(),
        "modelVersion": metadata["modelVersion"],
        "handDetectorVersion": rows[0]["handDetectorVersion"],
        "endpoint": f"{args.url.rstrip('/')}/v1/predict",
        "testSamples": len(rows),
        "accuracy": sum(row["correct"] for row in rows) / len(rows),
        "selectiveCoverage": len(accepted) / len(rows),
        "selectiveAccuracy": (
            sum(row["correct"] for row in accepted) / len(accepted) if accepted else None
        ),
        "inferenceLatencyMeanMs": float(np.mean(inference_latencies)),
        "inferenceLatencyMedianMs": float(np.median(inference_latencies)),
        "inferenceLatencyP95Ms": float(np.percentile(inference_latencies, 95)),
        "httpRoundTripMeanMs": float(np.mean(elapsed_ms)),
        "httpRoundTripMedianMs": float(np.median(elapsed_ms)),
        "httpRoundTripP95Ms": float(np.percentile(elapsed_ms, 95)),
        "limitations": (
            "One provided still image per class; no signer IDs or condition metadata. "
            "This is not real-user or signer-independent evaluation."
        ),
    }
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with (ARTIFACTS / "service_test_predictions.csv").open(
        "w", encoding="utf-8", newline=""
    ) as output:
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    (ARTIFACTS / "service_test_summary.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
