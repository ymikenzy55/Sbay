import { validationResult } from 'express-validator';
import { HttpError } from '../utils/httpError.js';

/**
 * Run after a chain of `express-validator` checks. If any failed,
 * convert them into a 400 HttpError instead of forcing every controller
 * to inspect the validation result manually.
 */
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = {};
  for (const e of result.array()) {
    if (!details[e.path]) details[e.path] = e.msg;
  }
  next(new HttpError(400, 'Validation failed', details));
}
