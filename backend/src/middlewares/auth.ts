import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { tenantPool } from '../db/tenantPool';
import { platformPool } from '../db/platformPool';
import { sendError } from '../utils/response';
import { log } from '../utils/logger';
import { isValidUUID } from '../utils/regexValidator';
import crypto from 'crypto';

// ============ TYPES ============
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            token?: string;
            refreshToken?: string;
            tokenInfo?: {
                iat: number;
                exp: number;
                jti?: string;
            };
            deviceFingerprint?: string;
        }
    }
}

interface JwtPayload {
    userId: string;
    iat: number;
    exp: number;
    aud?: string;
    iss?: string;
    jti?: string;
    type?: 'access' | 'refresh';
    fingerprint?: string;
    userAgent?: string;
}

interface RefreshTokenPayload {
    userId: string;
    jti: string;
    type: 'refresh';
    iat: number;
    exp: number;
    fingerprint: string;
    userAgent: string;
}

interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
}

const errorToLogMeta = (error: unknown): Record<string, unknown> => {
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
    private metrics: Map<string, number> = new Map();
    private counters: Map<string, number> = new Map();

    incrementCounter(name: string, amount = 1): void {
        const current = this.counters.get(name) || 0;
        this.counters.set(name, current + amount);
    }

    recordMetric(name: string, value: number): void {
        this.metrics.set(name, value);
    }

    getMetrics(): Record<string, number> {
        const result: Record<string, number> = {};
        this.counters.forEach((value, key) => {
            result[`counter_${key}`] = value;
        });
        this.metrics.forEach((value, key) => {
            result[`metric_${key}`] = value;
        });
        return result;
    }

    reset(): void {
        this.metrics.clear();
        this.counters.clear();
    }
}

// ============ REDIS CONNECTION POOL ============
class RedisPool {
    private static instance: RedisPool;
    private pool: Redis | null = null;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts: number = 10;
    private metrics: MetricsCollector;

    private constructor() {
        this.metrics = new MetricsCollector();
        this.initialize();
        
        // Graceful shutdown
        this.setupGracefulShutdown();
    }

    static getInstance(): RedisPool {
        if (!RedisPool.instance) {
            RedisPool.instance = new RedisPool();
        }
        return RedisPool.instance;
    }

    private setupGracefulShutdown(): void {
        const shutdown = async () => {
            log.info('Shutting down Redis connection...');
            await this.close();
            process.exit(0);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }

    private initialize(): void {
        if (!process.env.REDIS_URL) {
            log.warn('REDIS_URL not set, running without Redis');
            return;
        }

        try {
            this.pool = new Redis(process.env.REDIS_URL, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => {
                    if (times > this.maxReconnectAttempts) {
                        log.error('Redis max reconnect attempts reached');
                        this.isConnected = false;
                        this.metrics.incrementCounter('redis_connection_failed');
                        return null;
                    }
                    this.reconnectAttempts = times;
                    const delay = Math.min(times * 100, 3000);
                    log.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
                    return delay;
                },
                enableReadyCheck: true,
                lazyConnect: true,
                connectTimeout: 10000,
                keepAlive: 30000,
                family: 6 // IPv6 support
            });

            this.pool.on('connect', () => {
                log.info('Redis connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.metrics.incrementCounter('redis_connection_success');
            });

            this.pool.on('error', (err) => {
                log.error('Redis error:', errorToLogMeta(err));
                this.isConnected = false;
                this.metrics.incrementCounter('redis_error');
            });

            this.pool.on('close', () => {
                log.warn('Redis connection closed');
                this.isConnected = false;
                this.metrics.incrementCounter('redis_closed');
            });

            // Connect immediately
            this.pool.connect().catch((err) => {
                log.error('Redis initial connection failed:', errorToLogMeta(err));
                this.metrics.incrementCounter('redis_initial_connection_failed');
            });

        } catch (error) {
            log.error('Redis initialization failed:', errorToLogMeta(error));
            this.pool = null;
            this.isConnected = false;
            this.metrics.incrementCounter('redis_init_failed');
        }
    }

    async getClient(): Promise<Redis | null> {
        if (!this.pool || !this.isConnected) {
            return null;
        }
        return this.pool;
    }

    async execute<T>(operation: (client: Redis) => Promise<T>): Promise<T | null> {
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
        } catch (error) {
            log.error('Redis operation failed:', errorToLogMeta(error));
            this.metrics.incrementCounter('redis_operation_failed');
            return null;
        }
    }

