/**
 * Throwable HTTP error.
 *
 * Controllers `throw new HttpError(404, 'Product not found')` and the
 * central error middleware turns it into a JSON response with the right
 * status. Anything that isn't an HttpError is treated as a 500.
 */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
