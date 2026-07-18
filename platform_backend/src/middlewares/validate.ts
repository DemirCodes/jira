/**
 * INPUT VALIDATION MIDDLEWARE
 * 
 * Gelen request body'yi Zod schema ile doğrular
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendError } from '../utils/response';
import { log } from '../utils/logger';

// Validation source'ları tanımlayalım
type ValidationSource = 'body' | 'query' | 'params' | 'headers';

interface ValidationConfig {
    source: ValidationSource;
    schema: ZodSchema;
}

export const validate = (...configs: ValidationConfig[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Tüm kaynakları kontrol et
        for (const config of configs) {
            let dataToValidate;
            
            switch (config.source) {
                case 'body':
                    dataToValidate = req.body;
                    break;
                case 'query':
                    dataToValidate = req.query;
                    break;
                case 'params':
                    dataToValidate = req.params;
                    break;
                case 'headers':
                    dataToValidate = req.headers;
                    break;
                default:
                    continue;
            }

            try {
                // Zod parse işlemi - parse edilmiş veriyi al
                const parsedData = config.schema.parse(dataToValidate);
                
                // Parse edilmiş veriyi req objesine geri yaz
                switch (config.source) {
                    case 'body':
                        req.body = parsedData;
                        break;
                    case 'query':
                        req.query = parsedData as any;
                        break;
                    case 'params':
                        req.params = parsedData as any;
                        break;
                    case 'headers':
                        // Headers için özel işlem gerekebilir
                        break;
                }
                
            } catch (error) {
                if (error instanceof z.ZodError) {
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
                return;
            }
        }
        
        next();
    };
};