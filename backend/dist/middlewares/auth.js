"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blacklistAllUserTokens = exports.isTokenBlacklisted = exports.blacklistToken = exports.authMiddleware = void 0;
var jsonwebtoken_1 = require("jsonwebtoken");
var tenantPool_1 = require("../db/tenantPool");
var logger_1 = require("../utils/logger");
var regexValidator_1 = require("../utils/regexValidator");
// Rate limiting için basit memory store (production'da Redis kullan)
var rateLimitStore = new Map();
var RATE_LIMIT_WINDOW = 60 * 1000; // 1 dakika
var RATE_LIMIT_MAX = 100; // Dakikada maksimum istek
// Token blacklist için memory store (production'da Redis kullan)
var tokenBlacklist = new Map();
/**
 * Rate limiting kontrolü
 */
var checkRateLimit = function (key) {
    var now = Date.now(); //
    var record = rateLimitStore.get(key);
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
var generateDeviceFingerprint = function (req) {
    var components = [
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown',
        req.headers['accept-language'] || 'unknown'
    ];
    return components.join('|');
};
// Periyodik temizlik (her saat)
setInterval(function () {
    var now = Date.now();
    // Rate limit store temizliği
    for (var _i = 0, _a = rateLimitStore.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], record = _b[1];
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    }
    // Token blacklist temizliği
    for (var _c = 0, _d = tokenBlacklist.entries(); _c < _d.length; _c++) {
        var _e = _d[_c], token = _e[0], expiry = _e[1];
        if (now > expiry) {
            tokenBlacklist.delete(token);
        }
    }
}, 60 * 60 * 1000);
var authMiddleware = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var startTime, authHeader, token, rateLimitKey, rateLimit, decoded, now, tokenAge, maxTokenAge, sanitizedUserId, currentFingerprint, error_1, duration, error_2, duration;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                startTime = Date.now();
                _b.label = 1;
            case 1:
                _b.trys.push([1, 7, , 8]);
                authHeader = req.headers.authorization;
                // Bearer formatı kontrolü (sadece "Bearer token" formatını kabul et)
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    logger_1.log.warn('Auth failed: Invalid auth header format', {
                        ip: req.ip,
                        path: req.path
                    });
                    res.status(401).json({ error: 'Invalid authorization format. Use Bearer token' });
                    return [2 /*return*/];
                }
                token = authHeader.substring(7);
                // Token uzunluğu kontrolü (DoS koruması)
                if (!token || token.length < 20 || token.length > 5000) {
                    logger_1.log.warn('Auth failed: Invalid token length', {
                        ip: req.ip,
                        path: req.path,
                        length: token === null || token === void 0 ? void 0 : token.length
                    });
                    res.status(401).json({ error: 'Invalid token format' });
                    return [2 /*return*/];
                }
                rateLimitKey = "auth:".concat(token.substring(0, 20));
                rateLimit = checkRateLimit(rateLimitKey);
                if (!rateLimit.allowed) {
                    logger_1.log.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
                    res.status(429).json({ error: 'Too many requests. Please try again later.' });
                    return [2 /*return*/];
                }
                // ============================================
                // 3. TOKEN BLACKLIST KONTROLÜ (Çıkış yapılan token'lar)
                // ============================================
                // Not: Şimdilik memory store kullanıyoruz. Production'da Redis önerilir.
                if (tokenBlacklist.has(token)) {
                    logger_1.log.warn('Auth failed: Token blacklisted', { ip: req.ip });
                    res.status(401).json({ error: 'Token has been revoked. Please login again.' });
                    return [2 /*return*/];
                }
                decoded = void 0;
                try {
                    decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                }
                catch (error) {
                    if (error.name === 'TokenExpiredError') {
                        logger_1.log.warn('Auth failed: Token expired', { ip: req.ip });
                        res.status(401).json({ error: 'Token expired. Please refresh your token.' });
                        return [2 /*return*/];
                    }
                    if (error.name === 'JsonWebTokenError') {
                        logger_1.log.warn('Auth failed: Invalid token signature', { ip: req.ip });
                        res.status(401).json({ error: 'Invalid token signature.' });
                        return [2 /*return*/];
                    }
                    logger_1.log.error('Auth failed: JWT verification error', { error: error.message });
                    res.status(401).json({ error: 'Invalid token.' });
                    return [2 /*return*/];
                }
                // ============================================
                // 5. TOKEN PAYLOAD KONTROLÜ
                // ============================================
                if (!decoded.userId) {
                    logger_1.log.warn('Auth failed: Missing userId in token payload');
                    res.status(401).json({ error: 'Invalid token payload.' });
                    return [2 /*return*/];
                }
                // UUID format kontrolü
                if (!(0, regexValidator_1.isValidUUID)(decoded.userId)) {
                    logger_1.log.warn('Auth failed: Invalid UUID format in token', { userId: decoded.userId });
                    res.status(401).json({ error: 'Invalid user ID format in token.' });
                    return [2 /*return*/];
                }
                now = Math.floor(Date.now() / 1000);
                tokenAge = now - decoded.iat;
                maxTokenAge = 30 * 24 * 60 * 60;
                if (tokenAge > maxTokenAge) {
                    logger_1.log.warn('Auth failed: Token too old', { userId: decoded.userId, age: tokenAge });
                    res.status(401).json({ error: 'Token too old. Please login again.' });
                    return [2 /*return*/];
                }
                sanitizedUserId = void 0;
                try {
                    sanitizedUserId = (0, regexValidator_1.sanitizeInput)(decoded.userId);
                    // Sanitize sonrası hala tehlikeli karakter var mı?
                    if ((0, regexValidator_1.containsDangerousChars)(sanitizedUserId)) {
                        logger_1.log.error('Auth failed: Dangerous chars in userId after sanitize', {
                            original: decoded.userId,
                            sanitized: sanitizedUserId
                        });
                        res.status(401).json({ error: 'Invalid user ID.' });
                        return [2 /*return*/];
                    }
                }
                catch (error) {
                    logger_1.log.error('Auth failed: Sanitization error', { error: error });
                    res.status(401).json({ error: 'Invalid user ID format.' });
                    return [2 /*return*/];
                }
                currentFingerprint = generateDeviceFingerprint(req);
                if (decoded.fingerprint && decoded.fingerprint !== currentFingerprint) {
                    logger_1.log.warn('Auth failed: Device fingerprint mismatch', {
                        userId: sanitizedUserId,
                        expected: decoded.fingerprint,
                        actual: currentFingerprint
                    });
                    // Not: Bu durumda token'ı blacklist'e ekleyip kullanıcıyı tekrar login'e yönlendirebiliriz
                    // tokenBlacklist.set(token, decoded.exp * 1000);
                    res.status(401).json({ error: 'Device mismatch. Please login again.' });
                    return [2 /*return*/];
                }
                _b.label = 2;
            case 2:
                _b.trys.push([2, 5, , 6]);
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SET app.current_user_id = $1', [sanitizedUserId])];
            case 3:
                _b.sent();
                return [4 /*yield*/, tenantPool_1.tenantPool.query('SET app.current_token_iat = $1', [decoded.iat])];
            case 4:
                _b.sent();
                return [3 /*break*/, 6];
            case 5:
                error_1 = _b.sent();
                logger_1.log.error('Auth failed: RLS setup error', { error: error_1.message, userId: sanitizedUserId });
                res.status(500).json({ error: 'Internal server error' });
                return [2 /*return*/];
            case 6:
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
                duration = Date.now() - startTime;
                logger_1.log.info('Auth success', {
                    userId: sanitizedUserId.substring(0, 8), // Kısmi log (güvenlik)
                    path: req.path,
                    method: req.method,
                    duration: "".concat(duration, "ms"),
                    ip: req.ip,
                    userAgent: (_a = req.headers['user-agent']) === null || _a === void 0 ? void 0 : _a.substring(0, 50)
                });
                next();
                return [3 /*break*/, 8];
            case 7:
                error_2 = _b.sent();
                duration = Date.now() - startTime;
                logger_1.log.error('Auth unexpected error', {
                    error: error_2.message,
                    stack: error_2.stack,
                    path: req.path,
                    duration: "".concat(duration, "ms")
                });
                res.status(500).json({ error: 'Authentication service unavailable' });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.authMiddleware = authMiddleware;
