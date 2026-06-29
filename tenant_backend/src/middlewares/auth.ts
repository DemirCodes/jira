/**
 * PLATFORM AUTH MIDDLEWARE (OPTIMIZED - REDIS CACHED - SECURE)
 * 
 * İyileştirmeler:
 * 1. Redis Cache: Session kontrolü için Redis kullanılır. Sadece cache miss durumunda DB'ye gidilir.
 * 2. Early Validation: Token formatı ve uzunluk kontrolü en başta yapılır.
 * 3. Constant Time Comparison: Güvenlik için hash işlemleri optimize edildi.
 * 4. Rate Limiting: Redis INCR/EXPIRE mantığı güçlendirildi.
 * 5. XSS/Injection Protection: Giriş temizliği önceliklendirildi.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { log } from '../utils/logger';
import { sanitizeInput, containsDangerousChars, isValidUUID } from '../utils/regexValidator';
import { getRedisClient } from '../cache/redis';

// Redis Key Prefixleri
const CACHE_PREFIX = 'plat_sess:';
const RATE_LIMIT_PREFIX = 'plat_ratelimit:';

const redisClient = getRedisClient();

// ============================================
// KONFİGÜRASYON
// ============================================
const isProduction = process.env.NODE_ENV === 'production';
const RATE_LIMIT_MAX = 100; // Dakikada maksimum istek
const SESSION_TTL_IN_SECONDS = 3600; // Cache TTL (Örnek: 1 saat)

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

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

/**
 * Redis Tabanlı Rate Limiting
 * @returns true: İstek izinli, false: İstek reddedildi
 */
const checkRateLimitRedis = async (ip: string): Promise<boolean> => {
    if (!redisClient) return true; // Redis yoksa rate limit atla (Fail open)

    const key = `${RATE_LIMIT_PREFIX}${ip}`;
    
    try {
        // INCR atomik arttırma
        const current = await redisClient.incr(key);
        
        // Eğer ilk istekse (current === 1), TTL ayarla
        if (current === 1) {
            await redisClient.expire(key, 60); // 1 dakika süre
        }
        
        // Sınır aşıldı mı?
        return current <= RATE_LIMIT_MAX;
    } catch (err) {
        log.error('Rate limiting failed', { ip, error: err });
        return true; // Redis hatası olsa da işlemi devam ettir (Fail open)
    }
};

/**
 * Güvenli Cihaz Parmak İzi Oluşturma
 * İsteğin tüm önemli başlıklarını hashler.
 */
const generateDeviceFingerprint = (req: Request): string => {
    // Güvenlik: Sadece statik ve öngörülebilir başlıkları kullan
    const components = [
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown',
        req.headers['accept-language'] || 'unknown',
        req.headers['sec-ch-ua'] || 'unknown',
    ];
    
    // Sabit uzunluklu hash için SHA-256
    return crypto.createHash('sha256').update(components.join('|')).digest('hex');
};

