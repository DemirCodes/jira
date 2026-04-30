"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = exports.RateLimiter = exports.RefreshTokenManager = exports.TokenBlacklist = exports.RedisPool = exports.AuthService = exports.metricsMiddleware = exports.revokeAllTokensMiddleware = exports.logoutMiddleware = exports.refreshTokenMiddleware = exports.platformAuthMiddleware = exports.authMiddleware = exports.fingerprintMiddleware = exports.getAuthService = exports.initializeAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ioredis_1 = __importDefault(require("ioredis"));
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const regexValidator_1 = require("../utils/regexValidator");
const crypto_1 = __importDefault(require("crypto"));
const errorToLogMeta = (error) => {
    if (error instanceof Error) {
        return {
            error: error.message,
            stack: error.stack
        };
    }
    return { error };
};
// ============ METRICS COLLECTOR ============
class MetricsCollector {
    metrics = new Map();
    counters = new Map();
    incrementCounter(name, amount = 1) {
        const current = this.counters.get(name) || 0;
        this.counters.set(name, current + amount);
    }
    recordMetric(name, value) {
        this.metrics.set(name, value);
    }
    getMetrics() {
        const result = {};
        this.counters.forEach((value, key) => {
            result[`counter_${key}`] = value;
        });
        this.metrics.forEach((value, key) => {
            result[`metric_${key}`] = value;
        });
        return result;
    }
    reset() {
        this.metrics.clear();
        this.counters.clear();
    }
}
exports.MetricsCollector = MetricsCollector;
// ============ REDIS CONNECTION POOL ============
class RedisPool {
    static instance;
    pool = null;
    isConnected = false;
    reconnectAttempts = 0;
    maxReconnectAttempts = 10;
    metrics;
    constructor() {
        this.metrics = new MetricsCollector();
        this.initialize();
        // Graceful shutdown
        this.setupGracefulShutdown();
    }
    static getInstance() {
        if (!RedisPool.instance) {
            RedisPool.instance = new RedisPool();
        }
        return RedisPool.instance;
    }
    setupGracefulShutdown() {
        const shutdown = async () => {
            logger_1.log.info('Shutting down Redis connection...');
            await this.close();
            process.exit(0);
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    initialize() {
        if (!process.env.REDIS_URL) {
            logger_1.log.warn('REDIS_URL not set, running without Redis');
            return;
        }
        try {
            this.pool = new ioredis_1.default(process.env.REDIS_URL, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => {
                    if (times > this.maxReconnectAttempts) {
                        logger_1.log.error('Redis max reconnect attempts reached');
                        this.isConnected = false;
                        this.metrics.incrementCounter('redis_connection_failed');
                        return null;
                    }
                    this.reconnectAttempts = times;
                    const delay = Math.min(times * 100, 3000);
                    logger_1.log.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
                    return delay;
                },
                enableReadyCheck: true,
                lazyConnect: true,
                connectTimeout: 10000,
                keepAlive: 30000,
                family: 6 // IPv6 support
            });
            this.pool.on('connect', () => {
                logger_1.log.info('Redis connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.metrics.incrementCounter('redis_connection_success');
            });
            this.pool.on('error', (err) => {
                logger_1.log.error('Redis error:', errorToLogMeta(err));
                this.isConnected = false;
                this.metrics.incrementCounter('redis_error');
            });
            this.pool.on('close', () => {
                logger_1.log.warn('Redis connection closed');
                this.isConnected = false;
                this.metrics.incrementCounter('redis_closed');
            });
            // Connect immediately
            this.pool.connect().catch((err) => {
                logger_1.log.error('Redis initial connection failed:', errorToLogMeta(err));
                this.metrics.incrementCounter('redis_initial_connection_failed');
            });
        }
        catch (error) {
            logger_1.log.error('Redis initialization failed:', errorToLogMeta(error));
            this.pool = null;
            this.isConnected = false;
            this.metrics.incrementCounter('redis_init_failed');
        }
    }
    async getClient() {
        if (!this.pool || !this.isConnected) {
            return null;
        }
        return this.pool;
    }
    async execute(operation) {
        const client = await this.getClient();
        if (!client) {
            this.metrics.incrementCounter('redis_execution_no_client');
            return null;
        }
        try {
            const startTime = Date.now();
            const result = await operation(client);
            const duration = Date.now() - startTime;
            this.metrics.recordMetric('redis_operation_duration_ms', duration);
            return result;
        }
        catch (error) {
            logger_1.log.error('Redis operation failed:', errorToLogMeta(error));
            this.metrics.incrementCounter('redis_operation_failed');
            return null;
        }
    }
    async healthCheck() {
        if (!this.pool || !this.isConnected) {
            return false;
        }
        try {
            const startTime = Date.now();
            const result = await this.pool.ping();
            const duration = Date.now() - startTime;
            this.metrics.recordMetric('redis_ping_duration_ms', duration);
            return result === 'PONG';
        }
        catch {
            this.metrics.incrementCounter('redis_health_check_failed');
            return false;
        }
    }
    async close() {
        if (this.pool) {
            await this.pool.quit();
            this.pool = null;
            this.isConnected = false;
            logger_1.log.info('Redis connection closed');
        }
    }
    getMetrics() {
        return this.metrics.getMetrics();
    }
}
exports.RedisPool = RedisPool;
// ============ TOKEN BLACKLIST (Memory limit ile) ============
class TokenBlacklist {
    static instance;
    memoryFallback = new Map();
    redisPool;
    MAX_MEMORY_ENTRIES = 10000;
    metrics;
    constructor() {
        this.redisPool = RedisPool.getInstance();
        this.metrics = new MetricsCollector();
        // Memory cleanup interval
        setInterval(() => this.cleanupMemory(), 60 * 60 * 1000);
    }
    static getInstance() {
        if (!TokenBlacklist.instance) {
            TokenBlacklist.instance = new TokenBlacklist();
        }
        return TokenBlacklist.instance;
    }
    async addToBlacklist(jti, exp, userId) {
        const ttl = Math.max(1, exp - Math.floor(Date.now() / 1000));
        // Try Redis first
        const result = await this.redisPool.execute(async (redis) => {
            await redis.setex(`blacklist:${jti}`, ttl, userId);
            await redis.sadd(`user:${userId}:blacklist`, jti);
            await redis.expire(`user:${userId}:blacklist`, Math.max(ttl, 86400));
            return true;
        });
        if (!result) {
            // Memory limit kontrolü
            if (this.memoryFallback.size >= this.MAX_MEMORY_ENTRIES) {
                // LRU mantığı - en eski entry'yi bul ve sil
                const oldestEntry = this.memoryFallback.keys().next().value;
                if (oldestEntry) {
                    this.memoryFallback.delete(oldestEntry);
                    logger_1.log.warn('Memory blacklist limit reached, evicted oldest entry');
                    this.metrics.incrementCounter('memory_blacklist_eviction');
                }
            }
            // Fallback to memory
            this.memoryFallback.set(jti, { exp, userId });
            logger_1.log.debug('Token blacklisted in memory', { jti, ttl });
            this.metrics.incrementCounter('token_blacklisted_memory');
        }
        else {
            logger_1.log.debug('Token blacklisted in Redis', { jti, ttl });
            this.metrics.incrementCounter('token_blacklisted_redis');
        }
    }
    async isBlacklisted(jti) {
        // Try Redis first
        const result = await this.redisPool.execute(async (redis) => {
            const userId = await redis.get(`blacklist:${jti}`);
            return userId ? { blacklisted: true, userId } : { blacklisted: false };
        });
        if (result) {
            this.metrics.incrementCounter('token_check_redis_hit');
            return result;
        }
        this.metrics.incrementCounter('token_check_redis_miss');
        // Fallback to memory
        const memoryEntry = this.memoryFallback.get(jti);
        if (memoryEntry) {
            const now = Date.now() / 1000;
            if (now > memoryEntry.exp) {
                this.memoryFallback.delete(jti);
                this.metrics.incrementCounter('token_check_memory_expired');
                return { blacklisted: false };
            }
            this.metrics.incrementCounter('token_check_memory_hit');
            return { blacklisted: true, userId: memoryEntry.userId };
        }
        this.metrics.incrementCounter('token_check_memory_miss');
        return { blacklisted: false };
    }
    async revokeAllUserTokens(userId) {
        let revokedCount = 0;
        // Try Redis first
        const redisResult = await this.redisPool.execute(async (redis) => {
            const tokens = await redis.smembers(`user:${userId}:blacklist`);
            if (tokens.length === 0)
                return 0;
            const pipeline = redis.pipeline();
            for (const jti of tokens) {
                const exp = await redis.ttl(`blacklist:${jti}`);
                if (exp > 0) {
                    pipeline.expire(`blacklist:${jti}`, exp);
                }
            }
            await pipeline.exec();
            await redis.del(`user:${userId}:blacklist`);
            return tokens.length;
        });
        if (redisResult !== null) {
            revokedCount = redisResult;
            this.metrics.incrementCounter('user_tokens_revoked_redis', revokedCount);
        }
        // Memory fallback: remove all user tokens from memory
        for (const [jti, data] of this.memoryFallback.entries()) {
            if (data.userId === userId) {
                this.memoryFallback.delete(jti);
                revokedCount++;
            }
        }
        logger_1.log.info('All user tokens revoked', { userId, count: revokedCount });
        this.metrics.incrementCounter('user_tokens_revoked_total', revokedCount);
        return revokedCount;
    }
    cleanupMemory() {
        const now = Date.now() / 1000;
        let cleanedCount = 0;
        for (const [jti, data] of this.memoryFallback.entries()) {
            if (now > data.exp) {
                this.memoryFallback.delete(jti);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger_1.log.debug('Memory blacklist cleanup', { cleanedCount });
            this.metrics.recordMetric('memory_blacklist_cleaned', cleanedCount);
        }
    }
    getMetrics() {
        return {
            ...this.metrics.getMetrics(),
            memory_blacklist_size: this.memoryFallback.size
        };
    }
}
exports.TokenBlacklist = TokenBlacklist;
// ============ REFRESH TOKEN MANAGER (Replay attack koruması ile) ============
class RefreshTokenManager {
    static instance;
    redisPool;
    memoryStore = new Map();
    MAX_MEMORY_ENTRIES = 5000;
    metrics;
    constructor() {
        this.redisPool = RedisPool.getInstance();
        this.metrics = new MetricsCollector();
        setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }
    static getInstance() {
        if (!RefreshTokenManager.instance) {
            RefreshTokenManager.instance = new RefreshTokenManager();
        }
        return RefreshTokenManager.instance;
    }
    async storeRefreshToken(jti, userId, expiresIn, fingerprint) {
        const exp = Math.floor(Date.now() / 1000) + expiresIn;
        // Try Redis
        const result = await this.redisPool.execute(async (redis) => {
            await redis.setex(`refresh:${jti}`, expiresIn, JSON.stringify({ userId, fingerprint }));
            await redis.sadd(`user:${userId}:refresh_tokens`, jti);
            await redis.expire(`user:${userId}:refresh_tokens`, expiresIn + 86400);
            return true;
        });
        if (!result) {
            // Memory limit kontrolü
            if (this.memoryStore.size >= this.MAX_MEMORY_ENTRIES) {
                const oldestEntry = this.memoryStore.keys().next().value;
                if (oldestEntry) {
                    this.memoryStore.delete(oldestEntry);
                    this.metrics.incrementCounter('memory_refresh_eviction');
                }
            }
            // Fallback to memory
            this.memoryStore.set(jti, { userId, expiresAt: exp, fingerprint });
            logger_1.log.debug('Refresh token stored in memory', { jti });
            this.metrics.incrementCounter('refresh_token_stored_memory');
        }
        else {
            this.metrics.incrementCounter('refresh_token_stored_redis');
        }
    }
    async validateRefreshToken(jti, fingerprint) {
        // Check if already used (replay attack prevention)
        const isUsed = await this.redisPool.execute(async (redis) => {
            return await redis.get(`refresh:used:${jti}`);
        });
        if (isUsed) {
            // Token replay attack! Revoke all user tokens
            logger_1.log.warn('Refresh token replay attack detected', { jti });
            this.metrics.incrementCounter('refresh_token_replay_detected');
            const userId = await this.getUserIdFromUsedToken(jti);
            if (userId) {
                const blacklist = TokenBlacklist.getInstance();
                await blacklist.revokeAllUserTokens(userId);
                await this.revokeAllUserRefreshTokens(userId);
            }
            return null;
        }
        // Mark as used immediately (prevent replay within the same request)
        await this.redisPool.execute(async (redis) => {
            await redis.setex(`refresh:used:${jti}`, 3600, 'used');
            return true;
        });
        // Try Redis
        const result = await this.redisPool.execute(async (redis) => {
            const data = await redis.get(`refresh:${jti}`);
            if (!data)
                return null;
            const parsed = JSON.parse(data);
            // Validate fingerprint
            if (parsed.fingerprint !== fingerprint) {
                logger_1.log.warn('Refresh token fingerprint mismatch', { jti, userId: parsed.userId });
                this.metrics.incrementCounter('refresh_token_fingerprint_mismatch');
                return null;
            }
            return parsed.userId;
        });
        if (result) {
            this.metrics.incrementCounter('refresh_token_validated_redis');
            return result;
        }
        // Fallback to memory
        const memoryEntry = this.memoryStore.get(jti);
        if (memoryEntry && memoryEntry.expiresAt > Date.now() / 1000) {
            if (memoryEntry.fingerprint !== fingerprint) {
                this.metrics.incrementCounter('refresh_token_fingerprint_mismatch_memory');
                return null;
            }
            this.metrics.incrementCounter('refresh_token_validated_memory');
            return memoryEntry.userId;
        }
        this.metrics.incrementCounter('refresh_token_invalid');
        return null;
    }
    async getUserIdFromUsedToken(jti) {
        const result = await this.redisPool.execute(async (redis) => {
            const data = await redis.get(`refresh:used:${jti}`);
            if (!data || data === 'used')
                return null;
            return data;
        });
        if (result)
            return result;
        // Check memory
        for (const [key, value] of this.memoryStore.entries()) {
            if (key === jti)
                return value.userId;
        }
        return null;
    }
    async revokeRefreshToken(jti) {
        // Try Redis
        await this.redisPool.execute(async (redis) => {
            const data = await redis.get(`refresh:${jti}`);
            if (data) {
                const parsed = JSON.parse(data);
                await redis.del(`refresh:${jti}`);
                await redis.srem(`user:${parsed.userId}:refresh_tokens`, jti);
                this.metrics.incrementCounter('refresh_token_revoked_redis');
            }
            return true;
        });
        // Memory fallback
        if (this.memoryStore.delete(jti)) {
            this.metrics.incrementCounter('refresh_token_revoked_memory');
        }
    }
    async revokeAllUserRefreshTokens(userId) {
        let revokedCount = 0;
        // Try Redis
        const redisResult = await this.redisPool.execute(async (redis) => {
            const tokens = await redis.smembers(`user:${userId}:refresh_tokens`);
            if (tokens.length === 0)
                return 0;
            const pipeline = redis.pipeline();
            for (const jti of tokens) {
                pipeline.del(`refresh:${jti}`);
                pipeline.del(`refresh:used:${jti}`);
            }
            await pipeline.exec();
            await redis.del(`user:${userId}:refresh_tokens`);
            return tokens.length;
        });
        if (redisResult !== null) {
            revokedCount = redisResult;
            this.metrics.incrementCounter('user_refresh_tokens_revoked_redis', revokedCount);
        }
        // Memory fallback
        for (const [jti, data] of this.memoryStore.entries()) {
            if (data.userId === userId) {
                this.memoryStore.delete(jti);
                revokedCount++;
            }
        }
        logger_1.log.info('All user refresh tokens revoked', { userId, count: revokedCount });
        this.metrics.incrementCounter('user_refresh_tokens_revoked_total', revokedCount);
        return revokedCount;
    }
    cleanup() {
        const now = Date.now() / 1000;
        let cleanedCount = 0;
        for (const [jti, data] of this.memoryStore.entries()) {
            if (now > data.expiresAt) {
                this.memoryStore.delete(jti);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger_1.log.debug('Refresh token memory cleanup', { cleanedCount });
            this.metrics.recordMetric('memory_refresh_cleaned', cleanedCount);
        }
    }
    getMetrics() {
        return {
            ...this.metrics.getMetrics(),
            memory_refresh_size: this.memoryStore.size
        };
    }
}
exports.RefreshTokenManager = RefreshTokenManager;
class RateLimiter {
    memoryStore = new Map();
    redisPool;
    config;
    metrics;
    constructor(config) {
        this.config = {
            skipOnRedisFailure: true,
            ...config
        };
        this.redisPool = RedisPool.getInstance();
        this.metrics = new MetricsCollector();
        // Cleanup every hour
        setInterval(() => this.cleanupMemory(), 60 * 60 * 1000);
    }
    async checkLimit(key) {
        const now = Date.now();
        const windowKey = Math.floor(now / this.config.windowMs);
        const rateKey = `rate:${key}:${windowKey}`;
        // Try Redis first
        const redisResult = await this.redisPool.execute(async (redis) => {
            const current = await redis.incr(rateKey);
            if (current === 1) {
                await redis.expire(rateKey, Math.ceil(this.config.windowMs / 1000));
            }
            const remaining = Math.max(0, this.config.maxRequests - current);
            const resetTime = (windowKey + 1) * this.config.windowMs;
            const allowed = current <= this.config.maxRequests;
            if (!allowed) {
                this.metrics.incrementCounter('rate_limit_exceeded_redis');
            }
            return {
                allowed,
                remaining,
                resetTime
            };
        });
        if (redisResult) {
            this.metrics.incrementCounter('rate_limit_check_redis');
            return redisResult;
        }
        // Fallback to memory
        this.metrics.incrementCounter('rate_limit_check_memory');
        if (this.config.skipOnRedisFailure) {
            const record = this.memoryStore.get(rateKey);
            const resetTime = (windowKey + 1) * this.config.windowMs;
            if (!record || now > record.resetTime) {
                this.memoryStore.set(rateKey, { count: 1, resetTime });
                return { allowed: true, remaining: this.config.maxRequests - 1, resetTime };
            }
            if (record.count >= this.config.maxRequests) {
                this.metrics.incrementCounter('rate_limit_exceeded_memory');
                return { allowed: false, remaining: 0, resetTime: record.resetTime };
            }
            record.count++;
            this.memoryStore.set(rateKey, record);
            return { allowed: true, remaining: this.config.maxRequests - record.count, resetTime: record.resetTime };
        }
        // Strict mode: reject if Redis fails
        this.metrics.incrementCounter('rate_limit_strict_reject');
        return { allowed: false, remaining: 0, resetTime: now + this.config.windowMs };
    }
    cleanupMemory() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [key, record] of this.memoryStore.entries()) {
            if (now > record.resetTime) {
                this.memoryStore.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            this.metrics.recordMetric('rate_limit_memory_cleaned', cleanedCount);
        }
    }
    getMetrics() {
        return {
            ...this.metrics.getMetrics(),
            memory_rate_limit_size: this.memoryStore.size
        };
    }
}
exports.RateLimiter = RateLimiter;
class AuthService {
    tenantPool;
    platformPool;
    jwtSecret;
    jwtIssuer;
    jwtAudience;
    accessTokenExpiry;
    refreshTokenExpiry;
    blacklist;
    refreshManager;
    rateLimiter;
    metrics;
    constructor(deps) {
        this.tenantPool = deps.tenantPool;
        this.platformPool = deps.platformPool;
        this.jwtSecret = deps.jwtSecret || process.env.JWT_SECRET || '';
        this.jwtIssuer = deps.jwtIssuer || process.env.JWT_ISSUER || 'your-app';
        this.jwtAudience = deps.jwtAudience || process.env.JWT_AUDIENCE || 'your-api';
        this.accessTokenExpiry = deps.accessTokenExpiry || '15m';
        this.refreshTokenExpiry = deps.refreshTokenExpiry || '7d';
        this.blacklist = TokenBlacklist.getInstance();
        this.refreshManager = RefreshTokenManager.getInstance();
        this.metrics = new MetricsCollector();
        this.rateLimiter = new RateLimiter({
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 100,
            skipOnRedisFailure: true
        });
        if (!this.jwtSecret || this.jwtSecret.length < 32) {
            throw new Error('JWT_SECRET must be at least 32 characters');
        }
        logger_1.log.info('AuthService initialized', {
            accessTokenExpiry: this.accessTokenExpiry,
            refreshTokenExpiry: this.refreshTokenExpiry
        });
    }
    generateJTI(userId, type) {
        return `${type}:${userId}:${Date.now()}:${crypto_1.default.randomBytes(16).toString('hex')}`;
    }
    generateDeviceFingerprint(req) {
        const components = [
            req.ip,
            req.headers['user-agent'],
            req.headers['accept-language'],
            req.headers['sec-ch-ua-platform']
        ].filter(Boolean);
        return crypto_1.default.createHash('sha256').update(components.join('|')).digest('hex');
    }
    async createTokenPair(userId, req) {
        const fingerprint = req ? this.generateDeviceFingerprint(req) : 'unknown';
        const userAgent = req?.headers['user-agent'] || 'unknown';
        const accessJTI = this.generateJTI(userId, 'access');
        const refreshJTI = this.generateJTI(userId, 'refresh');
        const accessToken = jsonwebtoken_1.default.sign({
            userId,
            jti: accessJTI,
            type: 'access',
            iss: this.jwtIssuer,
            aud: this.jwtAudience,
            fingerprint,
            userAgent
        }, this.jwtSecret, { expiresIn: this.accessTokenExpiry, algorithm: 'HS256' });
        const refreshToken = jsonwebtoken_1.default.sign({
            userId,
            jti: refreshJTI,
            type: 'refresh',
            iss: this.jwtIssuer,
            aud: this.jwtAudience,
            fingerprint,
            userAgent
        }, this.jwtSecret, { expiresIn: this.refreshTokenExpiry, algorithm: 'HS256' });
        // Store refresh token
        const refreshExpiresIn = this.parseExpiresIn(this.refreshTokenExpiry);
        await this.refreshManager.storeRefreshToken(refreshJTI, userId, refreshExpiresIn, fingerprint);
        const accessExpiresIn = this.parseExpiresIn(this.accessTokenExpiry);
        this.metrics.incrementCounter('token_pair_created');
        return {
            accessToken,
            refreshToken,
            expiresIn: accessExpiresIn,
            refreshExpiresIn: refreshExpiresIn
        };
    }
    async refreshAccessToken(refreshToken, req) {
        try {
            // Verify refresh token
            const decoded = jsonwebtoken_1.default.verify(refreshToken, this.jwtSecret, {
                algorithms: ['HS256'],
                issuer: this.jwtIssuer,
                audience: this.jwtAudience
            });
            if (decoded.type !== 'refresh') {
                this.metrics.incrementCounter('refresh_token_wrong_type');
                throw new Error('Invalid token type');
            }
            // Get fingerprint from request
            const fingerprint = req ? this.generateDeviceFingerprint(req) : decoded.fingerprint;
            // Check if refresh token is valid in store with fingerprint validation
            const userId = await this.refreshManager.validateRefreshToken(decoded.jti, fingerprint);
            if (!userId || userId !== decoded.userId) {
                this.metrics.incrementCounter('refresh_token_invalid');
                throw new Error('Refresh token not found or fingerprint mismatch');
            }
            // Revoke old refresh token
            await this.refreshManager.revokeRefreshToken(decoded.jti);
            // Create new token pair
            this.metrics.incrementCounter('refresh_token_success');
            return await this.createTokenPair(userId, req);
        }
        catch (error) {
            logger_1.log.error('Refresh token failed:', errorToLogMeta(error));
            this.metrics.incrementCounter('refresh_token_failed');
            return null;
        }
    }
    async revokeAllTokens(userId) {
        await this.blacklist.revokeAllUserTokens(userId);
        await this.refreshManager.revokeAllUserRefreshTokens(userId);
        this.metrics.incrementCounter('all_tokens_revoked');
    }
    async verifyAccessToken(token, fingerprint) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret, {
                algorithms: ['HS256'],
                issuer: this.jwtIssuer,
                audience: this.jwtAudience
            });
            if (decoded.type !== 'access') {
                this.metrics.incrementCounter('access_token_wrong_type');
                return null;
            }
            // Optional fingerprint validation
            if (fingerprint && decoded.fingerprint && decoded.fingerprint !== fingerprint) {
                logger_1.log.warn('Access token fingerprint mismatch', { userId: decoded.userId });
                this.metrics.incrementCounter('access_token_fingerprint_mismatch');
                return null;
            }
            // Check blacklist
            if (decoded.jti) {
                const { blacklisted } = await this.blacklist.isBlacklisted(decoded.jti);
                if (blacklisted) {
                    this.metrics.incrementCounter('access_token_blacklisted');
                    return null;
                }
            }
            // Validate userId format
            if (!(0, regexValidator_1.isValidUUID)(decoded.userId)) {
                this.metrics.incrementCounter('access_token_invalid_userid');
                return null;
            }
            this.metrics.incrementCounter('access_token_valid');
            return decoded;
        }
        catch (error) {
            this.metrics.incrementCounter('access_token_verification_failed');
            return null;
        }
    }
    async checkRateLimit(key) {
        return this.rateLimiter.checkLimit(key);
    }
    parseExpiresIn(expiresIn) {
        const units = {
            s: 1, m: 60, h: 3600, d: 86400, w: 604800
        };
        const match = expiresIn.match(/^(\d+)(s|m|h|d|w)$/);
        if (!match)
            return 3600;
        return parseInt(match[1], 10) * (units[match[2]] || 1);
    }
    async healthCheck() {
        const redisPool = RedisPool.getInstance();
        const redisAvailable = await redisPool.healthCheck();
        return {
            jwtConfigured: this.jwtSecret.length >= 32,
            redisAvailable,
            rateLimiterHealthy: true,
            metrics: this.getMetrics()
        };
    }
    getMetrics() {
        return {
            ...this.metrics.getMetrics(),
            ...this.blacklist.getMetrics(),
            ...this.refreshManager.getMetrics(),
            ...this.rateLimiter.getMetrics()
        };
    }
}
exports.AuthService = AuthService;
// ============ EXPRESS MIDDLEWARES ============
let authService = null;
const initializeAuth = (deps) => {
    authService = new AuthService(deps);
    return authService;
};
exports.initializeAuth = initializeAuth;
const getAuthService = () => {
    if (!authService) {
        throw new Error('Auth not initialized. Call initializeAuth first.');
    }
    return authService;
};
exports.getAuthService = getAuthService;
// Device fingerprint middleware
const fingerprintMiddleware = (req, res, next) => {
    const components = [
        req.ip,
        req.headers['user-agent'],
        req.headers['accept-language'],
        req.headers['sec-ch-ua-platform']
    ].filter(Boolean);
    req.deviceFingerprint = crypto_1.default.createHash('sha256').update(components.join('|')).digest('hex');
    next();
};
exports.fingerprintMiddleware = fingerprintMiddleware;
const authMiddleware = async (req, res, next) => {
    const service = (0, exports.getAuthService)();
    // Rate limiting with better key strategy
    const rateKey = req.userId
        ? `auth:user:${req.userId}`
        : `auth:ip:${req.ip}`;
    const rateLimit = await service.checkRateLimit(rateKey);
    if (!rateLimit.allowed) {
        (0, response_1.sendError)(res, '100-001-009', 'Too many requests', 429);
        return;
    }
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader?.split(' ')[1];
    if (!token) {
        (0, response_1.sendError)(res, '100-001-001', 'No token provided', 401);
        return;
    }
    const decoded = await service.verifyAccessToken(token, req.deviceFingerprint);
    if (!decoded) {
        (0, response_1.sendError)(res, '100-001-002', 'Invalid or expired token', 401);
        return;
    }
    // Set RLS
    const client = await service['tenantPool'].connect();
    try {
        await client.query('BEGIN');
        await client.query('SET app.current_user_id = $1', [decoded.userId]);
        await client.query('SET app.current_token_iat = $1', [decoded.iat]);
        await client.query('SET app.request_time = $1', [Date.now()]);
        await client.query('COMMIT');
        req.userId = decoded.userId;
        req.token = token;
        req.tokenInfo = {
            iat: decoded.iat,
            exp: decoded.exp,
            jti: decoded.jti
        };
        next();
    }
    finally {
        client.release();
    }
};
exports.authMiddleware = authMiddleware;
const platformAuthMiddleware = async (req, res, next) => {
    const service = (0, exports.getAuthService)();
    const rateKey = `platform:${req.ip}`;
    const rateLimit = await service.checkRateLimit(rateKey);
    if (!rateLimit.allowed) {
        (0, response_1.sendError)(res, '100-001-009', 'Too many requests', 429);
        return;
    }
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader?.split(' ')[1];
    if (!token) {
        (0, response_1.sendError)(res, '100-001-001', 'No token provided', 401);
        return;
    }
    const decoded = await service.verifyAccessToken(token, req.deviceFingerprint);
    if (!decoded) {
        (0, response_1.sendError)(res, '100-001-002', 'Invalid or expired token', 401);
        return;
    }
    const client = await service['platformPool'].connect();
    try {
        await client.query('BEGIN');
        await client.query('SET app.current_user_id = $1', [decoded.userId]);
        await client.query('SET app.current_token_iat = $1', [decoded.iat]);
        await client.query('COMMIT');
        req.userId = decoded.userId;
        req.token = token;
        req.tokenInfo = {
            iat: decoded.iat,
            exp: decoded.exp,
            jti: decoded.jti
        };
        next();
    }
    finally {
        client.release();
    }
};
exports.platformAuthMiddleware = platformAuthMiddleware;
const refreshTokenMiddleware = async (req, res) => {
    const service = (0, exports.getAuthService)();
    const { refreshToken } = req.body;
    if (!refreshToken) {
        (0, response_1.sendError)(res, '100-001-001', 'No refresh token provided', 401);
        return;
    }
    const tokenPair = await service.refreshAccessToken(refreshToken, req);
    if (!tokenPair) {
        (0, response_1.sendError)(res, '100-001-002', 'Invalid refresh token', 401);
        return;
    }
    res.json(tokenPair);
};
exports.refreshTokenMiddleware = refreshTokenMiddleware;
const logoutMiddleware = async (req, res) => {
    const service = (0, exports.getAuthService)();
    if (req.tokenInfo?.jti && req.userId) {
        const decoded = jsonwebtoken_1.default.decode(req.token);
        if (decoded?.exp) {
            await service['blacklist'].addToBlacklist(req.tokenInfo.jti, decoded.exp, req.userId);
        }
    }
    res.json({ message: 'Logged out successfully' });
};
exports.logoutMiddleware = logoutMiddleware;
const revokeAllTokensMiddleware = async (req, res) => {
    const service = (0, exports.getAuthService)();
    if (!req.userId) {
        (0, response_1.sendError)(res, '100-001-001', 'User ID required', 400);
        return;
    }
    await service.revokeAllTokens(req.userId);
    res.json({ message: 'All tokens revoked successfully' });
};
exports.revokeAllTokensMiddleware = revokeAllTokensMiddleware;
const metricsMiddleware = async (req, res) => {
    const service = (0, exports.getAuthService)();
    const metrics = service.getMetrics();
    res.json(metrics);
};
exports.metricsMiddleware = metricsMiddleware;
//# sourceMappingURL=auth.js.map