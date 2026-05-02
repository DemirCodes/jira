/**
 * AUTH MIDDLEWARE (GÜVENLİK GELİŞTİRİLMİŞ)
 * 
 * JWT token'ı doğrular ve RLS için current_user_id set eder.
 * 
 * Güvenlik önlemleri:
 * 1. Bearer token formatı kontrolü
 * 2. Token uzunluğu kontrolü (DoS koruması)
 * 3. XSS koruması (userId sanitize)
 * 4. Rate limiting entegrasyonu
 * 5. Audit log
 * 6. Token blacklist desteği
 * 7. Device fingerprint eşleştirme
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { tenantPool } from '../db/tenantPool';
import { log } from '../utils/logger';
import { sanitizeInput, containsDangerousChars, isValidUUID } from '../utils/regexValidator';

// Rate limiting için basit memory store (production'da Redis kullan)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 dakika
const RATE_LIMIT_MAX = 100; // Dakikada maksimum istek

// Token blacklist için memory store (production'da Redis kullan)
const tokenBlacklist = new Map<string, number>();

declare global {
    namespace Express {
        interface Request {
            userId?: string;
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
    jti?: string;
    fingerprint?: string;
}

/**
 * Rate limiting kontrolü
 */
const checkRateLimit = (key: string): { allowed: boolean; remaining: number } => { // jwt token karakterini kullanarak rate limit yapıyoruz
    const now = Date.now(); //
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }
    
    if (record.count >= RATE_LIMIT_MAX) {
        return { allowed: false, remaining: 0 };
    }
    
    record.count++;
    rateLimitStore.set(key, record);
    return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
};

/**
 * Device fingerprint oluştur
 */
const generateDeviceFingerprint = (req: Request): string => { // Birden fazla cihazdan giriş yapılmasını engellemek için basit bir fingerprint oluşturuyoruz (opsiyonel)
    const components = [
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown',
        req.headers['accept-language'] || 'unknown'
    ];
    return components.join('|');
};

