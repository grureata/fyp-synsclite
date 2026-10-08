const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findUnique: jest.fn(), create: jest.fn() },
    calibrationProfile: {},
    contextPreset: { findMany: jest.fn().mockResolvedValue([]) },
    translationSession: { findMany: jest.fn().mockResolvedValue([]) },
    translationRecord: { findMany: jest.fn().mockResolvedValue([]) },
    contactMessage: {},
  })),
}));

const { app } = require('../src/app');
const db = require('../src/config/db');

describe('Dashboard API', () => {
  it('returns summary data for authenticated users', async () => {
    const token = jwt.sign({ id: 'user-1', role: 'DEAF_USER' }, process.env.JWT_SECRET || 'test-secret');
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis).toHaveProperty('avgConfidence');
    expect(res.body.data.kpis.avgConfidence).toBe(0);
    expect(res.body.data.kpis.translationsCount).toBe(0);
    expect(res.body.data.confidenceTrend.length).toBe(7);
    expect(db.translationRecord.findMany.mock.calls[0][0].where.session.is.userId).toBe('user-1');
  });
});
