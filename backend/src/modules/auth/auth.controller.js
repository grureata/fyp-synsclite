
const logger = require('../../utils/logger');
const ApiResponse = require('../../utils/ApiResponse');
const { registerUser, loginUser, getCurrentUser } = require('./auth.service');

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

async function register(req, res, next) {
  try {
    const result = await registerUser(req.body);
    setAuthCookie(res, result.token);
    return ApiResponse.success(res, { user: result.user }, 'User registered successfully.', 201);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);
    setAuthCookie(res, result.token);
    return ApiResponse.success(res, { user: result.user }, 'Login successful.');
  } catch (error) {
    logger.warn('Failed login attempt');
    return next(error);
  }
}

async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return ApiResponse.success(res, null, 'Logged out successfully.');
}

async function me(req, res, next) {
  try {
    const user = await getCurrentUser(req.user.id);
    return ApiResponse.success(res, user, 'Current user profile loaded.');
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, logout, me };
