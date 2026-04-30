import { Response } from 'express';
export declare const sendSuccess: (res: Response, data: unknown, statusCode?: number) => Response;
export declare const sendSuccessWithMessage: (res: Response, data: unknown, message: string, statusCode?: number) => Response;
export declare const sendError: (res: Response, errorCode: string, message: string, statusCode?: number, details?: unknown) => Response;
export declare const sendPaginated: (res: Response, data: unknown[], total: number, page: number, limit: number) => Response;
//# sourceMappingURL=response.d.ts.map