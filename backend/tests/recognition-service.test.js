jest.mock('axios', () => ({
  post: jest.fn(),
  isAxiosError: (error) => Boolean(error && error.isAxiosError),
}));

const axios = require('axios');
const { recognizeStaticSign } = require('../src/modules/recognition/recognition.service');

const modelResponse = {
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

describe('Recognition service proxy', () => {
  beforeEach(() => axios.post.mockReset());

  it('forwards the image to the configured model service with a timeout', async () => {
    axios.post.mockResolvedValue({ data: modelResponse });

    await expect(recognizeStaticSign('aGVsbG8=')).resolves.toEqual(modelResponse);
    expect(axios.post.mock.calls[0][0]).toMatch(/\/v1\/predict$/);
    expect(axios.post.mock.calls[0][1]).toEqual({ imageBase64: 'aGVsbG8=' });
    expect(axios.post.mock.calls[0][2].timeout).toBe(10000);
  });

  it('reports recognition timeouts explicitly', async () => {
    const timeout = Object.assign(new Error('timeout'), {
      isAxiosError: true,
      code: 'ECONNABORTED',
    });
    axios.post.mockRejectedValue(timeout);

    await expect(recognizeStaticSign('aGVsbG8='))
      .rejects.toMatchObject({ statusCode: 504 });
  });

  it('reports unavailable inference service explicitly', async () => {
    const unavailable = Object.assign(new Error('offline'), {
      isAxiosError: true,
      code: 'ECONNREFUSED',
    });
    axios.post.mockRejectedValue(unavailable);

    await expect(recognizeStaticSign('aGVsbG8='))
      .rejects.toMatchObject({ statusCode: 503 });
  });

  it('rejects invalid inference-service response shapes', async () => {
    axios.post.mockResolvedValue({ data: { prediction: 'made up' } });

    await expect(recognizeStaticSign('aGVsbG8='))
      .rejects.toMatchObject({ statusCode: 502 });
  });

  it('passes through an uncertain no-hand result without accepting its classifier candidate', async () => {
    const uncertainNoHand = {
      ...modelResponse,
      status: 'uncertain',
      prediction: null,
      candidate: 'X',
      confidence: 0.978,
      topCandidates: [{ label: 'X', confidence: 0.978 }],
      handDetected: false,
    };
    axios.post.mockResolvedValue({ data: uncertainNoHand });

    await expect(recognizeStaticSign('aGVsbG8=')).resolves.toEqual(uncertainNoHand);
  });

  it('passes through no-sign responses for frames classified as NOTHING', async () => {
    const noSign = {
      ...modelResponse,
      status: 'no_sign',
      prediction: 'NOTHING',
      candidate: 'NOTHING',
      confidence: 0.99,
      topCandidates: [{ label: 'NOTHING', confidence: 0.99 }],
      handDetected: false,
    };
    axios.post.mockResolvedValue({ data: noSign });

    await expect(recognizeStaticSign('aGVsbG8=')).resolves.toEqual(noSign);
  });

  it('rejects empty candidates when the hand detector says a hand is present', async () => {
    axios.post.mockResolvedValue({
      data: { ...modelResponse, topCandidates: [] },
    });

    await expect(recognizeStaticSign('aGVsbG8='))
      .rejects.toMatchObject({ statusCode: 502 });
  });
});
