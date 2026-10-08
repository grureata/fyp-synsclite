const { z } = require('zod');

const createContextPresetSchema = z.object({
  name: z.string().trim().min(2).max(80),
  vocabularyDomainDescription: z.string().trim().min(10).max(1000),
}).strict();

module.exports = { createContextPresetSchema };
