
const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const authMiddleware = require('../../middlewares/auth.middleware');
const {
  dashboardSummary,
  dashboardHealth,
  dashboardRecords,
  exportDashboardRecords,
} = require('./dashboard.controller');

const router = express.Router();
router.use(authMiddleware);
router.get('/summary', asyncHandler(dashboardSummary));
router.get('/system-health', asyncHandler(dashboardHealth));
router.get('/records/export', asyncHandler(exportDashboardRecords));
router.get('/records', asyncHandler(dashboardRecords));

module.exports = router;
