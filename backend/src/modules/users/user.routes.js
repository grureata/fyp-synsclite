
const express = require('express');
const authMiddleware = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const { getAllUsers } = require('./user.controller');

const router = express.Router();
router.use(authMiddleware);
router.get('/', requireRole('ADMIN'), asyncHandler(getAllUsers));

module.exports = router;
