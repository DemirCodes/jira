import Redis from 'ioredis';
import { log } from '../utils/logger';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';
        
        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 10) {
                    log.error('Redis max retry attempts reached');
                    return null;
                }
                const delay = Math.min(times * 100, 3000);
                log.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
                return delay;
            },
            connectTimeout: 10000,
        });
        
        redisClient.on('connect', () => {
            log.info('✅ Redis connected successfully');
        });
        
        redisClient.on('error', (err) => {
            log.error('Redis error:', { message: err.message });
        });
    }
    
    return redisClient;
};

export const closeRedis = async (): Promise<void> => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        log.info('Redis connection closed');
    }
};