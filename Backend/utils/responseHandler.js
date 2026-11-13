/**
 * Standardized API Response Helpers
 */

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    code: statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    code: statusCode,
    message,
    timestamp: new Date().toISOString(),
  };
  if (errors !== null && errors !== undefined) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};

export default {
  sendSuccess,
  sendError,
};
