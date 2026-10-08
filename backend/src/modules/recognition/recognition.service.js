const axios = require('axios');
const { z } = require('zod');
const { env } = require('../../config/env');
const ApiError = require('../../utils/ApiError');

const predictionSchema = z.object({
  status: z.enum(['recognized', 'uncertain', 'no_sign']),
  prediction: z.string().nullable(),
  candidate: z.string(),
  confidence: z.number().min(0).max(1),
  minimumConfidence: z.number().min(0).max(1),
  topCandidates: z.array(z.object({
    label: z.string(),
    confidence: z.number().min(0).max(1),
  })).min(1).max(3),
  handDetected: z.boolean(),
  modelVersion: z.string().min(1),
  handDetectorVersion: z.string().min(1),
  latencyMs: z.number().nonnegative(),
  scope: z.string().min(1),
}).strict().refine((prediction) => (
  prediction.handDetected || prediction.status !== 'recognized'
));

async function recognizeStaticSign(imageBase64) {
  let response;
  try {
    response = await axios.post(
      `${env.ML_SERVICE_URL}/v1/predict`,
      { imageBase64 },
      { timeout: 10_000, maxContentLength: 1024 * 1024, maxBodyLength: 3 * 1024 * 1024 }
    );
  } catch (error) {
    if (axios.isAxiosError(error) && ['ECONNABORTED', 'ETIMEDOUT'].includes(error.code)) {
      throw new ApiError(504, 'Recognition took too long. Please try again.');
    }
    if (axios.isAxiosError(error) && error.response?.status >= 400
      && error.response?.status < 500) {
      throw new ApiError(400, 'The recognition service rejected the camera image.');
    }
    if (axios.isAxiosError(error)) {
      throw new ApiError(503, 'The recognition service is unavailable.');
    }
    throw error;
  }

  const parsed = predictionSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new ApiError(502, 'The recognition service returned an invalid prediction response.');
  }
  return parsed.data;
}

module.exports = { recognizeStaticSign };
