import { HttpError } from '../utils/httpError.js';
import { isProd } from '../config/env.js';

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'Route not found'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Mongoose validation errors → 400 with field details
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, v.message])
      ),
    });
  }

  // Duplicate key (e.g. email already in use)
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate value',
      details: err.keyValue,
    });
  }

  // CastError (malformed ObjectId in path)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid identifier' });
  }

  const status = err.status || 500;
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
    ...(isProd || status < 500 ? {} : { stack: err.stack }),
  });
}
