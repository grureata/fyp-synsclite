
const ApiResponse = require('../../utils/ApiResponse');
const { listContextPresets, createContextPreset } = require('./contextPreset.service');

async function getAllContextPresets(req, res, next) {
  try {
    const presets = await listContextPresets();
    return ApiResponse.success(res, presets, 'Context presets retrieved.');
  } catch (error) {
    return next(error);
  }
}

async function createPreset(req, res, next) {
  try {
    const preset = await createContextPreset(req.body);
    return ApiResponse.success(res, preset, 'Context preset created.', 201);
  } catch (error) {
    return next(error);
  }
}

module.exports = { getAllContextPresets, createPreset };
