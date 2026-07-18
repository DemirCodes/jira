/**
 * GLOBAL ERROR HANDLER MIDDLEWARE
 *
 * Express route ve middleware'lerinden gelen hataları tek formatta döndürür.
 */

import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { isAppError, ErrorCodes } from '../utils/errorCodes';
import { sendError } from '../utils/response';
import { log } from '../utils/logger';

interface DatabaseError extends Error {
    code?: string;
    detail?: string;
    constraint?: string;
}

const isDatabaseError = (error: unknown): error is DatabaseError => {
    return error instanceof Error && 'code' in error;
};

const getRequestMeta = (req: Request): Record<string, unknown> => ({
    method: req.method,
    path: req.originalUrl || req.path,
    ip: req.ip,
    userId: (req as { userId?: unknown }).userId,
});

export const errorHandler = (
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
): Response | void => {
    if (res.headersSent) {
        return;
    }

    if (isAppError(error)) {
        log.warn(error.message, {
            ...getRequestMeta(req),
            errorCode: error.errorCode,
            statusCode: error.statusCode,
        });

        return sendError(
            res,
            error.errorCode,
            error.message,
            error.statusCode
        );
    }

    if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));

        log.debug('Validation failed', {
            ...getRequestMeta(req),
            details,
        });

        return sendError(
            res,
            ErrorCodes.VALIDATION_FAILED,
            'Validation failed',
            400,
            details
        );
    }

    if (error instanceof SyntaxError && 'body' in error) {
        log.warn('Invalid JSON payload', getRequestMeta(req));

        return sendError(
            res,
            ErrorCodes.VALIDATION_FAILED,
            'Invalid JSON payload',
            400
        );
    }

    if (isDatabaseError(error)) {
        log.error(error.message, {
            ...getRequestMeta(req),
            stack: error.stack,
            dbCode: error.code,
            constraint: error.constraint,
            detail: error.detail,
        });

        if (error.code === '23505') {
            return sendError(
                res,
                ErrorCodes.DB_UNIQUE_VIOLATION,
                'Resource already exists',
                409
            );
        }

        if (error.code === '23503') {
            return sendError(
                res,
                ErrorCodes.DB_FOREIGN_KEY_VIOLATION,
                'Related resource not found',
                409
            );
        }

        return sendError(
            res,
            ErrorCodes.DB_QUERY_FAILED,
            'Database query failed',
            500
        );
    }

    if (error instanceof Error) {
        log.error(error.message, {
            ...getRequestMeta(req),
            stack: error.stack,
        });
    } else {
        log.error('Unknown error', {
            ...getRequestMeta(req),
            error,
        });
    }

    return sendError(
        res,
        ErrorCodes.DB_QUERY_FAILED,
        process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error instanceof Error
                ? error.message
                : 'Unknown error',
        500
    );
};
