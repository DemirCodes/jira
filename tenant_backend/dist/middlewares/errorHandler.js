"use strict";
/**
 * GLOBAL ERROR HANDLER MIDDLEWARE
 *
 * Express route ve middleware'lerinden gelen hataları tek formatta döndürür.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorCodes_1 = require("../utils/errorCodes");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const isDatabaseError = (error) => {
    return error instanceof Error && 'code' in error;
};
const getRequestMeta = (req) => ({
    method: req.method,
    path: req.originalUrl || req.path,
    ip: req.ip,
    userId: req.userId,
});
const errorHandler = (error, req, res, _next) => {
    if (res.headersSent) {
        return;
    }
    if ((0, errorCodes_1.isAppError)(error)) {
        logger_1.log.warn(error.message, {
            ...getRequestMeta(req),
            errorCode: error.errorCode,
            statusCode: error.statusCode,
        });
        return (0, response_1.sendError)(res, error.errorCode, error.message, error.statusCode);
    }
    if (error instanceof zod_1.ZodError) {
        const details = error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));
        logger_1.log.debug('Validation failed', {
            ...getRequestMeta(req),
            details,
        });
        return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.VALIDATION_FAILED, 'Validation failed', 400, details);
    }
    if (error instanceof SyntaxError && 'body' in error) {
        logger_1.log.warn('Invalid JSON payload', getRequestMeta(req));
        return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.VALIDATION_FAILED, 'Invalid JSON payload', 400);
    }
    if (isDatabaseError(error)) {
        logger_1.log.error(error.message, {
            ...getRequestMeta(req),
            stack: error.stack,
            dbCode: error.code,
            constraint: error.constraint,
            detail: error.detail,
        });
        if (error.code === '23505') {
            return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.DB_UNIQUE_VIOLATION, 'Resource already exists', 409);
        }
        if (error.code === '23503') {
            return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.DB_FOREIGN_KEY_VIOLATION, 'Related resource not found', 409);
        }
        return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.DB_QUERY_FAILED, 'Database query failed', 500);
    }
    if (error instanceof Error) {
        logger_1.log.error(error.message, {
            ...getRequestMeta(req),
            stack: error.stack,
        });
    }
    else {
        logger_1.log.error('Unknown error', {
            ...getRequestMeta(req),
            error,
        });
    }
    return (0, response_1.sendError)(res, errorCodes_1.ErrorCodes.DB_QUERY_FAILED, process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
            ? error.message
            : 'Unknown error', 500);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map