import { Response } from 'express';

interface ApiResponse {
    success: boolean;
    data?: unknown;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        timestamp: string;
        path?: string;
        message?: string;
    };
}

export const sendSuccess = (
    res: Response,
    data: unknown,
    statusCode: number = 200
): Response => {
    const response: ApiResponse = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            path: res.req?.path,
        },
    };
    
    return res.status(statusCode).json(response);
};

export const sendSuccessWithMessage = (
    res: Response,
    data: unknown,
    message: string,
    statusCode: number = 200
): Response => {
    const response: ApiResponse = {
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

export const sendError = (
    res: Response,
    errorCode: string,
    message: string,
    statusCode: number = 400,
    details?: unknown
): Response => {
    const response: ApiResponse = {
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

export const sendPaginated = (
    res: Response,
    data: unknown[],
    total: number,
    page: number,
    limit: number
): Response => {
    const response: ApiResponse = {
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