
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const { env } = require('./config/env');
const db = require('./config/db');
const { swaggerSpec } = require('./config/swagger');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const calibrationRoutes = require('./modules/calibration/calibration.routes');
const contextPresetRoutes = require('./modules/contextPresets/contextPreset.routes');
const sessionRoutes = require('./modules/sessions/session.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const contactRoutes = require('./modules/contact/contact.routes');
const contentRoutes = require('./modules/content/content.routes');
const recognitionRoutes = require('./modules/recognition/recognition.routes');
const { notFound } = require('./middlewares/notFound.middleware');
const { errorHandler } = require('./middlewares/errorHandler.middleware');
const { defaultRateLimiter } = require('./middlewares/rateLimiter.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(compression());
app.use(morgan(':method :status :response-time ms'));
app.use(cookieParser());
app.use(express.json({ limit: '3mb' }));
app.use('/api/v1', defaultRateLimiter);

app.get('/api/v1/health', async (req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    return res.json({ status: 'ok', uptime: process.uptime() });
  } catch (error) {
    return res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/calibration', calibrationRoutes);
app.use('/api/v1/context-presets', contextPresetRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/recognition', recognitionRoutes);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(notFound);
app.use(errorHandler);

module.exports = { app, createApp: () => app };
