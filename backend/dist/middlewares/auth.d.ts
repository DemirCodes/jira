import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { Pool } from 'pg';
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
declare class MetricsCollector {
    private metrics;
    private counters;
    incrementCounter(name: string, amount?: number): void;
    recordMetric(name: string, value: number): void;
    getMetrics(): Record<string, number>;
    reset(): void;
}
declare class RedisPool {
    private static instance;
    private pool;
    private isConnected;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    private metrics;
    private constructor();
    static getInstance(): RedisPool;
    private setupGracefulShutdown;
    private initialize;
    getClient(): Promise<Redis | null>;
    execute<T>(operation: (client: Redis) => Promise<T>): Promise<T | null>;
    healthCheck(): Promise<boolean>;
    close(): Promise<void>;
    getMetrics(): Record<string, number>;
}
declare class TokenBlacklist {
    private static instance;
    private memoryFallback;
    private redisPool;
    private readonly MAX_MEMORY_ENTRIES;
    private metrics;
    private constructor();
    static getInstance(): TokenBlacklist;
    addToBlacklist(jti: string, exp: number, userId: string): Promise<void>;
    isBlacklisted(jti: string): Promise<{
        blacklisted: boolean;
        userId?: string;
    }>;
    revokeAllUserTokens(userId: string): Promise<number>;
    private cleanupMemory;
    getMetrics(): Record<string, number>;
}
declare class RefreshTokenManager {
    private static instance;
    private redisPool;
    private memoryStore;
    private readonly MAX_MEMORY_ENTRIES;
    private metrics;
    private constructor();
    static getInstance(): RefreshTokenManager;
    storeRefreshToken(jti: string, userId: string, expiresIn: number, fingerprint: string): Promise<void>;
    validateRefreshToken(jti: string, fingerprint: string): Promise<string | null>;
    private getUserIdFromUsedToken;
    revokeRefreshToken(jti: string): Promise<void>;
    revokeAllUserRefreshTokens(userId: string): Promise<number>;
    private cleanup;
    getMetrics(): Record<string, number>;
}
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipOnRedisFailure?: boolean;
}
declare class RateLimiter {
    private memoryStore;
    private redisPool;
    private config;
    private metrics;
    constructor(config: RateLimitConfig);
    checkLimit(key: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
    private cleanupMemory;
    getMetrics(): Record<string, number>;
}
interface AuthDependencies {
    tenantPool: Pool;
    platformPool: Pool;
    jwtSecret?: string;
    jwtIssuer?: string;
    jwtAudience?: string;
    accessTokenExpiry?: string;
    refreshTokenExpiry?: string;
}
declare class AuthService {
    private tenantPool;
    private platformPool;
    private jwtSecret;
    private jwtIssuer;
    private jwtAudience;
    private accessTokenExpiry;
    private refreshTokenExpiry;
    private blacklist;
    private refreshManager;
    private rateLimiter;
    private metrics;
    constructor(deps: AuthDependencies);
    private generateJTI;
    private generateDeviceFingerprint;
    createTokenPair(userId: string, req?: Request): Promise<TokenPair>;
    refreshAccessToken(refreshToken: string, req?: Request): Promise<TokenPair | null>;
    revokeAllTokens(userId: string): Promise<void>;
    verifyAccessToken(token: string, fingerprint?: string): Promise<JwtPayload | null>;
    checkRateLimit(key: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
    private parseExpiresIn;
    healthCheck(): Promise<{
        jwtConfigured: boolean;
        redisAvailable: boolean;
        rateLimiterHealthy: boolean;
        metrics: Record<string, number>;
    }>;
    getMetrics(): Record<string, number>;
}
export declare const initializeAuth: (deps: AuthDependencies) => AuthService;
export declare const getAuthService: () => AuthService;
export declare const fingerprintMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const platformAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const refreshTokenMiddleware: (req: Request, res: Response) => Promise<void>;
export declare const logoutMiddleware: (req: Request, res: Response) => Promise<void>;
export declare const revokeAllTokensMiddleware: (req: Request, res: Response) => Promise<void>;
export declare const metricsMiddleware: (req: Request, res: Response) => Promise<void>;
export { AuthService, AuthDependencies, TokenPair, JwtPayload, RefreshTokenPayload, RedisPool, TokenBlacklist, RefreshTokenManager, RateLimiter, MetricsCollector };
//# sourceMappingURL=auth.d.ts.map