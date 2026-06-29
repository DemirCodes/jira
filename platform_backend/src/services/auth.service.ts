import { prisma } from '../db/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { getRedisClient } from '../cache/redis';
import { log } from '../utils/logger';

const CACHE_PREFIX = 'plat_sess:';
const redisClient = getRedisClient();

export const platformLogin = async (email: string, passwordPlain: string, ipAddress?: string) => {
    // 1. Kullanıcıyı getir
    const user = await prisma.platform_users.findUnique({
        where: { email },
    });

    // Kullanıcı yoksa, aktif değilse veya silinmişse güvenli red + Log
    if (!user || !user.is_active || user.deleted_at) {
        await prisma.login_attempts.create({
            data: { email, ip_address: ipAddress, success: false }
        });
        throw new AppError(ErrorCodes.AUTH_INVALID_CREDENTIALS, 'Invalid email or password');
    }

    // 2. Bcrypt Şifre Doğrulaması
    const isPasswordValid = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isPasswordValid) {
        await prisma.login_attempts.create({
            data: { email, ip_address: ipAddress, success: false }
        });
        throw new AppError(ErrorCodes.AUTH_INVALID_CREDENTIALS, 'Invalid email or password');
    }

    // 3. Başarılı Giriş Logu
    await prisma.login_attempts.create({
        data: { email, ip_address: ipAddress, success: true }
    });

    // 4. Token Üretimi (32 byte Opaque Hex)
    const token = crypto.randomBytes(32).toString('hex');
    
    // 7 günlük geçerlilik süresi
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 5. DB Session Kaydı
    await prisma.user_sessions.create({
        data: {
            platform_user_id: user.platform_user_id,
            token,
            expires_at: expiresAt
        }
    });

    // 6. PROACTIVE CACHING (Redis'e anında bas)
    // Middleware'in ilk istekte DB'ye gitmesini engelliyoruz (Performans %99 artar)
    if (redisClient) {
        try {
            const remainingTTL = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
            const cachePayload = {
                revoked: false,
                user: {
                    id: user.platform_user_id,
                    role: user.role,
                    email: user.email
                }
            };
            await redisClient.setex(
                `${CACHE_PREFIX}${token}`,
                remainingTTL,
                JSON.stringify(cachePayload)
            );
        } catch (err) {
            log.warn('Redis cache failed during login (Fail-Open)', { error: err });
        }
    }

    return {
        token,
        user: {
            id: user.platform_user_id,
            email: user.email,
            role: user.role
        }
    };
};

export const platformLogout = async (token: string) => {
    // 1. DB'de Token'ı iptal et (Revoke)
    const result = await prisma.user_sessions.updateMany({
        where: { 
            token,
            revoked_at: null 
        },
        data: { 
            revoked_at: new Date() 
        }
    });

    // 2. CACHE INVALIDATION (Redis'ten sil)
    // Hayalet oturum (Ghost session) oluşmasını engelliyoruz
    if (redisClient) {
        try {
            await redisClient.del(`${CACHE_PREFIX}${token}`);
            log.info('Session cache cleared on logout');
        } catch (err) {
            log.warn('Failed to clear session cache during logout', { error: err });
        }
    }

    return result.count > 0;
};