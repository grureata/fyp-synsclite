
const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');

async function listSessionsForUser(userId) {
  return db.translationSession.findMany({
    where: { userId },
    include: { records: true, preset: true },
    orderBy: { startTime: 'desc' },
    take: 100,
  });
}

async function createSession({ userId, presetId }) {
  return db.translationSession.create({
    data: { userId, presetId },
  });
}

async function findSessionById(id, userId) {
  return db.translationSession.findFirst({
    where: { id, userId },
    include: { records: true, preset: true },
  });
}

async function endSession(id, userId) {
  const session = await db.translationSession.findFirst({ where: { id, userId } });
  if (!session) return null;
  if (session.endTime) return session;

  return db.translationSession.update({
    where: { id },
    data: { endTime: new Date() },
    include: { records: true, preset: true },
  });
}

async function deleteSession(id, userId) {
  const result = await db.translationSession.deleteMany({ where: { id, userId } });
  if (result.count === 0) return false;
  return true;
}

async function createSessionRecord(id, userId, data) {
  const session = await db.translationSession.findFirst({ where: { id, userId } });
  if (!session) return null;
  if (session.endTime) throw new ApiError(409, 'The session has already ended.');

  const [record] = await db.$transaction([
    db.translationRecord.create({ data: { ...data, sessionId: id } }),
    db.translationSession.update({
      where: { id },
      data: { totalSignsDetected: { increment: 1 } },
    }),
  ]);
  return record;
}

module.exports = {
  listSessionsForUser,
  createSession,
  findSessionById,
  endSession,
  deleteSession,
  createSessionRecord,
};
