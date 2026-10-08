
const http = require('http');
const { app } = require('./app');
const { createSocketServer } = require('./config/socket');
const { env } = require('./config/env');
const db = require('./config/db');

const server = http.createServer(app);
createSocketServer(server);

async function startServer() {
  try {
    await db.$connect();
    await db.$queryRaw`SELECT 1`;
    server.listen(env.PORT, () => {
      console.log(`SignSync Lite backend listening on port ${env.PORT}`);
    });
  } catch {
    console.error('Unable to connect to the configured database. Verify connectivity and DATABASE_URL.');
    try {
      await db.$disconnect();
    } catch {
      console.error('Unable to close the database connection after startup failure.');
    }
    process.exitCode = 1;
  }
}

void startServer();
module.exports = { server };
