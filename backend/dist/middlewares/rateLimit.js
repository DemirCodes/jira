"use strict";
/**
 * RATE LIMITING MIDDLEWARE
 *
 * DoS saldırılarını engellemek için istek sınırlandırması yapar
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.apiLimiter = void 0;
var express_rate_limit_1 = require("express-rate-limit");
// Global rate limiter (tüm API'ler için)
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 dakika
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 istek
    message: {
        success: false,
        error: {
            code: '800-001-001',
            message: 'Too many requests, please try again later.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Auth endpoint'leri için özel limiter (daha sıkı)
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10), // 5 istek
    message: {
        success: false,
        error: {
            code: '800-001-001',
            message: 'Too many login attempts, please try again after 15 minutes.'
        }
    },
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
});
