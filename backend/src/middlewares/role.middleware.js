
const ApiError = require('../utils/ApiError');

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new ApiError(403, 'Forbidden: insufficient privileges.'));
    }
    return next();
  };
}

module.exports = { requireRole };
