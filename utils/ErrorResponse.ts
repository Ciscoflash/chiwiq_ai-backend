import { Response } from 'express';

class ErrorResponse {
  constructor(res: Response, message: string, statusCode: number = 500) {
    res.status(statusCode).json({
      success: false,
      message,
      statusCode,
    });
  }
}

export default ErrorResponse;