import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

export const setupSecurity = (app: express.Application): void => {
    // Helmet ile CSP başlıkları
    app.use(helmet({
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
    app.use(cors({
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