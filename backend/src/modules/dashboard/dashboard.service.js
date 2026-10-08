
const db = require('../../config/db');
const { pingRecognitionService } = require('../recognition/mlClient.service');

function buildTrend(records) {
  const today = new Date();
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    const dayRecords = records.filter((record) => record.timestamp.toISOString().slice(0, 10) === key);
    days.push({
      day: date.toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' }),
      avgConfidence: dayRecords.length
        ? dayRecords.reduce((sum, record) => sum + record.confidenceScore, 0) / dayRecords.length * 100
        : 0,
    });
  }
  return days;
}

async function getSummary(userId) {
  const [sessions, records, presets] = await Promise.all([
    db.translationSession.findMany({
      where: { userId },
      select: { presetId: true, totalSignsDetected: true },
    }),
    db.translationRecord.findMany({
      where: { session: { is: { userId } } },
      include: { session: { include: { preset: true } } },
      orderBy: { timestamp: 'asc' },
    }),
    db.contextPreset.findMany({ select: { id: true, name: true } }),
  ]);
  const averageConfidence = records.length
    ? records.reduce((sum, record) => sum + record.confidenceScore, 0) / records.length * 100
    : 0;
  const contextCounts = new Map();
  for (const session of sessions) {
    contextCounts.set(session.presetId, (contextCounts.get(session.presetId) || 0) + 1);
  }
  const presetNames = new Map(presets.map((preset) => [preset.id, preset.name]));

  return {
    kpis: {
      avgConfidence: averageConfidence,
      signsDetected: sessions.reduce((sum, session) => sum + session.totalSignsDetected, 0),
      avgLatencyMs: null,
      cameraFps: null,
      translationsCount: records.length,
      contextModesCount: contextCounts.size,
    },
    confidenceTrend: buildTrend(records),
    contextUsage: Array.from(contextCounts, ([presetId, count]) => ({
      preset: presetNames.get(presetId) || 'Unknown',
      count,
    })),
  };
}

async function getSystemHealth() {
  const [databaseAvailable, mlHealth] = await Promise.all([
    db.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    pingRecognitionService(),
  ]);
  return [
    {
      name: 'Database',
      status: databaseAvailable ? 'operational' : 'unavailable',
      detail: databaseAvailable ? 'Database query succeeded.' : 'Database query failed.',
    },
    {
      name: 'ML Service',
      status: mlHealth.status === 'ok' ? 'operational' : 'unavailable',
      detail: mlHealth.status === 'ok' ? 'Inference service responded to its health check.' : 'Inference service is not reachable.',
    },
  ];
}

async function getRecordsForDashboard(userId) {
  const records = await db.translationRecord.findMany({
    where: { session: { is: { userId } } },
    include: { session: { include: { preset: true } } },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });
  return records.map((record) => ({
    id: record.id,
    sentence: record.synthesizedSentence,
    gloss: record.rawGlossSequence,
    confidence: record.confidenceScore,
    ctx: record.session.preset.name,
    time: record.timestamp,
  }));
}

module.exports = { getSummary, getSystemHealth, getRecordsForDashboard };
