class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
