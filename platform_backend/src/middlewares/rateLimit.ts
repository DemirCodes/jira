/**
 * RATE LIMITING MIDDLEWARE
 * 
 * DoS saldırılarını engellemek için istek sınırlandırması yapar
 */

import rateLimit from 'express-rate-limit';

// Global rate limiter (tüm API'ler için)
export const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 dakika
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),      // 100 istek
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
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,                                      // 15 dakika
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10),   // 5 istek
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


export const inviteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 dakika
    max: 10,
    message: {
        success: false,
        error: {
            code: '800-001-001',
            message: 'Too many invitation requests. Please try again later.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Üye yönetimi endpoint'leri için limiter (dakikada 20 istek)
export const memberManagementLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 dakika
    max: 20,
    message: {
        success: false,
        error: {
            code: '800-001-001',
            message: 'Too many member management requests. Please try again later.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});