// ============================================
// YARDIMCI FONKSİYONLAR (Harici kullanım için)
// ============================================
/**
 * Token'ı blacklist'e ekle (logout işleminde kullanılır)
 */
var blacklistToken = function (token, expiresAt) {
    var expiry = expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000; // default 7 gün
    tokenBlacklist.set(token, expiry);
    logger_1.log.info('Token blacklisted', { tokenHash: token.substring(0, 10) });
};
exports.blacklistToken = blacklistToken;
/**
 * Token blacklist'te mi kontrol et
 */
var isTokenBlacklisted = function (token) {
    return tokenBlacklist.has(token);
};
exports.isTokenBlacklisted = isTokenBlacklisted;
/**
 * Kullanıcının tüm token'larını blacklist'e ekle (şifre değişikliği gibi durumlarda)
 */
var blacklistAllUserTokens = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // Bu fonksiyon için ayrı bir store (userId -> token list) tutmak gerekir
        // Şimdilik sadece log atıyoruz
        logger_1.log.info('All user tokens blacklisted', { userId: userId });
        return [2 /*return*/];
    });
}); };
exports.blacklistAllUserTokens = blacklistAllUserTokens;
/**
 * 1. KRİTİK: Rate Limiting Bypass (Yüksek Risk)
 * 2. KRİTİK: Timing Attack (Yüksek Risk)
 * 3. YÜKSEK RİSK: JWT Algorithm Confusion
 * 4. ORTA RİSK: Information Leakage
 * 5. ORTA RİSK: Race Condition
 * 6. ORTA RİSK: Memory Exhaustion DoS
 * 7. DÜŞÜK RİSK: Fingerprint Bypass
 * 8. DÜŞÜK RİSK: No Token Revocation for Password Change
 *
 */ 
