/**
 * GLOBAL ERROR HANDLER MIDDLEWARE
 *
 * Express route ve middleware'lerinden gelen hataları tek formatta döndürür.
 */
import { NextFunction, Request, Response } from 'express';
export declare const errorHandler: (error: unknown, req: Request, res: Response, _next: NextFunction) => Response | void;
//# sourceMappingURL=errorHandler.d.ts.map