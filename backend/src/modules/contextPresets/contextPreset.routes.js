
const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { createContextPresetSchema } = require('./contextPreset.validation');
const { getAllContextPresets, createPreset } = require('./contextPreset.controller');

const router = express.Router();
router.use(authMiddleware);
router.get('/', asyncHandler(getAllContextPresets));
router.post('/', requireRole('ADMIN'), validate(createContextPresetSchema), asyncHandler(createPreset));

module.exports = router;
