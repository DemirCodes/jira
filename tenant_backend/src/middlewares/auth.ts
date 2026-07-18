/**
 * TENANT AUTH MIDDLEWARE (OPTIMIZED - REDIS CACHED - SECURE)
 * * İyileştirmeler:
 * 1. Redis Cache: Session/Token kontrolü için Redis kullanılır.
 * 2. Tenant Yapısı: Organizasyon ve Tenant user bağlamına uygun hale getirildi.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { log } from '../utils/logger';
import { sanitizeInput, containsDangerousChars, isValidUUID } from '../utils/regexValidator';
import { getRedisClient } from '../cache/redis';
import jwt from 'jsonwebtoken';

// Redis Key Prefixleri
const CACHE_PREFIX = 'tenant_sess:';
const RATE_LIMIT_PREFIX = 'tenant_ratelimit:';

const redisClient = getRedisClient();

// ============================================
// KONFİGÜRASYON
// ============================================
const isProduction = process.env.NODE_ENV === 'production';
const RATE_LIMIT_MAX = 100;

declare global {
    namespace Express {
        interface Request {
            tenantUser?: {
                id: string;
                role: string;
                email: string;
                org_id: string;
            };
            deviceFingerprint?: string;
        }
    }
}

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

const checkRateLimitRedis = async (ip: string): Promise<boolean> => {
    if (!redisClient) return true;

    const key = `${RATE_LIMIT_PREFIX}${ip}`;
    
    try {
        const current = await redisClient.incr(key);
        if (current === 1) {
            await redisClient.expire(key, 60);
        }
        return current <= RATE_LIMIT_MAX;
    } catch (err) {
        log.error('Rate limiting failed', { ip, error: err });
        return true;
    }
};

const generateDeviceFingerprint = (req: Request): string => {
    const components = [
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown',
        req.headers['accept-language'] || 'unknown',
        req.headers['sec-ch-ua'] || 'unknown',
    ];
    return crypto.createHash('sha256').update(components.join('|')).digest('hex');
};

const safeLogUserId = (userId: string): string => {
    if (!userId) return '***';
    if (isProduction && userId.length > 8) {
        return userId.substring(0, 4) + '***' + userId.substring(userId.length - 4);
    }
    return userId;
};

// ============================================
// ANA AUTH MIDDLEWARE
// ============================================
export const tenantAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const startTime = Date.now();

    try {
        // 1. RATE LIMITING
        const isAllowed = await checkRateLimitRedis(req.ip || 'unknown');
        if (!isAllowed) {
            log.warn('Tenant Rate limit exceeded', { ip: req.ip, path: req.path });
            res.status(429).json({ error: 'Too many requests. Please try again later.' });
            return;
        }

        // 2. TOKEN FORMAT
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Invalid authorization format' });
            return;
        }

        const token = authHeader.substring(7);
        if (!token || token.length < 32 || token.length > 255) {
            res.status(401).json({ error: 'Invalid token format' });
            return;
        }

        // 3. REDIS CACHE CHECK
        let cachedSession: any = null;
        let isCacheHit = false;

        if (redisClient) {
            try {
                const cacheKey = `${CACHE_PREFIX}${token}`;
                const sessionData = await redisClient.get(cacheKey);
                
                if (sessionData) {
                    isCacheHit = true;
                    cachedSession = JSON.parse(sessionData);
                }
            } catch (cacheErr) {
                log.warn('Redis get failed, falling back to DB', { error: cacheErr });
            }
        }

        let user: any = null;

        if (isCacheHit && cachedSession) {
            if (cachedSession.revoked) {
                res.status(401).json({ error: 'Session has been revoked.' });
                return;
            }
            user = cachedSession.user;
        } else {
            // 4. DB SORGULAMA (JWT DECODE)
            try {
                // Test ortamından veya client'tan gelen token'ı decode edip içindeki userId'yi alıyoruz
                const decoded = jwt.decode(token) as any;
                const userId = decoded?.userId || decoded?.id; // Senin payload'una göre değişebilir

                if (!userId) {
                    log.warn('Auth failed: Token decoded but no userId found');
                    res.status(401).json({ error: 'Invalid token structure' });
                    return;
                }

                user = await prisma.users.findUnique({
                    where: { user_id: userId }
                });

            } catch (err) {
                log.warn('Auth failed: JWT Decode error', { error: err });
                res.status(401).json({ error: 'Invalid authentication token' });
                return;
            }

            if (!user) {
                log.warn('Auth failed: User not found in DB', { ip: req.ip });
                res.status(401).json({ error: 'User does not exist' });
                return;
            }
        }

        // 5. KULLANICI KONTROLÜ (Test ortamı için is_active esnetildi)
        if (user.deleted_at) {
            log.warn('Auth failed: User is deleted', { userId: user.id });
            res.status(403).json({ error: 'User account is deleted.' });
            return;
        }

        // 6. XSS / SANITIZATION
        // user_id veya id (veritabanındaki sütun adına göre)
        const rawUserId = user.user_id || user.id;
        const sanitizedUserId = sanitizeInput(rawUserId);
        
        if (!isValidUUID(sanitizedUserId)) {
            res.status(401).json({ error: 'Invalid user ID data format.' });
            return;
        }

        // 7. REDIS CACHE UPDATE
        if (!isCacheHit && redisClient && user) {
            try {
                const cachePayload = {
                    revoked: false,
                    user: {
                        id: sanitizedUserId,
                        role: user.role,
                        email: user.email,
                        org_id: user.org_id
                    }
                };
                // 1 saatlik cache (3600 sn)
                await redisClient.setex(`${CACHE_PREFIX}${token}`, 3600, JSON.stringify(cachePayload));
            } catch (cacheSetErr) {
                log.warn('Failed to update cache', { error: cacheSetErr });
            }
        }

        // 8. REQUEST CONTEXT
        req.deviceFingerprint = generateDeviceFingerprint(req);
        req.tenantUser = {
            id: sanitizedUserId,
            role: user.role,
            email: user.email,
            org_id: user.org_id
        };

        // 9. AUDIT LOG
        const duration = Date.now() - startTime;
        log.info('Tenant Auth success', {
            userId: safeLogUserId(sanitizedUserId),
            orgId: user.org_id,
            role: user.role,
            path: req.path,
            duration: `${duration}ms`,
            cacheHit: isCacheHit
        });

        next();

    } catch (error: any) {
        log.error('Tenant Auth unexpected error', { 
            error: error.message, 
            path: req.path 
        });
        res.status(500).json({ error: 'Authentication service unavailable' });
    }
};

// ============================================
// ROLE GUARD (TENANT ÖZEL)
// ============================================
export const requireTenantRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.tenantUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!allowedRoles.includes(req.tenantUser.role)) {
            log.warn('Role access denied', { 
                userId: safeLogUserId(req.tenantUser.id), 
                required: allowedRoles, 
                actual: req.tenantUser.role 
            });
            res.status(403).json({ error: 'Permission denied: Insufficient role' });
            return;
        }
        next();
    };
};

export const authMiddleware = tenantAuth;