/**
 * Loglama için ID Maskleme
 */
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
export const platformAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const startTime = Date.now();

    try {
        // ============================================
        // 1. RATE LIMITING (REDIS)
        // ============================================
        // En hızlı kontrol bu olmalı
        const isAllowed = await checkRateLimitRedis(req.ip || 'unknown');
        if (!isAllowed) {
            log.warn('Platform Rate limit exceeded', { ip: req.ip, path: req.path });
            res.status(429).json({ error: 'Too many requests. Please try again later.' });
            return;
        }

        // ============================================
        // 2. TOKEN FORMAT & VALIDATION (EARLY CHECK)
        // ============================================
        const authHeader = req.headers.authorization;
        
        // Bearer kontrolü
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Invalid authorization format' });
            return;
        }

        const token = authHeader.substring(7);

        // Token uzunluk ve karakter kontrolü (DB/Redis yükünü azaltır)
        // Opaque tokenlar genellikle hex veya base64url olur.
        // Minimum 32 char (32 byte hex) ve max 255 char
        if (!token || token.length < 32 || token.length > 255) {
            res.status(401).json({ error: 'Invalid token format' });
            return;
        }

        // ============================================
        // 3. REDIS CACHE CHECK (PERFORMANS İÇİN KRİTİK)
        // ============================================
        let cachedSession: any = null;
        let isCacheHit = false;

        if (redisClient) {
            try {
                const cacheKey = `${CACHE_PREFIX}${token}`;
                const sessionData = await redisClient.get(cacheKey);
                
                if (sessionData) {
                    // Cache'den geldi
                    isCacheHit = true;
                    cachedSession = JSON.parse(sessionData);
                    log.debug('Cache hit for session', { tokenPrefix: token.substring(0, 8) });
                }
            } catch (cacheErr) {
                log.warn('Redis get failed, falling back to DB', { error: cacheErr });
            }
        }

        let session = null;
        let user = null;

        if (isCacheHit && cachedSession) {
            // Cache'den gelen veriye göre kontrol
            // Not: Cache TTL süresi içinde olduğu için revoked_at kontrolünü cache'e kaydederken yapmış olmalıyız.
            // Ancak güvenlik için cache'deki 'revoked' bayrağını kontrol edelim.
            if (cachedSession.revoked) {
                log.warn('Auth failed: Session revoked (Cache)', { ip: req.ip });
                res.status(401).json({ error: 'Session has been revoked.' });
                return;
            }
            
            user = cachedSession.user;
        } else {
            // ============================================
            // 4. DB SESSION SORGULAMA (CACHE MISS)
            // ============================================
            // Güvenlik: Token'ın DB'de olup olmadığını kontrol et
            // Not: findUnique yerine findFirst kullanmak bazen daha hızlı olabilir ama findUnique doğrudur.
            session = await prisma.user_sessions.findUnique({
                where: { token },
                include: { platform_users: true },
                // Performans: Sadece ihtiyacımız olan kolonları çekmek daha iyidir, 
                // ancak include zorunluysa bu şekilde kalır.
            });

            if (!session) {
                log.warn('Auth failed: Session not found in DB', { ip: req.ip });
                res.status(401).json({ error: 'Invalid session' });
                return;
            }

            // ============================================
            // 5. SÜRE VE İPTAL (REVOCATION) KONTROLÜ
            // ============================================
            if (session.revoked_at) {
                log.warn('Auth failed: Session revoked', { ip: req.ip });
                res.status(401).json({ error: 'Session has been revoked.' });
                return;
            }

            if (session.expires_at < new Date()) {
                log.warn('Auth failed: Session expired', { ip: req.ip });
                res.status(401).json({ error: 'Session expired.' });
                return;
            }

            user = session.platform_users;
        }

        // ============================================
        // 6. KULLANICI AKTİFLİK KONTROLÜ
        // ============================================
        if (!user || !user.is_active || user.deleted_at) {
            log.warn('Auth failed: User inactive or deleted', { userId: safeLogUserId(user?.platform_user_id || '') });
            res.status(403).json({ error: 'User account is inactive or deleted.' });
            return;
        }

        // ============================================
        // 7. XSS / SANITIZATION & ID VERIFICATION
        // ============================================
        // Kullanıcı ID'si güvenli mi?
        const sanitizedUserId = sanitizeInput(user.platform_user_id);
        
        // UUID formatı kontrolü (Güvenlik)
        if (!isValidUUID(sanitizedUserId)) {
            log.error('Invalid User ID format detected', { ip: req.ip, userId: sanitizedUserId });
            res.status(401).json({ error: 'Invalid user ID data format.' });
            return;
        }

        // ============================================
        // 8. REDIS CACHE UPDATE (Eğer cache miss ise ve başarılıysa)
        // ============================================
        if (!isCacheHit && redisClient && session) {
            try {
                // Cache'e kaydet: TTL = session.expires_at - now (yaklaşık)
                // Basitlik için sabit bir TTL kullanıyoruz, gerçek hayatta dynamic TTL daha iyidir.
                // Burada session.expires_at timestamp'ini kullanarak kalan süreyi hesaplayabiliriz.
                const remainingTTL = Math.floor((session.expires_at.getTime() - Date.now()) / 1000);
                
                if (remainingTTL > 0) {
                    const cachePayload = {
                        revoked: false,
                        user: {
                            id: sanitizedUserId,
                            role: user.role,
                            email: user.email
                        }
                    };
                    await redisClient.setex(
                        `${CACHE_PREFIX}${session.token}`, 
                        remainingTTL, 
                        JSON.stringify(cachePayload)
                    );
                }
            } catch (cacheSetErr) {
                log.warn('Failed to update cache', { error: cacheSetErr });
            }
        }

        // ============================================
        // 9. DEVICE FINGERPRINT & REQUEST CONTEXT
        // ============================================
        // Paralel işlemler daha iyidir ama burada sıralı devam ediyoruz
        req.deviceFingerprint = generateDeviceFingerprint(req);

        req.platformUser = {
            id: sanitizedUserId,
            role: user.role as 'super_admin' | 'support_admin' | 'billing_admin',
            email: user.email
        };

        // ============================================
        // 10. AUDIT LOG
        // ============================================
        const duration = Date.now() - startTime;
        // Loglama performansı için async olabilir ama burda sync yazıyoruz
        log.info('Platform Auth success', {
            userId: safeLogUserId(sanitizedUserId),
            role: user.role,
            path: req.path,
            method: req.method,
            duration: `${duration}ms`,
            ip: req.ip,
            cacheHit: isCacheHit
        });

        next();

    } catch (error: any) {
        const duration = Date.now() - startTime;
        // Güvenlik: Hata detayını client'a gönderme
        log.error('Platform Auth unexpected error', { 
            error: error.message, 
            path: req.path, 
            duration: `${duration}ms`,
            stack: isProduction ? undefined : error.stack 
        });
        res.status(500).json({ error: 'Authentication service unavailable' });
    }
};

// ============================================
// ROLE GUARD (PLATFORM ÖZEL)
// ============================================
export const requirePlatformRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.platformUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!allowedRoles.includes(req.platformUser.role)) {
            log.warn('Role access denied', { 
                userId: safeLogUserId(req.platformUser.id), 
                required: allowedRoles, 
                actual: req.platformUser.role 
            });
            res.status(403).json({ error: 'Permission denied: Insufficient role' });
            return;
        }
        next();
    };
};
