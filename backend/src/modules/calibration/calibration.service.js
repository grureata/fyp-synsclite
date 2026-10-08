
const db = require('../../config/db');

async function getCalibration(userId) {
  return db.calibrationProfile.findUnique({ where: { userId } });
}

async function upsertCalibration(userId, payload) {
  const { armLengthRatio, handScaleFactor, signingSpeedFps } = payload;
  return db.calibrationProfile.upsert({
    where: { userId },
    create: { userId, armLengthRatio, handScaleFactor, signingSpeedFps },
    update: { armLengthRatio, handScaleFactor, signingSpeedFps, calibratedAt: new Date() },
  });
}

async function deleteCalibration(userId) {
  await db.calibrationProfile.deleteMany({ where: { userId } });
}

module.exports = { getCalibration, upsertCalibration, deleteCalibration };
