import { Response } from 'express';
import { AppError } from './errorCodes';
export interface ApiMeta {
    requestId?: string;
    timestamp: string;
    path: string;
    message?: string;
    page?: number;
    limit?: number;
    total?: number;
    duration?: number;
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
export declare const sendSuccess: <T>(res: Response, data: T, statusCode?: number, message?: string) => Response;
export declare const sendError: (res: Response, error: AppError | string, customMessage?: string, customStatusCode?: number, details?: unknown) => Response;
export declare const sendPaginated: <T>(res: Response, items: T[], total: number, page: number, limit: number) => Response;
export declare const sendValidationError: (res: Response, errors: Record<string, string[]>) => Response;
export declare const sendNotFound: (res: Response, resource: string) => Response;
//# sourceMappingURL=response.d.ts.map