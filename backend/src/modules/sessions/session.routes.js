
const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const authMiddleware = require('../../middlewares/auth.middleware');
const {
  listMySessions,
  createMySession,
  getSessionDetail,
  endMySession,
  deleteMySession,
  createMySessionRecord,
} = require('./session.controller');
const validate = require('../../middlewares/validate.middleware');
const { sessionIdSchema, createSessionSchema, createRecordSchema } = require('./session.validation');

const router = express.Router();
router.use(authMiddleware);
router.get('/', asyncHandler(listMySessions));
router.post('/', validate(createSessionSchema), asyncHandler(createMySession));
router.get('/:id', validate(sessionIdSchema, 'params'), asyncHandler(getSessionDetail));
router.patch('/:id/end', validate(sessionIdSchema, 'params'), asyncHandler(endMySession));
router.delete('/:id', validate(sessionIdSchema, 'params'), asyncHandler(deleteMySession));
router.post(
  '/:id/records',
  validate(sessionIdSchema, 'params'),
  validate(createRecordSchema),
  asyncHandler(createMySessionRecord)
);

module.exports = router;
