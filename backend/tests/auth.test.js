const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    calibrationProfile: {},
    contextPreset: {},
    translationSession: {},
    contactMessage: {},
  })),
}));

const { app } = require('../src/app');
const db = require('../src/config/db');

beforeEach(() => {
  db.user.findUnique.mockReset();
  db.user.create.mockReset();
  db.user.findMany.mockReset();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
});

describe('Auth API', () => {
  it('registers a user successfully', async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: 'hash',
      role: 'DEAF_USER',
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'pass1234', role: 'ADMIN' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.user.role).toBe('DEAF_USER');
    expect(res.body.data.token).toBeUndefined();
    expect(db.user.create.mock.calls[0][0].data.role).toBe('DEAF_USER');
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate email registration', async () => {
    db.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'dup@example.com' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'dup', email: 'dup@example.com', password: 'pass1234' });

    expect(res.status).toBe(409);
  });

  it('rejects invalid registration input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'x', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('logs in successfully', async () => {
    const pwdHash = await bcrypt.hash('pass1234', 10);
    db.user.findUnique.mockResolvedValue({
      id: 'user-2',
      username: 'bob',
      email: 'bob@example.com',
      passwordHash: pwdHash,
      role: 'HEARING_USER',
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bob@example.com', password: 'pass1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('bob@example.com');
  });

  it('rejects wrong password', async () => {
    const pwdHash = await bcrypt.hash('pass1234', 10);
    db.user.findUnique.mockResolvedValue({
      id: 'user-3',
      username: 'charlie',
      email: 'charlie@example.com',
      passwordHash: pwdHash,
      role: 'DEAF_USER',
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'charlie@example.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
  });

  it('returns current user with valid token and rejects missing token', async () => {
    const validToken = jwt.sign({ id: 'user-4', role: 'DEAF_USER' }, process.env.JWT_SECRET || 'test-secret');
    db.user.findUnique.mockResolvedValue({
      id: 'user-4',
      username: 'dana',
      email: 'dana@example.com',
      passwordHash: 'hash',
      role: 'DEAF_USER',
      createdAt: new Date(),
    });

    const resWithToken = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(resWithToken.status).toBe(200);

    const resWithoutToken = await request(app).get('/api/v1/auth/me');
    expect(resWithoutToken.status).toBe(401);
  });

  it('denies user listing to non-administrators', async () => {
    const token = jwt.sign({ id: 'user-6', role: 'DEAF_USER' }, process.env.JWT_SECRET || 'test-secret');
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(403);
    expect(db.user.findMany).not.toHaveBeenCalled();
  });

  it('does not return password hashes from the administrator user list', async () => {
    const token = jwt.sign({ id: 'admin-1', role: 'ADMIN' }, process.env.JWT_SECRET || 'test-secret');
    db.user.findMany.mockResolvedValue([{
      id: 'user-7',
      username: 'frank',
      email: 'frank@example.com',
      role: 'DEAF_USER',
      createdAt: new Date(),
    }]);

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', 'Bearer ' + token);

    expect(res.status).toBe(200);
    expect(res.body.data[0].passwordHash).toBeUndefined();
    expect(db.user.findMany.mock.calls[0][0].select.passwordHash).toBeUndefined();
  });
});
