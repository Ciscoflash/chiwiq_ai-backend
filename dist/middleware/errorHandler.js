"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const ErrorResponse_1 = __importDefault(require("../utils/ErrorResponse"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const notFound = (req, res, next) => {
    next(new AppError_1.default(`Route not found - ${req.originalUrl}`, 404));
};
exports.notFound = notFound;
const errorHandler = (err, req, res, next) => {
    let error = err instanceof AppError_1.default
        ? err
        : new AppError_1.default(err.message || 'Server Error', 500);
    const mongoError = err;
    if (err.name === 'CastError') {
        const message = `Resource not found with id: ${err.value}`;
        error = new AppError_1.default(message, 404);
    }
    if (mongoError.code === 11000) {
        const field = Object.keys(mongoError.keyValue || {})[0];
        const message = `Duplicate field value: ${field}. Please enter a unique value.`;
        error = new AppError_1.default(message, 400);
    }
    if (err.name === 'ValidationError') {
        const errors = err.errors;
        const message = Object.values(errors).map((val) => val.message).join(', ');
        error = new AppError_1.default(message, 400);
    }
    if (err.name === 'JsonWebTokenError') {
        error = new AppError_1.default('Invalid token. Please log in again.', 401);
    }
    if (err.name === 'TokenExpiredError') {
        error = new AppError_1.default('Token expired. Please log in again.', 401);
    }
    console.error(err.stack);
    return new ErrorResponse_1.default(res, error.message || 'Server Error', error.statusCode || 500);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map