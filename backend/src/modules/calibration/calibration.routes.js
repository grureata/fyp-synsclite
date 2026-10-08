
const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const authMiddleware = require('../../middlewares/auth.middleware');
const { getMyCalibration, createOrUpdateCalibration, deleteMyCalibration } = require('./calibration.controller');

const router = express.Router();
router.use(authMiddleware);
router.get('/me', asyncHandler(getMyCalibration));
router.post('/', asyncHandler(createOrUpdateCalibration));
router.delete('/', asyncHandler(deleteMyCalibration));

module.exports = router;
