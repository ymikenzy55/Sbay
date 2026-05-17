/**
 * Wraps an async route handler so any rejection is forwarded to
 * Express's error middleware without us having to repeat try/catch
 * everywhere. Saves a lot of noise.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
