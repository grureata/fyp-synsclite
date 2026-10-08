
const express = require('express');
const { z } = require('zod');
const validate = require('../../middlewares/validate.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const { getLegalDocument, updateLegalDocument } = require('./content.controller');

const router = express.Router();
const slugSchema = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,100}$/) });

router.get('/:slug', validate(slugSchema, 'params'), asyncHandler(getLegalDocument));
router.put(
  '/:slug',
  authMiddleware,
  requireRole('ADMIN'),
  validate(slugSchema, 'params'),
  asyncHandler(updateLegalDocument)
);

module.exports = router;
