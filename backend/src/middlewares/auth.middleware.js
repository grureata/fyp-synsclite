
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { env } = require('../config/env');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const cookieToken = req.cookies && req.cookies.token;
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = bearerToken || cookieToken;

    if (!token) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    const roles = ['DEAF_USER', 'HEARING_USER', 'ADMIN'];
    if (typeof decoded.id !== 'string' || !roles.includes(decoded.role)) {
      return next(new ApiError(401, 'Invalid or expired token.'));
    }
    req.user = { id: decoded.id, role: decoded.role };
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token.'));
  }
}

module.exports = authMiddleware;
