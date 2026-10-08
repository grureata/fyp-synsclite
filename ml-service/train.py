import argparse
import csv
import json
import random
import shutil
import time
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

import numpy as np
import torch
from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support
from torch import nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, models, transforms


ROOT = Path(__file__).resolve().parent
ARCHIVE = ROOT / "data" / "raw" / "asl-alphabet-v1.zip"
DATA_ROOT = ROOT / "data" / "processed" / "asl-alphabet-v1"
ARTIFACTS = ROOT / "artifacts"
STATIC_LETTERS = tuple(letter for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" if letter not in {"J", "Z"})
SUPPORTED_FOLDERS = (*STATIC_LETTERS, "nothing", "space")
DISPLAY_LABELS = (*STATIC_LETTERS, "NOTHING", "SPACE")
SEED = 20261007
MODEL_VERSION = "asl-static-fingerspelling-mobilenetv3-small-scratch-v1"
IMAGE_SIZE = 224
NORMALIZE = transforms.Normalize(
    mean=(0.485, 0.456, 0.406),
    std=(0.229, 0.224, 0.225),
)


def device_for_training() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def safe_extract_dataset(archive_path: Path = ARCHIVE) -> None:
    marker = DATA_ROOT / ".ready"
    if marker.is_file():
        return
    if not archive_path.is_file():
        raise FileNotFoundError(
            f"Dataset archive not found at {archive_path}. Download Kaggle dataset "
            "grassknoted/asl-alphabet version 1 as described in README.md."
        )

    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    train_root = DATA_ROOT / "train"
    test_root = DATA_ROOT / "test"
    train_counts: Counter[str] = Counter()
    test_counts: Counter[str] = Counter()

    with zipfile.ZipFile(archive_path) as dataset_zip:
        for info in dataset_zip.infolist():
            if info.is_dir() or not info.filename.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            parts = PurePosixPath(info.filename).parts
            if (
                len(parts) == 4
                and parts[:2] == ("asl_alphabet_train", "asl_alphabet_train")
                and parts[2] in SUPPORTED_FOLDERS
            ):
                split_root = train_root
                folder = parts[2]
                filename = parts[3]
                counts = train_counts
            elif (
                len(parts) == 3
                and parts[:2] == ("asl_alphabet_test", "asl_alphabet_test")
            ):
                split_root = test_root
                filename = parts[2]
                folder = Path(filename).stem.removesuffix("_test")
                if folder.lower() == "nothing":
                    folder = "nothing"
                elif folder.lower() == "space":
                    folder = "space"
                elif folder.upper() in STATIC_LETTERS:
                    folder = folder.upper()
                else:
                    continue
                counts = test_counts
            else:
                continue

            destination = split_root / folder / Path(filename).name
            destination.parent.mkdir(parents=True, exist_ok=True)
            with dataset_zip.open(info) as source, destination.open("wb") as target:
                shutil.copyfileobj(source, target)
            counts[folder] += 1

    missing_train = set(SUPPORTED_FOLDERS) - set(train_counts)
    missing_test = set(SUPPORTED_FOLDERS) - set(test_counts)
    if missing_train or missing_test:
        raise ValueError(
            "Dataset is missing required classes: "
            f"training={sorted(missing_train)}, held-out test={sorted(missing_test)}"
        )
    marker.write_text("Kaggle ASL Alphabet version 1\n", encoding="utf-8")
    print(f"Extracted {sum(train_counts.values())} training images and "
          f"{sum(test_counts.values())} held-out test images.")


def make_model(class_count: int) -> nn.Module:
    model = models.mobilenet_v3_small(weights=None)
    model.classifier[3] = nn.Linear(model.classifier[3].in_features, class_count)
    return model


def evaluate(model: nn.Module, loader: DataLoader, device: torch.device):
    model.eval()
    all_labels = []
    all_predictions = []
    all_confidences = []
    all_probabilities = []
    with torch.inference_mode():
        for images, labels in loader:
            logits = model(images.to(device))
            probabilities = torch.softmax(logits, dim=1).cpu().numpy()
            all_probabilities.append(probabilities)
            all_labels.extend(labels.numpy().tolist())
            all_predictions.extend(probabilities.argmax(axis=1).tolist())
            all_confidences.extend(probabilities.max(axis=1).tolist())
    return (
        np.asarray(all_labels, dtype=np.int64),
        np.asarray(all_predictions, dtype=np.int64),
        np.asarray(all_confidences, dtype=np.float32),
        np.concatenate(all_probabilities),
    )


def choose_confidence_threshold(labels: np.ndarray, predictions: np.ndarray,
                                confidences: np.ndarray) -> float:
    minimum_accepted = max(25, int(np.ceil(len(labels) * 0.1)))
    order = np.argsort(-confidences)
    sorted_confidences = confidences[order]
    sorted_correct = (labels[order] == predictions[order]).astype(np.int64)
    cumulative_correct = np.cumsum(sorted_correct)
    group_ends = np.flatnonzero(
        np.r_[sorted_confidences[:-1] != sorted_confidences[1:], True]
    )
    accepted_counts = group_ends + 1
    eligible = accepted_counts >= minimum_accepted
    precisions = cumulative_correct[group_ends] / accepted_counts
    eligible &= precisions >= 0.95
    if not eligible.any():
        raise RuntimeError(
            "Validation data did not support a threshold with at least 95% "
            "selective precision and 10% coverage. No model artifact was released."
        )
    best = int(np.flatnonzero(eligible)[-1])
    return float(sorted_confidences[group_ends[best]])


def summarize(labels: np.ndarray, predictions: np.ndarray, class_names: list[str]):
    precision, recall, f1, support = precision_recall_fscore_support(
        labels, predictions, labels=np.arange(len(class_names)), zero_division=0
    )
    return {
        "accuracy": float(accuracy_score(labels, predictions)),
        "macroPrecision": float(precision.mean()),
        "macroRecall": float(recall.mean()),
        "macroF1": float(f1.mean()),
        "perClass": {
            name: {
                "precision": float(precision[index]),
                "recall": float(recall[index]),
                "f1": float(f1[index]),
                "support": int(support[index]),
            }
            for index, name in enumerate(class_names)
        },
        "confusionMatrix": confusion_matrix(
            labels, predictions, labels=np.arange(len(class_names))
        ).tolist(),
    }


def synchronize(device: torch.device) -> None:
    if device.type == "mps":
        torch.mps.synchronize()
    elif device.type == "cuda":
        torch.cuda.synchronize(device)


def measure_inference_latency(model: nn.Module, loader: DataLoader, device: torch.device):
    images, _ = next(iter(loader))
    sample = images[:1].to(device)
    model.eval()
    with torch.inference_mode():
        for _ in range(5):
            model(sample)
        synchronize(device)
        timings = []
        for _ in range(50):
            started = time.perf_counter()
            model(sample)
            synchronize(device)
            timings.append((time.perf_counter() - started) * 1000)
    return {
        "warmupRuns": 5,
        "measuredRuns": len(timings),
        "meanMs": float(np.mean(timings)),
        "medianMs": float(np.median(timings)),
        "p95Ms": float(np.percentile(timings, 95)),
        "scope": "single 224x224 RGB frame; model forward pass only",
    }


def make_transforms():
    train = transforms.Compose([
        transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.82, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
        transforms.ToTensor(),
        NORMALIZE,
    ])
    evaluation = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        NORMALIZE,
    ])
    return train, evaluation


