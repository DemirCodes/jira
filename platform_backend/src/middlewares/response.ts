import { Response } from 'express';
import { AppError } from '../utils/errorCodes';

// ─── TİPLER ───────────────────────────────────────────────────────────────────

export interface ApiMeta {
    requestId?: string;
    timestamp: string;
    path: string;
    message?: string;
    page?: number;
    limit?: number;
    total?: number;
    duration?: number; // optional
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta: ApiMeta;
}

export interface PaginatedData<T> {
    items: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ─── GÜVENLİK ─────────────────────────────────────────────────────────────────

const sanitizeErrorDetails = (details: unknown): unknown => {
    if (process.env.NODE_ENV !== 'production') return details;
    if (!details) return undefined;
    
    try {
        const SENSITIVE = new Set(['stack', 'password', 'token', 'secret', 'authorization']);
        
        if (details instanceof Error) {
            return { message: details.message };
        }
        
        if (typeof details === 'object') {
            return Object.fromEntries(
                Object.entries(details as Record<string, unknown>)
                    .filter(([k]) => !SENSITIVE.has(k.toLowerCase()))
            );
        }
        
        return undefined;
    } catch {
        return undefined;
    }
};

// ─── YARDIMCI ─────────────────────────────────────────────────────────────────

const buildMeta = (res: Response, extra?: Partial<ApiMeta>): ApiMeta => ({
    requestId: (res.req as any).id,
    timestamp: new Date().toISOString(),
    path: res.req.path,
    ...extra,
});

// ─── RESPONSE FONKSİYONLARI ───────────────────────────────────────────────────

export const sendSuccess = <T>(
    res: Response,
    data: T,
    statusCode = 200,
    message?: string,
): Response => {
    const body: ApiResponse<T> = {
        success: true,
        data,
        meta: buildMeta(res, message ? { message } : undefined),
    };
    return res.status(statusCode).json(body);
};

// GELİŞTİRİLMİŞ HATA YANITI - AppError destekli
export const sendError = (
    res: Response,
    error: AppError | string,
    customMessage?: string,
    customStatusCode?: number,
    details?: unknown,
): Response => {
    let errorCode: string;
    let message: string;
    let statusCode: number;
    let errorDetails: unknown = details;

    if (typeof error === 'string') {
        errorCode = error;
        message = customMessage || error;
        statusCode = customStatusCode || 400;
    } else {
        errorCode = error.errorCode;
        message = customMessage || error.message;
        statusCode = customStatusCode || error.statusCode;
        errorDetails = errorDetails || error;
    }

    const body: ApiResponse = {
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

export const sendPaginated = <T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number,
): Response => {
    const body: ApiResponse<PaginatedData<T>> = {
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

// YENİ: Validation helper'ı
export const sendValidationError = (
    res: Response,
    errors: Record<string, string[]>,
): Response => {
    return sendError(
        res,
        'VALIDATION_FAILED',
        'Validation failed',
        422,
        { errors }
    );
};

// YENİ: 404 helper'ı
export const sendNotFound = (
    res: Response,
    resource: string,
): Response => {
    return sendError(
        res,
        'NOT_FOUND',
        `${resource} not found`,
        404
    );
};