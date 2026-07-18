import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import dotenv from 'dotenv';
import path from 'path';

// --- GÜNCELLENEN IMPORTLAR ---
// Prisma ve Redis bağlantı yöneticilerinizi buradan import edin.
// Not: Bu dosyaların varlığı ve export yapısı proje yapınıza göre değişebilir.
import { prisma } from './src/db/prisma'; 
import { initRedis, closeRedis } from './src/cache/redis';

// Route importları
import authRoutes from './src/routes/auth.routes';
import tenantRoutes from './src/routes/tenant.routes';
import bugRoutes from './src/routes/bug.routes';

// Ortam değişkenlerini yükle
dotenv.config();

// Logger Konfigürasyonu
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'platform-backend' },
    transports: [
        new transports.Console({
            format: format.combine(format.colorize(), format.simple())
        }),
        new transports.DailyRotateFile({
            filename: path.join(__dirname, '../logs', 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '30d',
            level: 'error'
        }),
        new transports.DailyRotateFile({
            filename: path.join(__dirname, '../logs', 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '30d',
            level: 'info'
        })
    ]
});

// Express Winston Middleware
const expressWinstonMiddleware = (req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
};

class Server {
    private app: Express;
    private port: number | string;

    constructor() {
        this.app = express();
        this.port = process.env.PORT || '3001';
        
        this.initializeSecurity();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeSecurity(): void {
        this.app.use(helmet());
        
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',') 
            : ['http://localhost:3000', 'http://localhost:5173'];

        this.app.use(cors({
            origin: allowedOrigins,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            credentials: true
        }));
    }

    private initializeMiddlewares(): void {
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100,
            standardHeaders: true,
            legacyHeaders: false,
            message: { status: 'error', message: 'Çok fazla istek yaptınız.' }
        });
        this.app.use(limiter);

        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(expressWinstonMiddleware);
    }

    private initializeRoutes(): void {
        this.app.use('/api/v1/auth', authRoutes);
        this.app.use('/api/v1/tenants', tenantRoutes);
        this.app.use('/api/platform/bugs', bugRoutes);

        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({
                status: 'success',
                message: 'Platform Backend is running!',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            });
        });

        this.app.get('/', (req: Request, res: Response) => {
            res.status(200).json({
                name: 'Platform Backend API',
                version: process.env.npm_package_version || '1.0.0'
            });
        });
    }

    private initializeErrorHandling(): void {
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            const error = new Error(`Route ${req.method} ${req.originalUrl} not found`);
            (error as any).statusCode = 404;
            next(error);
        });

        this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            const statusCode = err.statusCode || 500;
            const message = process.env.NODE_ENV === 'production' && statusCode === 500 
                ? 'Internal Server Error' 
                : err.message;

            logger.error('Error occurred:', {
                error: err.message,
                stack: err.stack,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip
            });

            res.status(statusCode).json({
                status: 'error',
                message: message,
                ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
                timestamp: new Date().toISOString()
            });
        });
    }

    // --- GÜNCELLENEN START METODU ---
    public async start(): Promise<void> {
        try {
            // 1. Bağımlılıkları Başlat (Redis vb.)
            if (process.env.REDIS_URL) {
                initRedis();
                logger.info('Redis bağlantısı başlatıldı.');
            }

            const portNumber = parseInt(this.port as string, 10);
            
            // 2. Sunucuyu Dinlemeye Başla
            const serverInstance = this.app.listen(portNumber, () => {
                logger.info(`=================================`);
                logger.info(`🚀 Platform Backend Sunucu Başlatıldı`);
                logger.info(`📡 Port: ${portNumber}`);
                logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
                logger.info(`=================================`);
            });

            // 3. Graceful Shutdown Mekanizması
            const shutdown = async (signal: string) => {
                logger.info(`${signal} sinyali alındı. Kapatma işlemi başlatılıyor...`);
                
                // Yeni istekleri kabul etmeyi durdur
                serverInstance.close(async () => {
                    logger.info('HTTP sunucusu kapatıldı. Bağlantılar temizleniyor...');
                    
                    try {
                        // 4. Veri Tabanı ve Cache Bağlantılarını Kapat
                        await prisma.$disconnect();
                        logger.info('Prisma bağlantısı kapatıldı.');

                        if (process.env.REDIS_URL) {
                            await closeRedis();
                            logger.info('Redis bağlantısı kapatıldı.');
                        }

                        logger.info('Tüm işlemler tamamlandı. Süreç sonlandırılıyor.');
                        process.exit(0);
                    } catch (err) {
                        logger.error('Kapatma sırasında hata oluştu:', err);
                        process.exit(1);
                    }
                });
            };

            // Sinyallere dinleyici ekle
            process.on('SIGTERM', () => shutdown('SIGTERM'));
            process.on('SIGINT', () => shutdown('SIGINT'));

        } catch (error) {
            logger.error('Sunucu başlatma hatası:', error);
            process.exit(1);
        }
    }
}

// Sunucuyu başlat
const server = new Server();
server.start();

export default server;
