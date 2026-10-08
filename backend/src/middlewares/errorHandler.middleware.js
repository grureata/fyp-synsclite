
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  let statusCode = Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode <= 599
    ? err.statusCode
    : 500;
  let message = err.message || 'Request failed.';

  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with those values already exists.';
  }
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'The requested record was not found.';
  }
  if (err.code === 'P2003') {
    statusCode = 400;
    message = 'A related record does not exist.';
  }
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON request.';
  }

  if (statusCode >= 500) message = 'Internal server error.';

  if (statusCode >= 500) {
    logger.error({ message: err.message, stack: err.stack, path: req.path, method: req.method });
  }

  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    details: statusCode < 500 ? err.details || null : null,
  });
}

module.exports = { errorHandler };