    async healthCheck(): Promise<boolean> {
        if (!this.pool || !this.isConnected) {
            return false;
        }
        try {
            const startTime = Date.now();
            const result = await this.pool.ping();
            const duration = Date.now() - startTime;
            this.metrics.recordMetric('redis_ping_duration_ms', duration);
            return result === 'PONG';
        } catch {
            this.metrics.incrementCounter('redis_health_check_failed');
            return false;
        }
    }

    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.quit();
            this.pool = null;
            this.isConnected = false;
            log.info('Redis connection closed');
        }
    }

    getMetrics(): Record<string, number> {
        return this.metrics.getMetrics();
    }
}

// ============ TOKEN BLACKLIST (Memory limit ile) ============
class TokenBlacklist {
    private static instance: TokenBlacklist;
    private memoryFallback: Map<string, { exp: number; userId: string }> = new Map();
    private redisPool: RedisPool;
    private readonly MAX_MEMORY_ENTRIES = 10000;
    private metrics: MetricsCollector;

    private constructor() {
        this.redisPool = RedisPool.getInstance();
        this.metrics = new MetricsCollector();
        
        // Memory cleanup interval
        setInterval(() => this.cleanupMemory(), 60 * 60 * 1000);
    }

    static getInstance(): TokenBlacklist {
        if (!TokenBlacklist.instance) {
            TokenBlacklist.instance = new TokenBlacklist();
        }
        return TokenBlacklist.instance;
    }

