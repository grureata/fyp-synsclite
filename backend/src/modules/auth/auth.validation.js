
const { z } = require('zod');

const passwordSchema = z.string().min(8).max(72).refine(
  (password) => Buffer.byteLength(password, 'utf8') <= 72,
  'Password must not exceed 72 UTF-8 bytes.'
);

const registerSchema = z.object({
  username: z.string().trim().min(3).max(30),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: passwordSchema.regex(/\d/),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: passwordSchema,
});

module.exports = { registerSchema, loginSchema };
