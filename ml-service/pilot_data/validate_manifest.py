import argparse
import csv
import json
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path, PurePosixPath

from PIL import Image, UnidentifiedImageError


SUPPORTED_LABELS = (
    *tuple(letter for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" if letter not in {"J", "Z"}),
    "NOTHING",
)
PILOT_LETTERS = SUPPORTED_LABELS[:-1]
SPLITS = ("train", "validation", "test")
REQUIRED_COLUMNS = (
    "sample_id",
    "relative_path",
    "label",
    "signer_id",
    "split",
    "consent_granted",
    "consent_version",
    "consented_at",
    "recorded_at",
    "device",
    "negative_type",
    "lighting",
    "distance_cm",
    "camera_angle",
    "background",
    "signing_speed",
)
MIN_SIGNERS_PER_SPLIT = {"train": 3, "validation": 3, "test": 12}
MIN_TEST_REPETITIONS_PER_SIGNER_LABEL = 5
MIN_TEST_NEGATIVE_SAMPLES = 500
NEGATIVE_TYPES = {
    "not_applicable",
    "no_hand",
    "object",
    "face",
    "partial_hand",
    "multiple_hands",
    "unsupported_sign",
    "poor_quality",
}
CONTROLLED_CATEGORIES = {
    "lighting": {"bright", "indoor", "dim", "mixed", "other"},
    "camera_angle": {"front", "left", "right", "above", "below", "other"},
    "background": {"plain", "cluttered", "natural", "other"},
    "signing_speed": {"slow", "normal", "fast", "not_applicable"},
    "negative_type": NEGATIVE_TYPES,
}


class ManifestValidationError(ValueError):
    pass


def parse_timestamp(value: str, field: str, row_number: int) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ManifestValidationError(
            f"Row {row_number}: {field} must be an ISO-8601 timestamp."
        ) from error
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ManifestValidationError(
            f"Row {row_number}: {field} must include a timezone."
        )
    return parsed


def resolve_image(
    image_root: Path,
    relative_path: str,
    row_number: int,
    sample_id: str,
) -> Path:
    path = PurePosixPath(relative_path)
    if path.is_absolute() or "\\" in relative_path or ".." in path.parts:
        raise ManifestValidationError(
            f"Row {row_number}: relative_path must be a safe relative POSIX path."
        )
    if (
        len(path.parts) != 2
        or path.parts[0] != "images"
        or path.stem != sample_id
        or path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}
    ):
        raise ManifestValidationError(
            f"Row {row_number}: image path must be images/<sample-id> with a supported image extension."
        )
    image_path = (image_root / Path(*path.parts)).resolve()
    try:
        image_path.relative_to(image_root.resolve())
    except ValueError as error:
        raise ManifestValidationError(
            f"Row {row_number}: image path resolves outside image-root."
        ) from error
    return image_path


