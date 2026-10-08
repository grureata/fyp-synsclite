const { z } = require('zod');

const MAX_IMAGE_BASE64_LENGTH = 2_796_204;

const recognitionRequestSchema = z.object({
  imageBase64: z.string()
    .min(1)
    .max(MAX_IMAGE_BASE64_LENGTH)
    .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
}).strict();

module.exports = { recognitionRequestSchema };
