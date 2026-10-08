const ApiResponse = require('../../utils/ApiResponse');
const { recognizeStaticSign } = require('./recognition.service');

async function predictStaticSign(req, res, next) {
  try {
    const prediction = await recognizeStaticSign(req.body.imageBase64);
    return ApiResponse.success(res, prediction, 'Recognition completed.');
  } catch (error) {
    return next(error);
  }
}

module.exports = { predictStaticSign };
