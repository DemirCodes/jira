/**
 * REDIS ENGINE (SINGLETON PATTERN - HA READY)
 * * Platform backend'in önbellek ve rate-limit motoru.
 * * Güvenlik ve Performans Önlemleri:
 * 1. Singleton Instance: Tüm uygulamada tek bir Redis bağlantısı dönmesini sağlar.
 * 2. Graceful Error Handling: Bağlantı koptuğunda Express sunucusunu çökertmez.
 * 3. Exponential Backoff Retry: Redis down olduğunda akıllı aralıklarla yeniden bağlanmayı dener.
 * 4. Lazy Connect: İlk istek gelene kadar veya çağrılana kadar soketi açmaz.
 */

import Redis, { RedisOptions } from 'ioredis';
import { log } from '../utils/logger';

let redisInstance: Redis | null = null;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Redis Konfigürasyonunu Çevre Değişkenlerinden Hazırlar
 */
const getRedisConfig = (): { url?: string; options: RedisOptions } => {
    const options: RedisOptions = {
        maxRetriesPerRequest: 3, // İsteklerin askıda kalıp hafıza (memory leak) şişirmemesi için limit
        enableReadyCheck: true,
        autoResendUnfulfilledCommands: false, // Bağlantı koptuğunda komutları biriktirip DB'yi patlatmasın diye false
        retryStrategy(times) {
            // Üstel artışla yeniden bağlanma stratejisi (Max 3 saniyede bir dener)
            const delay = Math.min(times * 100, 3000);
            return delay;
        }
    };

    // Öncelik REDIS_URL'de, yoksa host/port kurgusuna düşer
    if (process.env.REDIS_URL) {
        return { url: process.env.REDIS_URL, options };
    }

    return {
        options: {
            ...options,
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            db: parseInt(process.env.REDIS_DB || '1', 10), // Platform için DB=1 kurgulamıştık
            password: process.env.REDIS_PASSWORD || undefined,
        }
    };
};

/**
 * Redis Bağlantısını Başlatır ve Event Listener'ları Bağlar
 */
export const initRedis = (): Redis => {
    if (redisInstance) return redisInstance;

    const { url, options } = getRedisConfig();

    try {
        if (url) {
            // URL formatında şifre varsa loglarda maskeleme yapıyoruz (Güvenlik)
            const maskedUrl = url.replace(/:[^:]*@/, ':***@');
            log.info('Connecting to Redis via URL...', { url: maskedUrl });
            redisInstance = new Redis(url, options);
        } else {
            log.info('Connecting to Redis via Config...', { host: options.host, port: options.port, db: options.db });
            redisInstance = new Redis(options);
        }

        // ============================================
        // REDIS EVENT MANAGEMENT
        // ============================================
        
        redisInstance.on('connect', () => {
            log.info('Redis connection socket opened.');
        });

        redisInstance.on('ready', () => {
            log.info('Redis Client is ready to process commands. ⚡');
        });

        redisInstance.on('error', (error: any) => {
            log.error('Redis Client Error', { 
                message: error.message,
                code: error.code
            });
        });

        redisInstance.on('close', () => {
            log.warn('Redis connection closed.');
        });

        redisInstance.on('reconnecting', (delay: number) => {
            log.info(`Redis attempting to reconnect in ${delay}ms...`);
        });

        return redisInstance;
    } catch (err: any) {
        log.error('Fatal Redis Initialization Error', { error: err.message });
        // Fail-open mantığı için hata fırlatmıyoruz, null instance yönetimine bırakıyoruz
        return null as any;
    }
};

/**
 * Mevcut Redis İstemcisini Döner, Başlatılmadıysa Otomatik Başlatır
 */
export const getRedisClient = (): Redis => {
    if (!redisInstance) {
        return initRedis();
    }
    return redisInstance;
};

/**
 * Uygulama Kapanırken Bağlantıyı Güvenli Şekilde Kapatır (Graceful Shutdown)
 */
export const closeRedis = async (): Promise<void> => {
    if (redisInstance) {
        log.info('Closing Redis connection gracefully...');
        await redisInstance.quit();
        redisInstance = null;
    }
};