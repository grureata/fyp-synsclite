const express = require('express');
const authMiddleware = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate.middleware');
const { predictStaticSign } = require('./recognition.controller');
const { recognitionRequestSchema } = require('./recognition.validation');

const router = express.Router();
router.post(
  '/predict',
  authMiddleware,
  validate(recognitionRequestSchema),
  asyncHandler(predictStaticSign)
);

module.exports = router;
