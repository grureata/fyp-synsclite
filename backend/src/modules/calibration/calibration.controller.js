
const { z } = require('zod');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { getCalibration, upsertCalibration, deleteCalibration } = require('./calibration.service');

const calibrationSchema = z.object({
  armLengthRatio: z.number().min(0.5).max(2),
  handScaleFactor: z.number().min(0.5).max(2),
  signingSpeedFps: z.number().min(5).max(60),
});

async function getMyCalibration(req, res, next) {
  try {
    const profile = await getCalibration(req.user.id);
    if (!profile) {
      return ApiResponse.error(res, 404, 'Not calibrated yet.');
    }
    return ApiResponse.success(res, profile, 'Calibration profile retrieved.');
  } catch (error) {
    return next(error);
  }
}

async function createOrUpdateCalibration(req, res, next) {
  try {
    const parsed = calibrationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'Calibration values out of expected range.', parsed.error.issues);
    }

    const profile = await upsertCalibration(req.user.id, parsed.data);
    return ApiResponse.success(res, profile, 'Calibration saved successfully.');
  } catch (error) {
    return next(error);
  }
}

async function deleteMyCalibration(req, res, next) {
  try {
    await deleteCalibration(req.user.id);
    return ApiResponse.success(res, null, 'Calibration deleted.');
  } catch (error) {
    return next(error);
  }
}

module.exports = { getMyCalibration, createOrUpdateCalibration, deleteMyCalibration };
