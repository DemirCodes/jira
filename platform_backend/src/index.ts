import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import bugRoutes from './routes/bug.routes';

// Yeni Eklenen Importlar
import { apiLimiter, authLimiter } from './middlewares/rateLimit';
import { log } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import { setupSecurity } from './middlewares/security';

// Servis, Cache ve Route Importları
import { initRedis, closeRedis } from './cache/redis';
import { prisma } from './db/prisma';

import authRoutes from './routes/auth.routes';
import tenantRoutes from './routes/tenant.routes';

export const app = express();
const PORT = process.env.PORT || 3001;

dotenv.config();

// ============================================
// 1. GÜVENLİK VE MİDDLEWARE (Global)
// ============================================
setupSecurity(app); // Helmet + CORS
app.use(express.json({ limit: '1mb' })); // JSON Parser
app.use(express.urlencoded({ extended: true }));

// Rate Limiting (Tüm API için)
app.use('/api', apiLimiter);

// ============================================
// 2. ROUTES
// ============================================
app.use('/api', bugRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);

// ============================================
// 3. HEALTHCHECK
// ============================================
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'Platform Backend Tanrı Modunda Çalışıyor! 🚀',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 4. GLOBAL ERROR HANDLER
// ============================================
app.use(errorHandler); // Artık custom yazılmış errorHandler kullanıyoruz

// ============================================
// 5. SUNUCU BAŞLATMA
// ============================================
const startServer = async () => {
    try {
        initRedis();
        const server = app.listen(PORT, () => {
            log.info(`[Platform] Sunucu ${PORT} portunda tetikte...`);
        });

        const shutdown = async (signal: string) => {
            log.info(`${signal} alındı. Kapanıyor...`);
            server.close(async () => {
                await prisma.$disconnect();
                await closeRedis();
                log.info('Bağlantılar kesildi.');
                process.exit(0);
            });
            setTimeout(() => process.exit(1), 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        log.error('Sunucu başlatma hatası:', {
            error: error instanceof Error ? error.stack ?? error.message : String(error)
        });
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export default app;
