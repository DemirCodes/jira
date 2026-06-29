"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSecurity = void 0;
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const setupSecurity = (app) => {
    // Helmet ile CSP başlıkları
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
            },
        },
    }));
    // CORS
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',');
    app.use((0, cors_1.default)({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    // Rate limiting header'ları
    app.use((req, res, next) => {
        res.setHeader('X-RateLimit-Limit', process.env.RATE_LIMIT_MAX_REQUESTS || '100');
        res.setHeader('X-RateLimit-Window', process.env.RATE_LIMIT_WINDOW_MS || '900000');
        next();
    });
};
exports.setupSecurity = setupSecurity;
//# sourceMappingURL=security.js.map