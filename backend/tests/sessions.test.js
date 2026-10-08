const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findUnique: jest.fn(), create: jest.fn() },
    calibrationProfile: {},
    contextPreset: {},
    translationSession: {
      findMany: jest.fn(),
      create: jest.fn().mockResolvedValue({
        id: '00000000-0000-4000-8000-000000000002',
        userId: 'user-1',
        presetId: '00000000-0000-4000-8000-000000000001',
        totalSignsDetected: 0,
        startTime: new Date(),
        endTime: null,
      }),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    translationRecord: {
      create: jest.fn().mockResolvedValue({ id: 'record-1' }),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
    contactMessage: {},
  })),
}));

const { app } = require('../src/app');
const db = require('../src/config/db');

describe('Session API', () => {
  it('creates a session for the authenticated user', async () => {
    const token = jwt.sign({ id: 'user-1', role: 'DEAF_USER' }, process.env.JWT_SECRET || 'test-secret');
    const res = await request(app)
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ presetId: '00000000-0000-4000-8000-000000000001' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('rejects invalid session input', async () => {
    const token = jwt.sign({ id: 'user-1', role: 'DEAF_USER' }, process.env.JWT_SECRET || 'test-secret');
    const res = await request(app)
      .post('/api/v1/sessions')
      .set('Authorization', 'Bearer ' + token)
      .send({ presetId: 'not-a-uuid', totalSignsDetected: -1 });

    expect(res.status).toBe(400);
  });

  it('does not expose another user session', async () => {
    db.translationSession.findFirst.mockResolvedValue(null);
    const token = jwt.sign({ id: 'user-1', role: 'DEAF_USER' }, process.env.JWT_SECRET || 'test-secret');
    const res = await request(app)
      .get('/api/v1/sessions/00000000-0000-4000-8000-000000000099')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(404);
  });

  it('increments the session sign count when it saves a record', async () => {
    db.translationSession.findFirst.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000002',
      userId: 'user-1',
      endTime: null,
    });
    const token = jwt.sign({ id: 'user-1', role: 'DEAF_USER' }, process.env.JWT_SECRET || 'test-secret');
    const res = await request(app)
      .post('/api/v1/sessions/00000000-0000-4000-8000-000000000002/records')
      .set('Authorization', 'Bearer ' + token)
      .send({
        rawGlossSequence: 'A',
        synthesizedSentence: 'A',
        confidenceScore: 0.95,
      });

    expect(res.status).toBe(201);
    expect(db.translationSession.update).toHaveBeenCalledWith({
      where: { id: '00000000-0000-4000-8000-000000000002' },
      data: { totalSignsDetected: { increment: 1 } },
    });
  });
});
