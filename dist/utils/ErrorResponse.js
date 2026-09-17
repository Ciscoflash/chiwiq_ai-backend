"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ErrorResponse {
    constructor(res, message, statusCode = 500) {
        res.status(statusCode).json({
            success: false,
            message,
            statusCode,
        });
    }
}
exports.default = ErrorResponse;
//# sourceMappingURL=ErrorResponse.js.map