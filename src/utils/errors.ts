export class AppError extends Error {
  statusCode: number;
  error: string;
  details?: Record<string, string>;

  constructor(
    statusCode: number,
    error: string,
    message: string,
    details?: Record<string, string>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
  }
}