    async addToBlacklist(jti: string, exp: number, userId: string): Promise<void> {
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
                    log.warn('Memory blacklist limit reached, evicted oldest entry');
                    this.metrics.incrementCounter('memory_blacklist_eviction');
                }
            }
            
            // Fallback to memory
            this.memoryFallback.set(jti, { exp, userId });
            log.debug('Token blacklisted in memory', { jti, ttl });
            this.metrics.incrementCounter('token_blacklisted_memory');
        } else {
            log.debug('Token blacklisted in Redis', { jti, ttl });
            this.metrics.incrementCounter('token_blacklisted_redis');
        }
    }

    async isBlacklisted(jti: string): Promise<{ blacklisted: boolean; userId?: string }> {
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

    async revokeAllUserTokens(userId: string): Promise<number> {
        let revokedCount = 0;

        // Try Redis first
        const redisResult = await this.redisPool.execute(async (redis) => {
            const tokens = await redis.smembers(`user:${userId}:blacklist`);
            if (tokens.length === 0) return 0;

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

        log.info('All user tokens revoked', { userId, count: revokedCount });
        this.metrics.incrementCounter('user_tokens_revoked_total', revokedCount);
        return revokedCount;
    }

    private cleanupMemory(): void {
        const now = Date.now() / 1000;
        let cleanedCount = 0;
        
        for (const [jti, data] of this.memoryFallback.entries()) {
            if (now > data.exp) {
                this.memoryFallback.delete(jti);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            log.debug('Memory blacklist cleanup', { cleanedCount });
            this.metrics.recordMetric('memory_blacklist_cleaned', cleanedCount);
        }
    }

    getMetrics(): Record<string, number> {
        return {
            ...this.metrics.getMetrics(),
            memory_blacklist_size: this.memoryFallback.size
        };
    }
}

// ============ REFRESH TOKEN MANAGER (Replay attack koruması ile) ============
class RefreshTokenManager {
    private static instance: RefreshTokenManager;
    private redisPool: RedisPool;
    private memoryStore: Map<string, { userId: string; expiresAt: number; fingerprint: string }> = new Map();
    private readonly MAX_MEMORY_ENTRIES = 5000;
    private metrics: MetricsCollector;

    private constructor() {
        this.redisPool = RedisPool.getInstance();
        this.metrics = new MetricsCollector();
        setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }

    static getInstance(): RefreshTokenManager {
        if (!RefreshTokenManager.instance) {
            RefreshTokenManager.instance = new RefreshTokenManager();
        }
        return RefreshTokenManager.instance;
    }

    async storeRefreshToken(jti: string, userId: string, expiresIn: number, fingerprint: string): Promise<void> {
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
            log.debug('Refresh token stored in memory', { jti });
            this.metrics.incrementCounter('refresh_token_stored_memory');
        } else {
            this.metrics.incrementCounter('refresh_token_stored_redis');
        }
    }

    async validateRefreshToken(jti: string, fingerprint: string): Promise<string | null> {
        // Check if already used (replay attack prevention)
        const isUsed = await this.redisPool.execute(async (redis) => {
            return await redis.get(`refresh:used:${jti}`);
        });

        if (isUsed) {
            // Token replay attack! Revoke all user tokens
            log.warn('Refresh token replay attack detected', { jti });
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
            if (!data) return null;
            
            const parsed = JSON.parse(data) as { userId: string; fingerprint: string };
            
            // Validate fingerprint
            if (parsed.fingerprint !== fingerprint) {
                log.warn('Refresh token fingerprint mismatch', { jti, userId: parsed.userId });
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

    private async getUserIdFromUsedToken(jti: string): Promise<string | null> {
        const result = await this.redisPool.execute(async (redis) => {
            const data = await redis.get(`refresh:used:${jti}`);
            if (!data || data === 'used') return null;
            return data;
        });
        
        if (result) return result;
        
        // Check memory
        for (const [key, value] of this.memoryStore.entries()) {
            if (key === jti) return value.userId;
        }
        
        return null;
    }

    async revokeRefreshToken(jti: string): Promise<void> {
        // Try Redis
        await this.redisPool.execute(async (redis) => {
            const data = await redis.get(`refresh:${jti}`);
            if (data) {
                const parsed = JSON.parse(data) as { userId: string };
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

    async revokeAllUserRefreshTokens(userId: string): Promise<number> {
        let revokedCount = 0;

        // Try Redis
        const redisResult = await this.redisPool.execute(async (redis) => {
            const tokens = await redis.smembers(`user:${userId}:refresh_tokens`);
            if (tokens.length === 0) return 0;

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

        log.info('All user refresh tokens revoked', { userId, count: revokedCount });
        this.metrics.incrementCounter('user_refresh_tokens_revoked_total', revokedCount);
        return revokedCount;
    }

    private cleanup(): void {
        const now = Date.now() / 1000;
        let cleanedCount = 0;
        
        for (const [jti, data] of this.memoryStore.entries()) {
            if (now > data.expiresAt) {
                this.memoryStore.delete(jti);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            log.debug('Refresh token memory cleanup', { cleanedCount });
            this.metrics.recordMetric('memory_refresh_cleaned', cleanedCount);
        }
    }

    getMetrics(): Record<string, number> {
        return {
            ...this.metrics.getMetrics(),
            memory_refresh_size: this.memoryStore.size
        };
    }
}

// ============ RATE LIMITER (Gelişmiş key stratejisi ile) ============
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipOnRedisFailure?: boolean;
}

class RateLimiter {
    private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();
    private redisPool: RedisPool;
    private config: RateLimitConfig;
    private metrics: MetricsCollector;

    constructor(config: RateLimitConfig) {
        this.config = {
            skipOnRedisFailure: true,
            ...config
        };
        this.redisPool = RedisPool.getInstance();
        this.metrics = new MetricsCollector();
        
        // Cleanup every hour
        setInterval(() => this.cleanupMemory(), 60 * 60 * 1000);
    }

    async checkLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
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

    private cleanupMemory(): void {
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

    getMetrics(): Record<string, number> {
        return {
            ...this.metrics.getMetrics(),
            memory_rate_limit_size: this.memoryStore.size
        };
    }
}

// ============ DEPENDENCY INJECTION CONTAINER ============
interface AuthDependencies {
    tenantPool: Pool;
    platformPool: Pool;
    jwtSecret?: string;
    jwtIssuer?: string;
    jwtAudience?: string;
    accessTokenExpiry?: string;
    refreshTokenExpiry?: string;
}

class AuthService {
    private tenantPool: Pool;
    private platformPool: Pool;
    private jwtSecret: string;
    private jwtIssuer: string;
    private jwtAudience: string;
    private accessTokenExpiry: string;
    private refreshTokenExpiry: string;
    private blacklist: TokenBlacklist;
    private refreshManager: RefreshTokenManager;
    private rateLimiter: RateLimiter;
    private metrics: MetricsCollector;

    constructor(deps: AuthDependencies) {
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
        
        log.info('AuthService initialized', {
            accessTokenExpiry: this.accessTokenExpiry,
            refreshTokenExpiry: this.refreshTokenExpiry
        });
    }

    private generateJTI(userId: string, type: 'access' | 'refresh'): string {
        return `${type}:${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
    }

    private generateDeviceFingerprint(req: Request): string {
        const components = [
            req.ip,
            req.headers['user-agent'],
            req.headers['accept-language'],
            req.headers['sec-ch-ua-platform']
        ].filter(Boolean);
        
        return crypto.createHash('sha256').update(components.join('|')).digest('hex');
    }

    async createTokenPair(userId: string, req?: Request): Promise<TokenPair> {
        const fingerprint = req ? this.generateDeviceFingerprint(req) : 'unknown';
        const userAgent = req?.headers['user-agent'] || 'unknown';
        
        const accessJTI = this.generateJTI(userId, 'access');
        const refreshJTI = this.generateJTI(userId, 'refresh');

        const accessToken = jwt.sign(
            {
                userId,
                jti: accessJTI,
                type: 'access',
                iss: this.jwtIssuer,
                aud: this.jwtAudience,
                fingerprint,
                userAgent
            },
            this.jwtSecret,
            { expiresIn: this.accessTokenExpiry, algorithm: 'HS256' }
        );

        const refreshToken = jwt.sign(
            {
                userId,
                jti: refreshJTI,
                type: 'refresh',
                iss: this.jwtIssuer,
                aud: this.jwtAudience,
                fingerprint,
                userAgent
            },
            this.jwtSecret,
            { expiresIn: this.refreshTokenExpiry, algorithm: 'HS256' }
        );

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

    async refreshAccessToken(refreshToken: string, req?: Request): Promise<TokenPair | null> {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, this.jwtSecret, {
                algorithms: ['HS256'],
                issuer: this.jwtIssuer,
                audience: this.jwtAudience
            }) as RefreshTokenPayload;

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
        } catch (error) {
            log.error('Refresh token failed:', errorToLogMeta(error));
            this.metrics.incrementCounter('refresh_token_failed');
            return null;
        }
    }

    async revokeAllTokens(userId: string): Promise<void> {
        await this.blacklist.revokeAllUserTokens(userId);
        await this.refreshManager.revokeAllUserRefreshTokens(userId);
        this.metrics.incrementCounter('all_tokens_revoked');
    }

    async verifyAccessToken(token: string, fingerprint?: string): Promise<JwtPayload | null> {
        try {
            const decoded = jwt.verify(token, this.jwtSecret, {
                algorithms: ['HS256'],
                issuer: this.jwtIssuer,
                audience: this.jwtAudience
            }) as JwtPayload;

            if (decoded.type !== 'access') {
                this.metrics.incrementCounter('access_token_wrong_type');
                return null;
            }
            
            // Optional fingerprint validation
            if (fingerprint && decoded.fingerprint && decoded.fingerprint !== fingerprint) {
                log.warn('Access token fingerprint mismatch', { userId: decoded.userId });
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
            if (!isValidUUID(decoded.userId)) {
                this.metrics.incrementCounter('access_token_invalid_userid');
                return null;
            }

            this.metrics.incrementCounter('access_token_valid');
            return decoded;
        } catch (error) {
            this.metrics.incrementCounter('access_token_verification_failed');
            return null;
        }
    }

    async checkRateLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
        return this.rateLimiter.checkLimit(key);
    }

    private parseExpiresIn(expiresIn: string): number {
        const units: Record<string, number> = {
            s: 1, m: 60, h: 3600, d: 86400, w: 604800
        };
        const match = expiresIn.match(/^(\d+)(s|m|h|d|w)$/);
        if (!match) return 3600;
        return parseInt(match[1], 10) * (units[match[2]] || 1);
    }

    async healthCheck(): Promise<{
        jwtConfigured: boolean;
        redisAvailable: boolean;
        rateLimiterHealthy: boolean;
        metrics: Record<string, number>;
    }> {
        const redisPool = RedisPool.getInstance();
        const redisAvailable = await redisPool.healthCheck();
        
        return {
            jwtConfigured: this.jwtSecret.length >= 32,
            redisAvailable,
            rateLimiterHealthy: true,
            metrics: this.getMetrics()
        };
    }

    getMetrics(): Record<string, number> {
        return {
            ...this.metrics.getMetrics(),
            ...this.blacklist.getMetrics(),
            ...this.refreshManager.getMetrics(),
            ...this.rateLimiter.getMetrics()
        };
    }
}

// ============ EXPRESS MIDDLEWARES ============

let authService: AuthService | null = null;

export const initializeAuth = (deps: AuthDependencies): AuthService => {
    authService = new AuthService(deps);
    return authService;
};

export const getAuthService = (): AuthService => {
    if (!authService) {
        throw new Error('Auth not initialized. Call initializeAuth first.');
    }
    return authService;
};

// Device fingerprint middleware
export const fingerprintMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const components = [
        req.ip,
        req.headers['user-agent'],
        req.headers['accept-language'],
        req.headers['sec-ch-ua-platform']
    ].filter(Boolean);
    
    req.deviceFingerprint = crypto.createHash('sha256').update(components.join('|')).digest('hex');
    next();
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const service = getAuthService();
    
    // Rate limiting with better key strategy
    const rateKey = req.userId 
        ? `auth:user:${req.userId}` 
        : `auth:ip:${req.ip}`;
    
    const rateLimit = await service.checkRateLimit(rateKey);
    if (!rateLimit.allowed) {
        sendError(res, '100-001-009', 'Too many requests', 429);
        return;
    }
    
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader?.split(' ')[1];
    
    if (!token) {
        sendError(res, '100-001-001', 'No token provided', 401);
        return;
    }
    
    const decoded = await service.verifyAccessToken(token, req.deviceFingerprint);
    if (!decoded) {
        sendError(res, '100-001-002', 'Invalid or expired token', 401);
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
    } finally {
        client.release();
    }
};

export const platformAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const service = getAuthService();
    
    const rateKey = `platform:${req.ip}`;
    const rateLimit = await service.checkRateLimit(rateKey);
    if (!rateLimit.allowed) {
        sendError(res, '100-001-009', 'Too many requests', 429);
        return;
    }
    
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader?.split(' ')[1];
    
    if (!token) {
        sendError(res, '100-001-001', 'No token provided', 401);
        return;
    }
    
    const decoded = await service.verifyAccessToken(token, req.deviceFingerprint);
    if (!decoded) {
        sendError(res, '100-001-002', 'Invalid or expired token', 401);
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
    } finally {
        client.release();
    }
};

export const refreshTokenMiddleware = async (req: Request, res: Response): Promise<void> => {
    const service = getAuthService();
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        sendError(res, '100-001-001', 'No refresh token provided', 401);
        return;
    }
    
    const tokenPair = await service.refreshAccessToken(refreshToken, req);
    if (!tokenPair) {
        sendError(res, '100-001-002', 'Invalid refresh token', 401);
        return;
    }
    
    res.json(tokenPair);
};

export const logoutMiddleware = async (req: Request, res: Response): Promise<void> => {
    const service = getAuthService();
    
    if (req.tokenInfo?.jti && req.userId) {
        const decoded = jwt.decode(req.token!) as JwtPayload;
        if (decoded?.exp) {
            await service['blacklist'].addToBlacklist(req.tokenInfo.jti, decoded.exp, req.userId);
        }
    }
    
    res.json({ message: 'Logged out successfully' });
};

export const revokeAllTokensMiddleware = async (req: Request, res: Response): Promise<void> => {
    const service = getAuthService();
    
    if (!req.userId) {
        sendError(res, '100-001-001', 'User ID required', 400);
        return;
    }
    
    await service.revokeAllTokens(req.userId);
    res.json({ message: 'All tokens revoked successfully' });
};

export const metricsMiddleware = async (req: Request, res: Response): Promise<void> => {
    const service = getAuthService();
    const metrics = service.getMetrics();
    res.json(metrics);
};

// ============ EXPORTS ============
export {
    AuthService,
    AuthDependencies,
    TokenPair,
    JwtPayload,
    RefreshTokenPayload,
    RedisPool,
    TokenBlacklist,
    RefreshTokenManager,
    RateLimiter,
    MetricsCollector
};
