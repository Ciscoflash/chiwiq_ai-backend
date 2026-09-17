import { Response } from 'express';

class ErrorResponse {
  constructor(
    res: Response,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
  ) {
    res.status(statusCode).json({
      success: false,
      message,
      statusCode,
      ...(details && Object.keys(details).length > 0
        ? { errors: details }
        : {}),
    });
  }
}

export default ErrorResponse;
