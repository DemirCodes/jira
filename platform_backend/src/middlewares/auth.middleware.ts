import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { log } from '../utils/logger';
import { sanitizeInput, containsDangerousChars, isValidUUID } from '../utils/regexValidator';
import { getRedisClient } from '../cache/redis';

const CACHE_PREFIX = 'plat_sess:';
const RATE_LIMIT_PREFIX = 'plat_ratelimit:';
const redisClient = getRedisClient();
const isProduction = process.env.NODE_ENV === 'production';
const RATE_LIMIT_MAX = 100;

declare global {
    namespace Express {
        interface Request {
            platformUser?: {
                id: string;
                role: 'super_admin' | 'support_admin' | 'billing_admin';
                email: string;
            };
            deviceFingerprint?: string;
        }
    }
}

const checkRateLimitRedis = async (ip: string): Promise<boolean> => {
    if (!redisClient) return true;
    const key = `${RATE_LIMIT_PREFIX}${ip}`;
    try {
        const current = await redisClient.incr(key);
        if (current === 1) await redisClient.expire(key, 60);
        return current <= RATE_LIMIT_MAX;
    } catch (err) {
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

// İŞTE ROUTE'UN ARADIĞI EXPORT BURADA! (platformAuth)
export const platformAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    try {
        const isAllowed = await checkRateLimitRedis(req.ip || 'unknown');
        if (!isAllowed) {
            res.status(429).json({ error: 'Too many requests. Please try again later.' });
            return;
        }

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

        let cachedSession: any = null;
        let isCacheHit = false;

        if (redisClient) {
            try {
                const sessionData = await redisClient.get(`${CACHE_PREFIX}${token}`);
                if (sessionData) {
                    isCacheHit = true;
                    cachedSession = JSON.parse(sessionData);
                }
            } catch (cacheErr) {}
        }

        let session = null;
        let user = null;

        if (isCacheHit && cachedSession) {
            if (cachedSession.revoked) {
                res.status(401).json({ error: 'Session has been revoked.' });
                return;
            }
            user = cachedSession.user;
        } else {
            // DB KONTROLÜ: tenantPool yerine Prisma ile platform_db'ye bakıyoruz
            session = await prisma.user_sessions.findUnique({
                where: { token },
                include: { platform_users: true },
            });

            if (!session || session.revoked_at || session.expires_at < new Date()) {
                res.status(401).json({ error: 'Invalid or expired session' });
                return;
            }
            user = session.platform_users;
        }

        if (!user || user.is_active === false || user.deleted_at) {
            res.status(403).json({ error: 'User account is inactive or deleted.' });
            return;
        }

        const sanitizedUserId = sanitizeInput(user.platform_user_id || user.id);
        if (!isValidUUID(sanitizedUserId)) {
            res.status(401).json({ error: 'Invalid user ID data format.' });
            return;
        }

        if (!isCacheHit && redisClient && session) {
            try {
                const remainingTTL = Math.floor((session.expires_at.getTime() - Date.now()) / 1000);
                if (remainingTTL > 0) {
                    await redisClient.setex(
                        `${CACHE_PREFIX}${session.token}`, 
                        remainingTTL, 
                        JSON.stringify({ revoked: false, user: { id: sanitizedUserId, role: user.role, email: user.email } })
                    );
                }
            } catch (cacheSetErr) {}
        }

        req.deviceFingerprint = generateDeviceFingerprint(req);
        req.platformUser = {
            id: sanitizedUserId,
            role: user.role as 'super_admin' | 'support_admin' | 'billing_admin',
            email: user.email
        };

        next();
    } catch (error: any) {
        res.status(500).json({ error: 'Authentication service unavailable' });
    }
};

export const requirePlatformRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.platformUser || !allowedRoles.includes(req.platformUser.role)) {
            res.status(403).json({ error: 'Permission denied: Insufficient role' });
            return;
        }
        next();
    };
};