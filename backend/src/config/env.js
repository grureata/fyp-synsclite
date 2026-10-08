
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

function integerFromEnv(name, fallback, minimum, maximum) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return value;
}

if (!process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}
if (!process.env.JWT_SECRET) {
  throw new Error('Missing required environment variable: JWT_SECRET');
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters in production.');
}
if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
  throw new Error('CLIENT_URL is required in production.');
}

const configuredClientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
let clientOrigin;
try {
  const parsedClientUrl = new URL(configuredClientUrl);
  if (!['http:', 'https:'].includes(parsedClientUrl.protocol)) throw new Error();
  clientOrigin = parsedClientUrl.origin;
} catch {
  throw new Error('CLIENT_URL must be a valid HTTP or HTTPS origin.');
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: integerFromEnv('PORT', 5000, 1, 65535),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: clientOrigin,
  BCRYPT_SALT_ROUNDS: integerFromEnv('BCRYPT_SALT_ROUNDS', 10, 10, 14),
  RATE_LIMIT_WINDOW_MS: integerFromEnv('RATE_LIMIT_WINDOW_MS', 900000, 1000, 86400000),
  RATE_LIMIT_MAX_REQUESTS: integerFromEnv('RATE_LIMIT_MAX_REQUESTS', 100, 1, 10000),
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
};

module.exports = { env };
