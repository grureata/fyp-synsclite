
const swaggerJSDoc = require('swagger-jsdoc');

const protectedRoutes = [
  ['/auth/logout', 'post', 'Clear the authentication cookie.'],
  ['/auth/me', 'get', 'Get the current account.'],
  ['/users', 'get', 'List non-sensitive user profile fields (administrator only).'],
  ['/calibration/me', 'get', 'Get the current account calibration profile.'],
  ['/calibration', 'post', 'Create or update the current account calibration profile.'],
  ['/calibration', 'delete', 'Delete the current account calibration profile.'],
  ['/context-presets', 'get', 'List configured context presets.'],
  ['/context-presets', 'post', 'Create a context preset (administrator only).'],
  ['/sessions', 'get', 'List the current account sessions.'],
  ['/sessions', 'post', 'Create a session for the current account.'],
  ['/sessions/{id}', 'get', 'Get a session owned by the current account.'],
  ['/sessions/{id}', 'delete', 'Delete a session owned by the current account.'],
  ['/sessions/{id}/end', 'patch', 'End a session owned by the current account.'],
  ['/sessions/{id}/records', 'post', 'Add a validated translation record to an owned session.'],
  ['/dashboard/summary', 'get', 'Get dashboard aggregates for the current account.'],
  ['/dashboard/system-health', 'get', 'Check database and inference-service availability.'],
  ['/dashboard/records', 'get', 'List translation records for the current account.'],
  ['/dashboard/records/export', 'get', 'Export current-account translation records as CSV.'],
  ['/content/{slug}', 'put', 'Create or update a legal document (administrator only).'],
  ['/recognition/predict', 'post', 'Classify one static ASL fingerspelled frame with the trained recognition model.'],
];

const publicRoutes = [
  ['/health', 'get', 'Check database readiness.'],
  ['/auth/register', 'post', 'Register a public user account.'],
  ['/auth/login', 'post', 'Sign in and set the HttpOnly authentication cookie.'],
  ['/contact', 'post', 'Submit a contact message.'],
  ['/content/{slug}', 'get', 'Retrieve a legal document.'],
];

const routePaths = {};
for (const [path, method, summary] of [...publicRoutes, ...protectedRoutes]) {
  routePaths[path] ||= {};
  routePaths[path][method] = {
    summary,
    responses: {
      200: { description: 'Request completed successfully.' },
      400: { description: 'Invalid request data.' },
      401: { description: 'Authentication required or token invalid.' },
      403: { description: 'Insufficient privileges.' },
      404: { description: 'Requested resource not found.' },
      500: { description: 'Unexpected server error.' },
    },
    ...(
      protectedRoutes.some((route) => route[0] === path && route[1] === method)
        ? { security: [{ bearerAuth: [] }, { authCookie: [] }] }
        : {}
    ),
  };
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SignSync Lite API',
      version: '1.0.0',
      description: 'API for SignSync Lite backend',
    },
    servers: [{ url: '/api/v1' }],
    paths: routePaths,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        authCookie: { type: 'apiKey', in: 'cookie', name: 'token' },
      },
    },
  },
  apis: ['./src/modules/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerSpec };
