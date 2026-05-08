"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendError = exports.sendSuccessWithMessage = exports.sendSuccess = void 0;
var sendSuccess = function (res, data, statusCode) {
    var _a;
    if (statusCode === void 0) { statusCode = 200; }
    var response = {
        success: true,
        data: data,
        meta: {
            timestamp: new Date().toISOString(),
            path: (_a = res.req) === null || _a === void 0 ? void 0 : _a.path,
        },
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
var sendSuccessWithMessage = function (res, data, message, statusCode) {
    var _a;
    if (statusCode === void 0) { statusCode = 200; }
    var response = {
        success: true,
        data: data,
        meta: {
            timestamp: new Date().toISOString(),
            path: (_a = res.req) === null || _a === void 0 ? void 0 : _a.path,
            message: message,
        },
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccessWithMessage = sendSuccessWithMessage;
var sendError = function (res, errorCode, message, statusCode, details) {
    var _a;
    if (statusCode === void 0) { statusCode = 400; }
    var response = {
        success: false,
        error: {
            code: errorCode,
            message: message,
            details: details,
        },
        meta: {
            timestamp: new Date().toISOString(),
            path: (_a = res.req) === null || _a === void 0 ? void 0 : _a.path,
        },
    };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
var sendPaginated = function (res, data, total, page, limit) {
    var _a;
    var response = {
        success: true,
        data: data,
        meta: {
            page: page,
            limit: limit,
            total: total,
            timestamp: new Date().toISOString(),
            path: (_a = res.req) === null || _a === void 0 ? void 0 : _a.path,
        },
    };
    return res.status(200).json(response);
};
exports.sendPaginated = sendPaginated;
