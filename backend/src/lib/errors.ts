export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  BadRequest: (msg = "Bad request") => new AppError(400, msg, "BAD_REQUEST"),
  Unauthorized: (msg = "Unauthorized") => new AppError(401, msg, "UNAUTHORIZED"),
  Forbidden: (msg = "Forbidden") => new AppError(403, msg, "FORBIDDEN"),
  NotFound: (msg = "Not found") => new AppError(404, msg, "NOT_FOUND"),
  Conflict: (msg = "Conflict") => new AppError(409, msg, "CONFLICT"),
  Internal: (msg = "Internal server error") => new AppError(500, msg, "INTERNAL"),
};