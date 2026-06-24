/**
 * Application errors that carry the HTTP status the API layer should return.
 * Services throw these; the route-level handler (see lib/api/handler.ts)
 * translates them into JSON responses. This keeps services free of any
 * HTTP/Next.js concerns while still controlling status codes.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Invalid request.", details?: unknown) {
    super(400, message, details);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Resource not found.") {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Resource already exists.") {
    super(409, message);
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

/** True for a Prisma unique-constraint violation (P2002). */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}
