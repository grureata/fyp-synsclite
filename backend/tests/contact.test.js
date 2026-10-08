const request = require('supertest');

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findUnique: jest.fn(), create: jest.fn() },
    calibrationProfile: {},
    contextPreset: {},
    translationSession: {},
    translationRecord: {},
    contactMessage: { create: jest.fn() },
  })),
}));

const { app } = require('../src/app');
const db = require('../src/config/db');

beforeEach(() => {
  db.contactMessage.create.mockReset();
});

describe('Contact API', () => {
  it('saves a valid contact message without echoing its private contents', async () => {
    db.contactMessage.create.mockResolvedValue({
      id: 'message-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'general',
      message: 'I would like to learn more about this project.',
      status: 'NEW',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const res = await request(app)
      .post('/api/v1/contact')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        subject: 'general',
        message: 'I would like to learn more about this project.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({
      id: 'message-1',
      status: 'NEW',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('rejects empty or invalid contact form data', async () => {
    const res = await request(app).post('/api/v1/contact').send({
      name: '',
      email: 'not-an-email',
      subject: 'unknown',
      message: '',
    });

    expect(res.status).toBe(400);
    expect(db.contactMessage.create).not.toHaveBeenCalled();
  });
});
