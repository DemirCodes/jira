/**
 * AUTH MIDDLEWARE (GÜVENLİK GELİŞTİRİLMİŞ - FINAL)
 *
 * JWT token'ı doğrular ve RLS için current_user_id set eder.
 *
 * Güvenlik önlemleri:
 * 1. Bearer token formatı kontrolü
 * 2. Token uzunluğu kontrolü (DoS koruması)
 * 3. XSS koruması (userId sanitize)
 * 4. Rate limiting entegrasyonu (IP + token bazlı)
 * 5. Audit log (GDPR uyumlu)
 * 6. Token blacklist desteği
 * 7. Device fingerprint eşleştirme
 * 8. Token version ile revocation (şifre değişikliği)
 * 9. Algorithm restriction (HS256 only)
 * 10. Production'da detaylı log kapatma
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            tokenInfo?: {
                iat: number;
                exp: number;
                jti?: string;
                tokenVersion?: number;
            };
            deviceFingerprint?: string;
        }
    }
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Token'ı blacklist'e ekle (logout işleminde kullanılır)
 */
export declare const blacklistToken: (token: string, expiresAt?: number) => void;
/**
 * Token blacklist'te mi kontrol et
 */
export declare const isTokenBlacklisted: (token: string) => boolean;
/**
 * Kullanıcının tüm token'larını revoke et (şifre değişikliği, hesap ele geçirme vb.)
 * KRİTİK: Şifre değişince BUNU ÇAĞIR!
 */
export declare const revokeAllUserTokens: (userId: string) => Promise<void>;
/**
 * Kullanıcının token version'ını getir
 */
export declare const getUserTokenVersion: (userId: string) => Promise<number>;
//# sourceMappingURL=auth.d.ts.map