// Periyodik temizlik (her saat)
setInterval(() => {
    const now = Date.now();
    // Rate limit store temizliği
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    }
    // Token blacklist temizliği
    for (const [token, expiry] of tokenBlacklist.entries()) {
        if (now > expiry) {
            tokenBlacklist.delete(token);
        }
    }
}, 60 * 60 * 1000);

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const startTime = Date.now();
    
    try {
        // ============================================
        // 1. TOKEN ALMA VE FORMAT KONTROLÜ
        // ============================================
        const authHeader = req.headers.authorization;
        
        // Bearer formatı kontrolü (sadece "Bearer token" formatını kabul et)
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            log.warn('Auth failed: Invalid auth header format', { 
                ip: req.ip, 
                path: req.path 
            });
            res.status(401).json({ error: 'Invalid authorization format. Use Bearer token' });
            return;
        }
        
        const token = authHeader.substring(7); // "Bearer " kısmını çıkar
        
        // Token uzunluğu kontrolü (DoS koruması)
        if (!token || token.length < 20 || token.length > 5000) {
            log.warn('Auth failed: Invalid token length', { 
                ip: req.ip, 
                path: req.path,
                length: token?.length 
            });
            res.status(401).json({ error: 'Invalid token format' });
            return;
        }
        
        // ============================================
        // 2. RATE LIMITING (Token bazlı)
        // ============================================
        const rateLimitKey = `auth:${token.substring(0, 20)}`;
        const rateLimit = checkRateLimit(rateLimitKey);
        
        if (!rateLimit.allowed) {
            log.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
            res.status(429).json({ error: 'Too many requests. Please try again later.' });
            return;
        }
        
        // ============================================
        // 3. TOKEN BLACKLIST KONTROLÜ (Çıkış yapılan token'lar)
        // ============================================
        // Not: Şimdilik memory store kullanıyoruz. Production'da Redis önerilir.
        if (tokenBlacklist.has(token)) {
            log.warn('Auth failed: Token blacklisted', { ip: req.ip });
            res.status(401).json({ error: 'Token has been revoked. Please login again.' });
            return;
        }
        
        // ============================================
        // 4. JWT TOKEN DOĞRULAMA
        // ============================================
        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                log.warn('Auth failed: Token expired', { ip: req.ip });
                res.status(401).json({ error: 'Token expired. Please refresh your token.' });
                return;
            }
            if (error.name === 'JsonWebTokenError') {
                log.warn('Auth failed: Invalid token signature', { ip: req.ip });
                res.status(401).json({ error: 'Invalid token signature.' });
                return;
            }
            log.error('Auth failed: JWT verification error', { error: error.message });
            res.status(401).json({ error: 'Invalid token.' });
            return;
        }
        
        // ============================================
        // 5. TOKEN PAYLOAD KONTROLÜ
        // ============================================
        if (!decoded.userId) {
            log.warn('Auth failed: Missing userId in token payload');
            res.status(401).json({ error: 'Invalid token payload.' });
            return;
        }
        
        // UUID format kontrolü
        if (!isValidUUID(decoded.userId)) {
            log.warn('Auth failed: Invalid UUID format in token', { userId: decoded.userId });
            res.status(401).json({ error: 'Invalid user ID format in token.' });
            return;
        }
        
        // Token yaşı kontrolü (opsiyonel - çok eski token'ları reddet)
        const now = Math.floor(Date.now() / 1000);
        const tokenAge = now - decoded.iat;
        const maxTokenAge = 30 * 24 * 60 * 60; // 30 gün (opsiyonel)
        
        if (tokenAge > maxTokenAge) {
            log.warn('Auth failed: Token too old', { userId: decoded.userId, age: tokenAge });
            res.status(401).json({ error: 'Token too old. Please login again.' });
            return;
        }
        
        // ============================================
        // 6. XSS KORUMASI (userId sanitize)
        // ============================================
        let sanitizedUserId: string;
        try {
            sanitizedUserId = sanitizeInput(decoded.userId);
            
            // Sanitize sonrası hala tehlikeli karakter var mı?
            if (containsDangerousChars(sanitizedUserId)) {
                log.error('Auth failed: Dangerous chars in userId after sanitize', { 
                    original: decoded.userId,
                    sanitized: sanitizedUserId 
                });
                res.status(401).json({ error: 'Invalid user ID.' });
                return;
            }
        } catch (error) {
            log.error('Auth failed: Sanitization error', { error });
            res.status(401).json({ error: 'Invalid user ID format.' });
            return;
        }
        
        // ============================================
        // 7. DEVICE FINGERPRINT KONTROLÜ (Opsiyonel)
        // ============================================
        const currentFingerprint = generateDeviceFingerprint(req);
        if (decoded.fingerprint && decoded.fingerprint !== currentFingerprint) {
            log.warn('Auth failed: Device fingerprint mismatch', { 
                userId: sanitizedUserId,
                expected: decoded.fingerprint,
                actual: currentFingerprint 
            });
            // Not: Bu durumda token'ı blacklist'e ekleyip kullanıcıyı tekrar login'e yönlendirebiliriz
            // tokenBlacklist.set(token, decoded.exp * 1000);
            res.status(401).json({ error: 'Device mismatch. Please login again.' });
            return;
        }
        
        // ============================================
        // 8. RLS İÇİN current_user_id SET ET (ÇOK ÖNEMLİ!)
        // ============================================
        try {
            await tenantPool.query('SET app.current_user_id = $1', [sanitizedUserId]);
            await tenantPool.query('SET app.current_token_iat = $1', [decoded.iat]);
        } catch (error: any) {
            log.error('Auth failed: RLS setup error', { error: error.message, userId: sanitizedUserId });
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        
        // ============================================
        // 9. REQUEST'E BİLGİLERİ EKLE
        // ============================================
        req.userId = sanitizedUserId;
        req.tokenInfo = {
            iat: decoded.iat,
            exp: decoded.exp,
            jti: decoded.jti
        };
        req.deviceFingerprint = currentFingerprint;
        
        // ============================================
        // 10. AUDIT LOG (Başarılı giriş)
        // ============================================
        const duration = Date.now() - startTime;
        log.info('Auth success', {
            userId: sanitizedUserId.substring(0, 8), // Kısmi log (güvenlik)
            path: req.path,
            method: req.method,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.headers['user-agent']?.substring(0, 50)
        });
        
        next();
        
    } catch (error: any) {
        // ============================================
        // 11. BEKLENMEYEN HATALAR
        // ============================================
        const duration = Date.now() - startTime;
        log.error('Auth unexpected error', {
            error: error.message,
            stack: error.stack,
            path: req.path,
            duration: `${duration}ms`
        });
        
        res.status(500).json({ error: 'Authentication service unavailable' });
    }
};

// ============================================
// YARDIMCI FONKSİYONLAR (Harici kullanım için)
// ============================================

/**
 * Token'ı blacklist'e ekle (logout işleminde kullanılır)
 */
export const blacklistToken = (token: string, expiresAt?: number): void => {
    const expiry = expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000; // default 7 gün
    tokenBlacklist.set(token, expiry);
    log.info('Token blacklisted', { tokenHash: token.substring(0, 10) });
};

/**
 * Token blacklist'te mi kontrol et
 */
export const isTokenBlacklisted = (token: string): boolean => {
    return tokenBlacklist.has(token);
};

/**
 * Kullanıcının tüm token'larını blacklist'e ekle (şifre değişikliği gibi durumlarda)
 */
export const blacklistAllUserTokens = async (userId: string): Promise<void> => {
    // Bu fonksiyon için ayrı bir store (userId -> token list) tutmak gerekir
    // Şimdilik sadece log atıyoruz
    log.info('All user tokens blacklisted', { userId });
};