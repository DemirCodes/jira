import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

// Çevre değişkenlerini yükle
dotenv.config();

// Servis, Cache ve Route Importları
import { initRedis, closeRedis } from './cache/redis';
import { prisma } from './db/prisma';
import { log } from './utils/logger';
import { AppError } from './utils/errorCodes';

import authRoutes from './routes/auth.routes';
import tenantRoutes from './routes/tenant.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// 1. GLOBAL MIDDLEWARE'LER (Güvenlik ve Format)
// ============================================
app.use(helmet()); // Temel HTTP güvenlik başlıklarını ekler
app.use(cors()); // Farklı domainlerden gelen isteklere izin verir
app.use(express.json({ limit: '1mb' })); // Body parser (JSON). DoS koruması için 1MB limit.

// ============================================
// 2. HEALTHCHECK (Sağlık Kontrolü - K8s/Docker için)
// ============================================
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'Platform Backend Tanrı Modunda Çalışıyor! 🚀',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 3. API ROTALARI (ROUTES)
// ============================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);

// Tanımlanmayan Rotalar (404 Not Found)
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ============================================
// 4. GLOBAL ERROR HANDLER (Hata Yakalayıcı)
// ============================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    log.error('Unhandled Exception', { error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
    
    if (err instanceof AppError) {
        // Tenant tarafındaki AppError class'ında property adı muhtemelen 'errorCode' 
        // TypeScript'i esneterek güvenli bir şekilde değeri alıyoruz
        const customError = err as any;
        const errCode = customError.errorCode || customError.code || 'APP_ERROR';
        const statusCode = customError.statusCode || 400;

        res.status(statusCode).json({ 
            status: 'error', 
            code: errCode, 
            message: err.message 
        });
        return;
    }

    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

// ============================================
// 5. SUNUCUYU BAŞLATMA VE GRACEFUL SHUTDOWN
// ============================================
const startServer = async () => {
    try {
        // Sunucu kalkmadan önce Redis'i uyandır
        initRedis();

        const server = app.listen(PORT, () => {
            log.info(`[Platform] Sunucu ${PORT} portunda tetikte... Mimar: Vakıf Demirci 👑`);
        });

        // Graceful Shutdown (Güvenli Kapanma Sistemi)
        // K8s veya Docker sunucuyu kapatmak istediğinde işlemleri yarıda kesmemesi için
        const shutdown = async (signal: string) => {
            log.info(`${signal} sinyali alındı. Sistem güvenli bir şekilde kapatılıyor...`);
            
            server.close(async () => {
                log.info('HTTP sunucusu kapatıldı.');
                await prisma.$disconnect();
                await closeRedis();
                log.info('Veritabanı ve Redis bağlantıları kesildi. Hoşçakal!');
                process.exit(0);
            });

            // Eğer 10 saniye içinde kapanmazsa zorla kapat
            setTimeout(() => {
                log.error('Güvenli kapanma zaman aşımına uğradı, zorla kapatılıyor!');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        log.error('Sunucu başlatılırken kritik bir hata oluştu:', { error });
        process.exit(1);
    }
};

// Motoru ateşle!
startServer();