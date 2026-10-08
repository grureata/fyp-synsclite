
const ApiResponse = require('../../utils/ApiResponse');
const { getSummary, getSystemHealth, getRecordsForDashboard } = require('./dashboard.service');

async function dashboardSummary(req, res, next) {
  try {
    const summary = await getSummary(req.user.id);
    return ApiResponse.success(res, summary, 'Dashboard summary retrieved.');
  } catch (error) {
    return next(error);
  }
}

async function dashboardHealth(req, res, next) {
  try {
    const health = await getSystemHealth();
    return ApiResponse.success(res, health, 'System health retrieved.');
  } catch (error) {
    return next(error);
  }
}

async function dashboardRecords(req, res, next) {
  try {
    const records = await getRecordsForDashboard(req.user.id);
    return ApiResponse.success(res, records, 'Dashboard records retrieved.');
  } catch (error) {
    return next(error);
  }
}

async function exportDashboardRecords(req, res, next) {
  try {
    const records = await getRecordsForDashboard(req.user.id);
    const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const lines = [
      ['id', 'sentence', 'gloss', 'confidence', 'context', 'timestamp'].map(escapeCsv).join(','),
      ...records.map((record) => [
        record.id,
        record.sentence,
        record.gloss,
        record.confidence,
        record.ctx,
        record.time.toISOString(),
      ].map(escapeCsv).join(',')),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="records.csv"');
    return res.status(200).send(lines.join('\r\n'));
  } catch (error) {
    return next(error);
  }
}

module.exports = { dashboardSummary, dashboardHealth, dashboardRecords, exportDashboardRecords };
