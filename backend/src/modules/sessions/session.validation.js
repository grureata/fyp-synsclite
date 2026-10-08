const { z } = require('zod');

const sessionIdSchema = z.object({ id: z.string().uuid() });
const createSessionSchema = z.object({ presetId: z.string().uuid() }).strict();
const createRecordSchema = z.object({
  rawGlossSequence: z.string().trim().min(1).max(1000),
  synthesizedSentence: z.string().trim().min(1).max(2000),
  confidenceScore: z.number().min(0).max(1),
}).strict();

module.exports = { sessionIdSchema, createSessionSchema, createRecordSchema };
