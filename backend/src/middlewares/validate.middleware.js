
const ApiError = require('../utils/ApiError');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const payload = req[source];
    const result = schema.safeParse(payload);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      return next(new ApiError(400, 'Validation failed.', details));
    }

    req[source] = result.data;
    return next();
  };
}

module.exports = validate;
