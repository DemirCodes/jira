import { Application } from "express";
import helmet from "helmet";
import cors from 'cors';

export const setupSecurity = (app: Application): void => {
    // Helmet güvenlik başlıklarını ekler
    app.use(helmet());

    // CORS - sadece izin verilen domainlerden istek kabul et
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',');

    app.use(cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
};