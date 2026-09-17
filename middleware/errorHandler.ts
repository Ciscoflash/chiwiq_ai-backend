import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ErrorResponse from '../utils/ErrorResponse';
import AppError from '../utils/AppError';

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

const notFound = (req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(`Route not found - ${req.originalUrl}`, 404));
};

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error: AppError =
    err instanceof AppError
      ? err
      : new AppError(err.message || 'Server Error', 500);

  const mongoError = err as MongoError;

  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${(err as mongoose.Error.CastError).value}`;
    error = new AppError(message, 404);
  }

  if (mongoError.code === 11000) {
    const field = Object.keys(mongoError.keyValue || {})[0];
    const message = `Duplicate field value: ${field}. Please enter a unique value.`;
    error = new AppError(message, 400);
  }

  if (err.name === 'ValidationError') {
    const errors = (err as mongoose.Error.ValidationError).errors;
    const message = Object.values(errors).map((val) => val.message).join(', ');
    error = new AppError(message, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please log in again.', 401);
  }

  console.error(err.stack);

  return new ErrorResponse(
    res,
    error.message || 'Server Error',
    error.statusCode || 500,
  );
};

export { notFound, errorHandler };