"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendError = exports.sendSuccessWithMessage = exports.sendSuccess = void 0;
const sendSuccess = (res, data, statusCode = 200) => {
    const response = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            path: res.req?.path,
        },
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendSuccessWithMessage = (res, data, message, statusCode = 200) => {
    const response = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            path: res.req?.path,
            message,
        },
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccessWithMessage = sendSuccessWithMessage;
const sendError = (res, errorCode, message, statusCode = 400, details) => {
    const response = {
        success: false,
        error: {
            code: errorCode,
            message,
            details,
        },
        meta: {
            timestamp: new Date().toISOString(),
            path: res.req?.path,
        },
    };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
const sendPaginated = (res, data, total, page, limit) => {
    const response = {
        success: true,
        data,
        meta: {
            page,
            limit,
            total,
            timestamp: new Date().toISOString(),
            path: res.req?.path,
        },
    };
    return res.status(200).json(response);
};
exports.sendPaginated = sendPaginated;
//# sourceMappingURL=response.js.map