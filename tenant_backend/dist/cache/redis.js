"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeRedis = exports.getRedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
let redisClient = null;
const getRedisClient = () => {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';
        redisClient = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 10) {
                    logger_1.log.error('Redis max retry attempts reached');
                    return null;
                }
                const delay = Math.min(times * 100, 3000);
                logger_1.log.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
                return delay;
            },
            connectTimeout: 10000,
        });
        redisClient.on('connect', () => {
            logger_1.log.info('✅ Redis connected successfully');
        });
        redisClient.on('error', (err) => {
            logger_1.log.error('Redis error:', { message: err.message });
        });
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        logger_1.log.info('Redis connection closed');
    }
};
exports.closeRedis = closeRedis;
//# sourceMappingURL=redis.js.map