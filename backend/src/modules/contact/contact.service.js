
const db = require('../../config/db');

async function createContactMessage(data) {
  return db.contactMessage.create({ data });
}

module.exports = { createContactMessage };
