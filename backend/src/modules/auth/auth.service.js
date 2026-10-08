
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const { env } = require('../../config/env');

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

async function registerUser({ username, email, password }) {
  const [existingEmail, existingUsername] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.user.findUnique({ where: { username } }),
  ]);
  if (existingEmail || existingUsername) {
    throw new ApiError(409, 'An account with that email or username already exists.');
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const user = await db.user.create({
    data: {
      username,
      email,
      passwordHash,
      role: 'DEAF_USER',
    },
  });

  return { user: sanitizeUser(user), token: signToken(user) };
}

async function loginUser({ email, password }) {
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const token = signToken(user);
  return { user: sanitizeUser(user), token };
}

async function getCurrentUser(userId) {
  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return sanitizeUser(user);
}

module.exports = { registerUser, loginUser, getCurrentUser, sanitizeUser, signToken };
