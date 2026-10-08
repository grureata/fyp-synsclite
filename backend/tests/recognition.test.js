const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {},
    calibrationProfile: {},
    contextPreset: {},
    translationSession: {},
    translationRecord: {},
    contactMessage: {},
    contentDocument: {},
  })),
}));

jest.mock('../src/modules/recognition/recognition.service', () => ({
  recognizeStaticSign: jest.fn(),
}));

const { app } = require('../src/app');
const { recognizeStaticSign } = require('../src/modules/recognition/recognition.service');

const token = () => jwt.sign(
  { id: 'user-1', role: 'DEAF_USER' },
  process.env.JWT_SECRET || 'test-secret'
);

beforeEach(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  recognizeStaticSign.mockReset();
});

describe('Static sign recognition API', () => {
  it('requires authentication', async () => {
    const response = await request(app)
      .post('/api/v1/recognition/predict')
      .send({ imageBase64: 'aGVsbG8=' });

    expect(response.status).toBe(401);
    expect(recognizeStaticSign).not.toHaveBeenCalled();
  });

  it('rejects malformed image data before calling the inference service', async () => {
    const response = await request(app)
      .post('/api/v1/recognition/predict')
      .set('Authorization', `Bearer ${token()}`)
      .send({ imageBase64: 'not base64!' });

    expect(response.status).toBe(400);
    expect(recognizeStaticSign).not.toHaveBeenCalled();
  });

  it('returns a validated model prediction from the inference service', async () => {
    const prediction = {
      status: 'recognized',
      prediction: 'A',
      candidate: 'A',
      confidence: 0.97,
      minimumConfidence: 0.84,
      topCandidates: [{ label: 'A', confidence: 0.97 }],
      handDetected: true,
      modelVersion: 'asl-static-fingerspelling-mobilenetv3-small-scratch-v1',
      handDetectorVersion: 'mediapipe-hand-landmarker-full-v1',
      latencyMs: 13.2,
      scope: 'single static ASL fingerspelled handshape',
    };
    recognizeStaticSign.mockResolvedValue(prediction);

    const response = await request(app)
      .post('/api/v1/recognition/predict')
      .set('Authorization', `Bearer ${token()}`)
      .send({ imageBase64: 'aGVsbG8=' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(prediction);
    expect(recognizeStaticSign).toHaveBeenCalledWith('aGVsbG8=');
  });
});
