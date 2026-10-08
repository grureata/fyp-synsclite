
const db = require('../../config/db');

async function listContextPresets() {
  return db.contextPreset.findMany({ orderBy: { name: 'asc' } });
}

async function createContextPreset(data) {
  return db.contextPreset.create({ data });
}

module.exports = { listContextPresets, createContextPreset };