def validate_manifest(manifest_path: Path, image_root: Path) -> dict:
    with manifest_path.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        if reader.fieldnames is None:
            raise ManifestValidationError("Manifest has no header.")
        if len(reader.fieldnames) != len(set(reader.fieldnames)):
            raise ManifestValidationError("Manifest has duplicate column names.")
        if tuple(reader.fieldnames) != REQUIRED_COLUMNS:
            missing = sorted(set(REQUIRED_COLUMNS) - set(reader.fieldnames))
            extra = sorted(set(reader.fieldnames) - set(REQUIRED_COLUMNS))
            raise ManifestValidationError(
                "Manifest columns must exactly match the documented schema; "
                f"missing={missing}, extra={extra}."
            )
        rows = list(reader)

    if not rows:
        raise ManifestValidationError("Manifest has no samples.")

    samples_by_split = Counter()
    signers_by_split = defaultdict(set)
    signer_split = {}
    labels_by_split = defaultdict(Counter)
    signer_label_counts = Counter()
    test_negative_counts = Counter()
    conditions_by_split = defaultdict(lambda: defaultdict(set))
    sample_ids = set()
    path_to_sample = set()

    for row_number, row in enumerate(rows, start=2):
        if None in row or any(not value or not value.strip() for value in row.values()):
            raise ManifestValidationError(
                f"Row {row_number}: row width must match the header and all fields are required."
            )
        sample_id = row["sample_id"].strip()
        if not sample_id.startswith("sample-") or len(sample_id) <= len("sample-") or any(
            character not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
            for character in sample_id
        ):
            raise ManifestValidationError(
                f"Row {row_number}: sample_id must be a non-identifying sample-* code."
            )
        if sample_id in sample_ids:
            raise ManifestValidationError(
                f"Row {row_number}: duplicate sample_id."
            )
        sample_ids.add(sample_id)
        relative_path = row["relative_path"].strip()
        if relative_path in path_to_sample:
            raise ManifestValidationError(
                f"Row {row_number}: an image path is assigned to multiple samples."
            )
        path_to_sample.add(relative_path)

        label = row["label"].strip()
        if label not in SUPPORTED_LABELS:
            raise ManifestValidationError(
                f"Row {row_number}: unsupported label {label!r}."
            )
        negative_type = row["negative_type"].strip().lower()
        if negative_type not in NEGATIVE_TYPES:
            raise ManifestValidationError(
                f"Row {row_number}: negative_type must be one of {sorted(NEGATIVE_TYPES)}."
            )
        if (label == "NOTHING") == (negative_type == "not_applicable"):
            raise ManifestValidationError(
                f"Row {row_number}: NOTHING samples require a negative type; letter samples require not_applicable."
            )
        split = row["split"].strip()
        if split not in SPLITS:
            raise ManifestValidationError(
                f"Row {row_number}: split must be one of {SPLITS}."
            )
        if row["consent_granted"].strip().lower() != "true":
            raise ManifestValidationError(
                f"Row {row_number}: sample does not have an affirmative consent flag."
            )
        if not row["consent_version"].strip():
            raise ManifestValidationError(
                f"Row {row_number}: consent_version is required."
            )
        consented_at = parse_timestamp(
            row["consented_at"].strip(), "consented_at", row_number
        )
        recorded_at = parse_timestamp(
            row["recorded_at"].strip(), "recorded_at", row_number
        )
        if consented_at > recorded_at:
            raise ManifestValidationError(
                f"Row {row_number}: consent must precede sample recording."
            )
        signer_id = row["signer_id"].strip()
        if not signer_id.startswith("signer-") or len(signer_id) <= len("signer-") or any(
            character not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
            for character in signer_id
        ):
            raise ManifestValidationError(
                f"Row {row_number}: signer_id must be a non-identifying signer-* code."
            )
        device = row["device"].strip()
        if not device.startswith("device-") or len(device) <= len("device-") or any(
            character not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
            for character in device
        ):
            raise ManifestValidationError(
                f"Row {row_number}: device must be a non-identifying device-* code."
            )
        for field, choices in CONTROLLED_CATEGORIES.items():
            if row[field].strip().lower() not in choices:
                raise ManifestValidationError(
                    f"Row {row_number}: {field} must be one of {sorted(choices)}."
                )
        try:
            distance_cm = float(row["distance_cm"])
        except ValueError as error:
            raise ManifestValidationError(
                f"Row {row_number}: distance_cm must be a positive number."
            ) from error
        if distance_cm <= 0:
            raise ManifestValidationError(
                f"Row {row_number}: distance_cm must be a positive number."
            )

        previous_split = signer_split.setdefault(signer_id, split)
        if previous_split != split:
            raise ManifestValidationError(
                f"Row {row_number}: signer appears in multiple data splits."
            )
        signers_by_split[split].add(signer_id)
        samples_by_split[split] += 1
        labels_by_split[split][label] += 1
        signer_label_counts[(split, signer_id, label)] += 1
        conditions_by_split[split]["device"].add(device)
        for field in (
            "lighting",
            "camera_angle",
            "background",
            "signing_speed",
        ):
            conditions_by_split[split][field].add(row[field].strip().lower())
        conditions_by_split[split]["distance_cm"].add(distance_cm)
        if split == "test" and label == "NOTHING":
            test_negative_counts[negative_type] += 1

        image_path = resolve_image(image_root, relative_path, row_number, sample_id)
        if not image_path.is_file():
            raise ManifestValidationError(
                f"Row {row_number}: referenced image file does not exist."
            )
        if image_path.stat().st_size > 10 * 1024 * 1024:
            raise ManifestValidationError(
                f"Row {row_number}: image file must not exceed 10 MB."
            )
        try:
            with Image.open(image_path) as image:
                if image.format not in {"JPEG", "PNG", "WEBP"}:
                    raise ManifestValidationError(
                        f"Row {row_number}: image must be JPEG, PNG, or WebP."
                    )
                if image.width < 64 or image.height < 64:
                    raise ManifestValidationError(
                        f"Row {row_number}: image dimensions must be at least 64x64."
                    )
                if image.width > 4096 or image.height > 4096:
                    raise ManifestValidationError(
                        f"Row {row_number}: image dimensions must not exceed 4096x4096."
                    )
                image.verify()
        except (UnidentifiedImageError, OSError) as error:
            raise ManifestValidationError(
                f"Row {row_number}: image bytes are invalid."
            ) from error

    absent_splits = [split for split in SPLITS if not signers_by_split[split]]
    if absent_splits:
        raise ManifestValidationError(f"Missing signers for splits: {absent_splits}.")
    for split, minimum in MIN_SIGNERS_PER_SPLIT.items():
        actual = len(signers_by_split[split])
        if actual < minimum:
            raise ManifestValidationError(
                f"Split {split!r} requires at least {minimum} signers; found {actual}."
            )
        missing_labels = sorted(set(SUPPORTED_LABELS) - set(labels_by_split[split]))
        if missing_labels:
            raise ManifestValidationError(
                f"Split {split!r} is missing labels: {missing_labels}."
            )
    for signer_id in signers_by_split["test"]:
        for label in PILOT_LETTERS:
            repetitions = signer_label_counts[("test", signer_id, label)]
            if repetitions < MIN_TEST_REPETITIONS_PER_SIGNER_LABEL:
                raise ManifestValidationError(
                    "Final test requires at least "
                    f"{MIN_TEST_REPETITIONS_PER_SIGNER_LABEL} samples for every "
                    f"pilot letter from each test signer; found {repetitions} "
                    f"for {label}."
                )
    test_negative_count = sum(test_negative_counts.values())
    if test_negative_count < MIN_TEST_NEGATIVE_SAMPLES:
        raise ManifestValidationError(
            "Final test requires at least "
            f"{MIN_TEST_NEGATIVE_SAMPLES} no-hand/negative samples; "
            f"found {test_negative_count}."
        )
    missing_negative_types = sorted({
        "no_hand",
        "object",
        "partial_hand",
        "multiple_hands",
        "unsupported_sign",
        "poor_quality",
    } - set(test_negative_counts))
    if missing_negative_types:
        raise ManifestValidationError(
            f"Final test is missing negative categories: {missing_negative_types}."
        )

    return {
        "status": "valid",
        "sampleCount": len(rows),
        "signerCountBySplit": {
            split: len(signers_by_split[split]) for split in SPLITS
        },
        "sampleCountBySplit": {
            split: samples_by_split[split] for split in SPLITS
        },
        "sampleCountByLabelAndSplit": {
            split: {
                label: labels_by_split[split][label]
                for label in SUPPORTED_LABELS
            }
            for split in SPLITS
        },
        "testNegativeCountByType": dict(sorted(test_negative_counts.items())),
        "conditionCoverageBySplit": {
            split: {
                "deviceCount": len(conditions_by_split[split]["device"]),
                "lighting": sorted(conditions_by_split[split]["lighting"]),
                "cameraAngles": sorted(conditions_by_split[split]["camera_angle"]),
                "backgrounds": sorted(conditions_by_split[split]["background"]),
                "signingSpeeds": sorted(conditions_by_split[split]["signing_speed"]),
                "distanceCmRange": [
                    min(conditions_by_split[split]["distance_cm"]),
                    max(conditions_by_split[split]["distance_cm"]),
                ],
                "uniqueDistanceCount": len(
                    conditions_by_split[split]["distance_cm"]
                ),
            }
            for split in SPLITS
        },
        "supportedLabels": list(SUPPORTED_LABELS),
        "limitations": (
            "Checks declared consent flags, not consent validity; does not verify "
            "participant identity, dataset provenance, or model performance."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate a consented signer-disjoint pilot image manifest."
    )
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--image-root", required=True, type=Path)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    try:
        report = validate_manifest(args.manifest, args.image_root)
    except ManifestValidationError as error:
        parser.exit(2, f"Invalid pilot dataset: {error}\n")
    serialized = json.dumps(report, indent=2)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(serialized + "\n", encoding="utf-8")
    print(serialized)


if __name__ == "__main__":
    main()
