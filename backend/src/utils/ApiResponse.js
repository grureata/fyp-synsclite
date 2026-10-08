
class ApiResponse {
  static success(res, data, message = 'Request successful', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
    });
  }

  static error(res, statusCode, message, details = null) {
    return res.status(statusCode).json({
      success: false,
      data: null,
      message,
      details,
    });
  }
}

module.exports = ApiResponse;
