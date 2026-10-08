
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { env } = require('./env');

const globalForPrisma = global;
const prisma = globalForPrisma.__prisma || new PrismaClient({
  adapter: new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  }),
});
globalForPrisma.__prisma = prisma;

module.exports = prisma;
