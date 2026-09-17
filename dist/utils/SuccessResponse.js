"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SuccessResponse {
    constructor(res, message, data = null, statusCode = 200) {
        const response = {
            success: true,
            message,
            statusCode,
        };
        if (data !== null && data !== undefined) {
            const isPaginated = Array.isArray(data.items) &&
                typeof data.meta === 'object';
            if (isPaginated) {
                response.meta = data.meta;
                response.data = data.items;
            }
            else {
                response.data = data;
            }
        }
        res.status(statusCode).json(response);
    }
}
exports.default = SuccessResponse;
//# sourceMappingURL=SuccessResponse.js.map