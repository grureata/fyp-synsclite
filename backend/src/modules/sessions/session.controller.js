
const ApiResponse = require('../../utils/ApiResponse');
const {
  listSessionsForUser,
  createSession,
  findSessionById,
  endSession,
  deleteSession,
  createSessionRecord,
} = require('./session.service');

async function listMySessions(req, res, next) {
  try {
    const sessions = await listSessionsForUser(req.user.id);
    return ApiResponse.success(res, sessions, 'Sessions retrieved.');
  } catch (error) {
    return next(error);
  }
}

async function createMySession(req, res, next) {
  try {
    const session = await createSession({
      userId: req.user.id,
      presetId: req.body.presetId,
    });
    return ApiResponse.success(res, session, 'Session created.', 201);
  } catch (error) {
    return next(error);
  }
}

async function getSessionDetail(req, res, next) {
  try {
    const session = await findSessionById(req.params.id, req.user.id);
    if (!session) {
      return ApiResponse.error(res, 404, 'Session not found.');
    }
    return ApiResponse.success(res, session, 'Session retrieved.');
  } catch (error) {
    return next(error);
  }
}

async function endMySession(req, res, next) {
  try {
    const session = await endSession(req.params.id, req.user.id);
    if (!session) return ApiResponse.error(res, 404, 'Session not found.');
    return ApiResponse.success(res, session, 'Session ended.');
  } catch (error) {
    return next(error);
  }
}

async function deleteMySession(req, res, next) {
  try {
    const deleted = await deleteSession(req.params.id, req.user.id);
    if (!deleted) return ApiResponse.error(res, 404, 'Session not found.');
    return ApiResponse.success(res, null, 'Session deleted.');
  } catch (error) {
    return next(error);
  }
}

async function createMySessionRecord(req, res, next) {
  try {
    const record = await createSessionRecord(req.params.id, req.user.id, req.body);
    if (!record) return ApiResponse.error(res, 404, 'Session not found.');
    return ApiResponse.success(res, record, 'Translation record saved.', 201);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listMySessions,
  createMySession,
  getSessionDetail,
  endMySession,
  deleteMySession,
  createMySessionRecord,
};
