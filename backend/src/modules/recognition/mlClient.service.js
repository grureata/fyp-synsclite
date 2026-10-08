
const axios = require('axios');
const { env } = require('../../config/env');

async function pingRecognitionService() {
  try {
    const response = await axios.get(`${env.ML_SERVICE_URL}/health`, { timeout: 1500 });
    return response.data;
  } catch (error) {
    return { status: 'unreachable' };
  }
}

module.exports = { pingRecognitionService };
