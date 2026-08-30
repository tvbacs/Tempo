/**
 * Standard API Response Utilities for Tempo Project
 * Strictly follows STANDARDS.md
 */

const successResponse = (res, data, message = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

const errorResponse = (res, code, message, statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
