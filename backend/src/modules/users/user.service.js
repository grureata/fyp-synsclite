
const db = require('../../config/db');

async function listUsers() {
  return db.user.findMany({
    select: { id: true, username: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

module.exports = { listUsers };
