"use strict";
/**
 * INPUT VALIDATION MIDDLEWARE
 *
 * Gelen request body'yi Zod schema ile doğrular
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                logger_1.log.debug(`Validation failed: ${req.path}`, { errors });
                (0, response_1.sendError)(res, '700-001-001', 'Validation failed', 400, errors);
                return;
            }
            (0, response_1.sendError)(res, '700-001-001', 'Invalid request', 400);
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map