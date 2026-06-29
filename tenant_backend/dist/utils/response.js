"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotFound = exports.sendValidationError = exports.sendPaginated = exports.sendError = exports.sendSuccess = void 0;
// ─── GÜVENLİK ─────────────────────────────────────────────────────────────────
const sanitizeErrorDetails = (details) => {
    if (process.env.NODE_ENV !== 'production')
        return details;
    if (!details)
        return undefined;
    try {
        const SENSITIVE = new Set(['stack', 'password', 'token', 'secret', 'authorization']);
        if (details instanceof Error) {
            return { message: details.message };
        }
        if (typeof details === 'object') {
            return Object.fromEntries(Object.entries(details)
                .filter(([k]) => !SENSITIVE.has(k.toLowerCase())));
        }
        return undefined;
    }
    catch {
        return undefined;
    }
};
// ─── YARDIMCI ─────────────────────────────────────────────────────────────────
const buildMeta = (res, extra) => ({
    requestId: res.req.id,
    timestamp: new Date().toISOString(),
    path: res.req.path,
    ...extra,
});
// ─── RESPONSE FONKSİYONLARI ───────────────────────────────────────────────────
const sendSuccess = (res, data, statusCode = 200, message) => {
    const body = {
        success: true,
        data,
        meta: buildMeta(res, message ? { message } : undefined),
    };
    return res.status(statusCode).json(body);
};
exports.sendSuccess = sendSuccess;
// GELİŞTİRİLMİŞ HATA YANITI - AppError destekli
const sendError = (res, error, customMessage, customStatusCode, details) => {
    let errorCode;
    let message;
    let statusCode;
    let errorDetails = details;
    if (typeof error === 'string') {
        errorCode = error;
        message = customMessage || error;
        statusCode = customStatusCode || 400;
    }
    else {
        errorCode = error.errorCode;
        message = customMessage || error.message;
        statusCode = customStatusCode || error.statusCode;
        errorDetails = errorDetails || error;
    }
    const body = {
        success: false,
        error: {
            code: errorCode,
            message,
            details: sanitizeErrorDetails(errorDetails),
        },
        meta: buildMeta(res),
    };
    return res.status(statusCode).json(body);
};
exports.sendError = sendError;
const sendPaginated = (res, items, total, page, limit) => {
    const body = {
        success: true,
        data: {
            items,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        meta: buildMeta(res),
    };
    return res.status(200).json(body);
};
exports.sendPaginated = sendPaginated;
// YENİ: Validation helper'ı
const sendValidationError = (res, errors) => {
    return (0, exports.sendError)(res, 'VALIDATION_FAILED', 'Validation failed', 422, { errors });
};
exports.sendValidationError = sendValidationError;
// YENİ: 404 helper'ı
const sendNotFound = (res, resource) => {
    return (0, exports.sendError)(res, 'NOT_FOUND', `${resource} not found`, 404);
};
exports.sendNotFound = sendNotFound;
//# sourceMappingURL=response.js.map