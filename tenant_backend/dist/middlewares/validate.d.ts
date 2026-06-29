/**
 * INPUT VALIDATION MIDDLEWARE
 *
 * Gelen request body'yi Zod schema ile doğrular
 */
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
type ValidationSchema = z.ZodSchema<any>;
export declare const validate: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validate.d.ts.map