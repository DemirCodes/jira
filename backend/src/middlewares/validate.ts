/**
 * INPUT VALIDATION MIDDLEWARE
 * 
 * Gelen request body'yi Zod schema ile doğrular
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { sendError } from '../utils/response';
import { log } from '../utils/logger';

// Zod v4 için daha geniş tip
type ValidationSchema = z.ZodSchema<any>;

export const validate = (schema: ValidationSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                
                log.debug(`Validation failed: ${req.path}`, { errors });
                
                sendError(
                    res,
                    '700-001-001',
                    'Validation failed',
                    400,
                    errors
                );
                return;
            }
            
            sendError(
                res,
                '700-001-001',
                'Invalid request',
                400
            );
        }
    };
};