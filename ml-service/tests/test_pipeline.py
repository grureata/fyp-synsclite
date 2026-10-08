import base64
import io
import unittest

import numpy as np
from fastapi import HTTPException
from PIL import Image

from app import classify_response, decode_image
from train import choose_confidence_threshold, stratified_split


class TrainingPipelineTests(unittest.TestCase):
    def test_split_is_disjoint_and_stratified(self):
        targets = [class_index for class_index in range(3) for _ in range(20)]
        training, validation = stratified_split(targets)

        self.assertFalse(set(training) & set(validation))
        self.assertEqual(len(training) + len(validation), len(targets))
        self.assertEqual(len(validation), 9)
        self.assertEqual(
            {targets[index] for index in validation},
            {0, 1, 2},
        )

    def test_confidence_threshold_uses_validation_precision_target(self):
        labels = np.r_[np.zeros(90, dtype=np.int64), np.ones(10, dtype=np.int64)]
        predictions = labels.copy()
        predictions[-10:] = 0
        confidences = np.r_[
            np.linspace(0.9, 0.99, 90),
            np.linspace(0.5, 0.7, 10),
        ].astype(np.float32)

        threshold = choose_confidence_threshold(labels, predictions, confidences)
        accepted = confidences >= threshold

        self.assertGreaterEqual(accepted.sum(), 25)
        self.assertGreaterEqual((labels[accepted] == predictions[accepted]).mean(), 0.95)

    def test_confidence_threshold_refuses_uncalibrated_predictions(self):
        labels = np.zeros(40, dtype=np.int64)
        predictions = np.ones(40, dtype=np.int64)
        confidences = np.linspace(0.5, 0.99, 40, dtype=np.float32)

        with self.assertRaises(RuntimeError):
            choose_confidence_threshold(labels, predictions, confidences)


class InferenceInputTests(unittest.TestCase):
    def test_confident_classifier_result_without_a_detected_hand_is_uncertain(self):
        status, prediction = classify_response(
            candidate="X",
            confidence=0.978,
            threshold=0.411,
            hand_detected=False,
        )

        self.assertEqual(status, "uncertain")
        self.assertIsNone(prediction)

    def test_confident_classifier_result_with_a_detected_hand_is_accepted(self):
        status, prediction = classify_response(
            candidate="X",
            confidence=0.978,
            threshold=0.411,
            hand_detected=True,
        )

        self.assertEqual(status, "recognized")
        self.assertEqual(prediction, "X")

    def test_nothing_class_returns_no_sign(self):
        status, prediction = classify_response(
            candidate="NOTHING",
            confidence=0.99,
            threshold=0.411,
            hand_detected=False,
        )

        self.assertEqual(status, "no_sign")
        self.assertEqual(prediction, "NOTHING")

    def test_decodes_valid_image_to_rgb(self):
        buffer = io.BytesIO()
        Image.new("RGB", (64, 64), color=(15, 30, 45)).save(buffer, format="JPEG")
        image = decode_image(base64.b64encode(buffer.getvalue()).decode("ascii"))

        self.assertEqual(image.mode, "RGB")
        self.assertEqual(image.size, (64, 64))

    def test_rejects_malformed_image_data(self):
        with self.assertRaises(HTTPException) as context:
            decode_image("not base64")

        self.assertEqual(context.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