def stratified_split(targets: list[int], validation_fraction: float = 0.15):
    rng = np.random.default_rng(SEED)
    train_indices = []
    validation_indices = []
    for class_index in sorted(set(targets)):
        indices = np.flatnonzero(np.asarray(targets) == class_index)
        rng.shuffle(indices)
        split_at = max(1, int(round(len(indices) * validation_fraction)))
        validation_indices.extend(indices[:split_at].tolist())
        train_indices.extend(indices[split_at:].tolist())
    return train_indices, validation_indices


def main():
    parser = argparse.ArgumentParser(description="Train and evaluate static ASL fingerspelling.")
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--archive", type=Path, default=ARCHIVE)
    args = parser.parse_args()
    if args.epochs < 1 or args.batch_size < 1 or args.workers < 0:
        parser.error("epochs and batch-size must be positive; workers cannot be negative.")

    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)
    if not torch.backends.mps.is_available() and torch.cuda.is_available():
        torch.cuda.manual_seed_all(SEED)
    safe_extract_dataset(args.archive)

    train_transform, evaluation_transform = make_transforms()
    base_dataset = datasets.ImageFolder(DATA_ROOT / "train")
    expected_classes = list(SUPPORTED_FOLDERS)
    if base_dataset.classes != expected_classes:
        raise ValueError(
            f"Unexpected class order: {base_dataset.classes}; expected {expected_classes}"
        )
    train_indices, validation_indices = stratified_split(base_dataset.targets)
    training_data = datasets.ImageFolder(DATA_ROOT / "train", transform=train_transform)
    evaluation_data = datasets.ImageFolder(DATA_ROOT / "train", transform=evaluation_transform)
    test_data = datasets.ImageFolder(DATA_ROOT / "test", transform=evaluation_transform)
    if test_data.classes != expected_classes:
        raise ValueError(f"Unexpected held-out test classes: {test_data.classes}")

    training_loader = DataLoader(
        Subset(training_data, train_indices),
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.workers,
        pin_memory=False,
    )
    validation_loader = DataLoader(
        Subset(evaluation_data, validation_indices),
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.workers,
        pin_memory=False,
    )
    test_loader = DataLoader(
        test_data,
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.workers,
        pin_memory=False,
    )

    device = device_for_training()
    print(f"Training on {device}; classes: {len(expected_classes)}")
    model = make_model(len(expected_classes)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.0005, weight_decay=0.0001)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="max", factor=0.5, patience=1
    )
    best_validation_accuracy = -1.0
    best_state = None
    best_validation = None
    started_at = datetime.now(timezone.utc).isoformat()
    training_started = time.perf_counter()

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0
        for images, labels in training_loader:
            images = images.to(device)
            labels = labels.to(device)
            optimizer.zero_grad(set_to_none=True)
            loss = criterion(model(images), labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * labels.size(0)

        labels, predictions, confidences, _ = evaluate(model, validation_loader, device)
        validation = summarize(labels, predictions, expected_classes)
        scheduler.step(validation["accuracy"])
        mean_loss = running_loss / len(train_indices)
        print(
            f"epoch={epoch}/{args.epochs} loss={mean_loss:.4f} "
            f"val_accuracy={validation['accuracy']:.4f} "
            f"val_macro_f1={validation['macroF1']:.4f}"
        )
        if validation["accuracy"] > best_validation_accuracy:
            best_validation_accuracy = validation["accuracy"]
            best_state = {key: value.detach().cpu().clone()
                          for key, value in model.state_dict().items()}
            best_validation = (labels, predictions, confidences)

    if best_state is None or best_validation is None:
        raise RuntimeError("Training did not produce a validation checkpoint.")
    model.load_state_dict(best_state)
    validation_labels, validation_predictions, validation_confidences = best_validation
    confidence_threshold = choose_confidence_threshold(
        validation_labels, validation_predictions, validation_confidences
    )
    test_labels, test_predictions, test_confidences, _ = evaluate(
        model, test_loader, device
    )

    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    weights_path = ARTIFACTS / "model_state.pt"
    metadata_path = ARTIFACTS / "model_metadata.json"
    torch.save(best_state, weights_path)
    validation_summary = summarize(
        validation_labels, validation_predictions, list(DISPLAY_LABELS)
    )
    validation_accepted = validation_confidences >= confidence_threshold
    validation_summary["selectiveCoverage"] = float(validation_accepted.mean())
    validation_summary["selectivePrecision"] = float(
        (validation_labels[validation_accepted] == validation_predictions[validation_accepted]).mean()
    )
    test_summary = summarize(test_labels, test_predictions, list(DISPLAY_LABELS))

    test_rows = []
    test_samples = test_data.samples
    for index, (path, true_index) in enumerate(test_samples):
        prediction_index = int(test_predictions[index])
        test_rows.append({
            "file": Path(path).name,
            "expected": DISPLAY_LABELS[true_index],
            "actual": DISPLAY_LABELS[prediction_index],
            "confidence": float(test_confidences[index]),
            "correct": bool(true_index == prediction_index),
            "accepted": bool(test_confidences[index] >= confidence_threshold),
            "threshold": confidence_threshold,
            "conditions": "Kaggle-provided separate image; capture conditions not documented",
            "notes": "",
        })
    with (ARTIFACTS / "heldout_test_predictions.csv").open(
        "w", encoding="utf-8", newline=""
    ) as output:
        writer = csv.DictWriter(output, fieldnames=list(test_rows[0].keys()))
        writer.writeheader()
        writer.writerows(test_rows)

    accepted_test = test_confidences >= confidence_threshold
    latency = measure_inference_latency(model, test_loader, device)
    test_summary["selectiveCoverage"] = float(accepted_test.mean())
    test_summary["selectiveAccuracy"] = (
        float((test_labels[accepted_test] == test_predictions[accepted_test]).mean())
        if accepted_test.any()
        else None
    )
    report = {
        "modelVersion": MODEL_VERSION,
        "labels": list(DISPLAY_LABELS),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "trainingStartedAt": started_at,
        "trainingDurationSeconds": round(time.perf_counter() - training_started, 2),
        "dataset": {
            "source": "Kaggle grassknoted/asl-alphabet, version 1",
            "url": "https://www.kaggle.com/datasets/grassknoted/asl-alphabet",
            "license": "Kaggle metadata declares GPL-2",
            "format": "200x200 RGB JPEG still images in label-named folders",
            "excludedDynamicLetters": ["J", "Z"],
            "trainingImages": len(base_dataset.samples),
            "trainingSplit": len(train_indices),
            "validationSplit": len(validation_indices),
            "heldoutTestImages": len(test_data.samples),
            "trainingCountsByClass": dict(Counter(
                base_dataset.classes[target] for target in
                [base_dataset.targets[i] for i in train_indices]
            )),
            "validationCountsByClass": dict(Counter(
                base_dataset.classes[target] for target in
                [base_dataset.targets[i] for i in validation_indices]
            )),
            "testCountsByClass": dict(Counter(
                base_dataset.classes[target] for _, target in test_samples
            )),
            "labels": list(DISPLAY_LABELS),
            "splitMethod": (
                "Seeded stratified 85/15 split by image within the Kaggle training folders; "
                "the Kaggle-provided separate test-image directory is evaluated once after "
                "training and threshold selection."
            ),
            "signerMetadata": (
                "Not provided by the Kaggle dataset; the random validation split is not "
                "signer-independent."
            ),
        },
        "preprocessing": {
            "training": "224x224, random resized crop, horizontal flip, rotation, color jitter, ImageNet normalization",
            "inference": "RGB image resized to 224x224 and ImageNet-normalized",
        },
        "architecture": (
            "Torchvision MobileNetV3-Small trained from random initialization on the "
            "Kaggle ASL Alphabet images; no external pretrained model weights."
        ),
        "training": {
            "seed": SEED,
            "device": str(device),
            "epochsRequested": args.epochs,
            "batchSize": args.batch_size,
            "bestValidationAccuracy": best_validation_accuracy,
            "confidenceThreshold": confidence_threshold,
            "thresholdRule": (
                "Lowest confidence threshold achieving at least 95% precision on at least "
                "10% of validation samples; otherwise training fails without publishing a model."
            ),
        },
        "validation": validation_summary,
        "heldoutTest": test_summary,
        "perSampleTest": test_rows,
        "inferenceLatency": latency,
        "artifacts": {
            "weights": str(weights_path.relative_to(ROOT)),
            "metadata": str(metadata_path.relative_to(ROOT)),
            "testTable": str((ARTIFACTS / "heldout_test_predictions.csv").relative_to(ROOT)),
        },
    }
    metadata_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    (ARTIFACTS / "confusion-matrix.csv").write_text(
        "expected/predicted," + ",".join(DISPLAY_LABELS) + "\n" +
        "\n".join(
            f"{DISPLAY_LABELS[index]}," +
            ",".join(str(value) for value in row)
            for index, row in enumerate(test_summary["confusionMatrix"])
        ) + "\\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "validation": {
            key: validation_summary[key]
            for key in ("accuracy", "macroPrecision", "macroRecall", "macroF1")
        },
        "heldOutTest": {
            key: test_summary[key]
            for key in (
                "accuracy", "macroPrecision", "macroRecall", "macroF1",
                "selectiveCoverage", "selectiveAccuracy",
            )
        },
        "confidenceThreshold": confidence_threshold,
        "artifacts": report["artifacts"],
    }, indent=2))


if __name__ == "__main__":
    main()
