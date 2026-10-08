import csv
import os
import tempfile
import unittest
from pathlib import Path

from PIL import Image

from pilot_data.validate_manifest import (
    ManifestValidationError,
    REQUIRED_COLUMNS,
    SUPPORTED_LABELS,
    validate_manifest,
)


class PilotManifestTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.image_root = self.root / "images"
        self.image_root.mkdir()
        self.template_image = self.image_root / "template.jpg"
        Image.new("RGB", (64, 64)).save(self.template_image, format="JPEG")
        self.manifest_path = self.root / "manifest.csv"
        self.rows = []
        split_signers = {
            "train": ["signer-train-1", "signer-train-2", "signer-train-3"],
            "validation": [
                "signer-validation-1",
                "signer-validation-2",
                "signer-validation-3",
            ],
            "test": [f"signer-test-{index}" for index in range(1, 13)],
        }
        negative_types = (
            "no_hand",
            "object",
            "face",
            "partial_hand",
            "multiple_hands",
            "unsupported_sign",
            "poor_quality",
        )
        sample_number = 0
        for split, signers in split_signers.items():
            for signer in signers:
                samples = []
                for label in SUPPORTED_LABELS[:-1]:
                    repetitions = 5 if split == "test" else 1
                    samples.extend((label, "not_applicable") for _ in range(repetitions))
                negative_sample_count = 42 if split == "test" else 1
                samples.extend(
                    (
                        "NOTHING",
                        negative_types[index % len(negative_types)]
                        if split == "test"
                        else "no_hand",
                    )
                    for index in range(negative_sample_count)
                )
                for label, negative_type in samples:
                    sample_number += 1
                    sample_id = f"sample-{sample_number}"
                    relative_path = f"images/{sample_id}.jpg"
                    os.link(self.template_image, self.root / relative_path)
                    self.rows.append({
                        "sample_id": sample_id,
                        "relative_path": relative_path,
                        "label": label,
                        "negative_type": negative_type,
                        "signer_id": signer,
                        "split": split,
                        "consent_granted": "true",
                        "consent_version": "pilot-v1",
                        "consented_at": "2026-10-01T10:00:00Z",
                        "recorded_at": "2026-10-01T10:10:00Z",
                        "device": f"device-{sample_number % 2 + 1}",
                        "lighting": "indoor",
                        "distance_cm": "75",
                        "camera_angle": "front",
                        "background": "plain",
                        "signing_speed": "normal",
                    })
        self._write_manifest()

    def tearDown(self):
        self.temp.cleanup()

    def _write_manifest(self, fieldnames=REQUIRED_COLUMNS):
        with self.manifest_path.open("w", encoding="utf-8", newline="") as output:
            writer = csv.DictWriter(
                output, fieldnames=fieldnames, extrasaction="ignore"
            )
            writer.writeheader()
            writer.writerows(self.rows)

    def test_accepts_fully_consented_signer_disjoint_dataset(self):
        report = validate_manifest(self.manifest_path, self.root)

        self.assertEqual(report["status"], "valid")
        self.assertEqual(report["signerCountBySplit"]["train"], 3)
        self.assertEqual(report["signerCountBySplit"]["validation"], 3)
        self.assertEqual(report["signerCountBySplit"]["test"], 12)
        self.assertEqual(report["testNegativeCountByType"]["no_hand"], 72)
        self.assertEqual(report["conditionCoverageBySplit"]["test"]["deviceCount"], 2)
        self.assertNotIn("signerIds", report)

    def test_rejects_signer_leakage_between_splits(self):
        self.rows[-1]["signer_id"] = self.rows[0]["signer_id"]
        self._write_manifest()

        with self.assertRaisesRegex(ManifestValidationError, "multiple data splits"):
            validate_manifest(self.manifest_path, self.root)

    def test_rejects_unconsented_sample(self):
        self.rows[0]["consent_granted"] = "false"
        self._write_manifest()

        with self.assertRaisesRegex(ManifestValidationError, "affirmative consent"):
            validate_manifest(self.manifest_path, self.root)

    def test_rejects_identifying_signer_id(self):
        self.rows[0]["signer_id"] = "person@example.com"
        self._write_manifest()

        with self.assertRaisesRegex(ManifestValidationError, "non-identifying signer"):
            validate_manifest(self.manifest_path, self.root)

    def test_rejects_missing_signer_metadata_column(self):
        fieldnames = tuple(column for column in REQUIRED_COLUMNS if column != "signer_id")
        self._write_manifest(fieldnames)

        with self.assertRaisesRegex(ManifestValidationError, "missing=.*signer_id"):
            validate_manifest(self.manifest_path, self.root)

    def test_rejects_image_path_traversal(self):
        self.rows[0]["relative_path"] = "../outside.jpg"
        self._write_manifest()

        with self.assertRaisesRegex(ManifestValidationError, "safe relative"):
            validate_manifest(self.manifest_path, self.root)

    def test_rejects_identifying_image_filename(self):
        self.rows[0]["relative_path"] = "images/person-name.jpg"
        self._write_manifest()

        with self.assertRaisesRegex(ManifestValidationError, "image path must be"):
            validate_manifest(self.manifest_path, self.root)

    def test_rejects_fewer_than_five_test_repetitions(self):
        test_row = next(row for row in self.rows if row["split"] == "test" and row["label"] == "A")
        self.rows.remove(test_row)
        self._write_manifest()

        with self.assertRaisesRegex(ManifestValidationError, "at least 5 samples"):
            validate_manifest(self.manifest_path, self.root)


if __name__ == "__main__":
    unittest.main()
