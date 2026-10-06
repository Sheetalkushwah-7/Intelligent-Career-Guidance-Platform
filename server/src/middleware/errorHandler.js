/**
 * Application HTTP error with a status code.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Express 4-arg error middleware. Always returns { success: false, error }.
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('[Internal Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
