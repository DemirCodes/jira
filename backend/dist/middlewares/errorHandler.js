"use strict";
/**
 * GLOBAL ERROR HANDLER MIDDLEWARE
 *
 * Express route ve middleware'lerinden gelen hataları tek formatta döndürür.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
var zod_1 = require("zod");
var errorCodes_1 = require("../utils/errorCodes");
var response_1 = require("../utils/response");
var logger_1 = require("../utils/logger");
var isDatabaseError = function (error) {
    return error instanceof Error && 'code' in error;
};
var getRequestMeta = function (req) { return ({
    method: req.method,
    path: req.originalUrl || req.path,
    ip: req.ip,
    userId: req.userId,
}); };
var errorHandler = function (error, req, res, _next) {
    if (res.headersSent) {
        return;
    }
    if ((0, errorCodes_1.isAppError)(error)) {
        logger_1.log.warn(error.message, __assign(__assign({}, getRequestMeta(req)), { errorCode: error.errorCode, statusCode: error.statusCode }));
        return (0, response_1.sendError)(res, error.errorCode, error.message, error.statusCode);
    }
    if (error instanceof zod_1.ZodError) {
        var details = error.issues.map(function (issue) { return ({
            field: issue.path.join('.'),
            message: issue.message,
        }); });
        logger_1.log.debug('Validation failed', __assign(__assign({}, getRequestMeta(req)), { details: details }));
        return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.VALIDATION_FAILED, 'Validation failed', 400, details);
    }
    if (error instanceof SyntaxError && 'body' in error) {
        logger_1.log.warn('Invalid JSON payload', getRequestMeta(req));
        return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.VALIDATION_FAILED, 'Invalid JSON payload', 400);
    }
    if (isDatabaseError(error)) {
        logger_1.log.error(error.message, __assign(__assign({}, getRequestMeta(req)), { stack: error.stack, dbCode: error.code, constraint: error.constraint, detail: error.detail }));
        if (error.code === '23505') {
            return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.DB_UNIQUE_VIOLATION, 'Resource already exists', 409);
        }
        if (error.code === '23503') {
            return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.DB_FOREIGN_KEY_VIOLATION, 'Related resource not found', 409);
        }
        return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Database query failed', 500);
    }
    if (error instanceof Error) {
        logger_1.log.error(error.message, __assign(__assign({}, getRequestMeta(req)), { stack: error.stack }));
    }
    else {
        logger_1.log.error('Unknown error', __assign(__assign({}, getRequestMeta(req)), { error: error }));
    }
    return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.DB_QUERY_FAILED, process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
            ? error.message
            : 'Unknown error', 500);
};
exports.errorHandler = errorHandler;
