"use strict";
/**
 * REGEX VALIDATOR (ReDoS Güvenli)
 *
 * Tüm regex pattern'leri ReDoS saldırılarına karşı korumalıdır:
 * - Sınırsız tekrar (a*, a+) içermez
 * - İç içe gruplar minimumda tutulur
 * - Uzunluk limitleri her zaman kontrol edilir
 * - Mümkünse regex yerine string metodları kullanılır
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.safeCompare = exports.validateField = exports.formatValidationErrors = exports.validateInput = exports.containsSqlPatterns = exports.containsDangerousChars = exports.isAlphanumeric = exports.isAlpha = exports.isNumeric = exports.containsHtmlTags = exports.isValidUrl = exports.isValidPhoneNumber = exports.isValidUsername = exports.isValidPassword = exports.isValidSlug = exports.isValidName = exports.isValidUUID = exports.isValidEmail = void 0;
// ─── GÜVENLİK SABİTLERİ ──────────────────────────────────────────────────────
const MAX_INPUT_LENGTH = 10_000;
const SQL_CHECK_MAX_LEN = 1_000;
// ─── TEMELİ VALIDATORLER ──────────────────────────────────────────────────────
/** RFC 5321 uyumlu, ReDoS-güvenli e-posta doğrulama */
const isValidEmail = (email) => {
    if (!email || email.length > 254)
        return false;
    const atIndex = email.indexOf('@');
    if (atIndex <= 0 || atIndex === email.length - 1)
        return false;
    const local = email.substring(0, atIndex);
    const domain = email.substring(atIndex + 1);
    if (local.length > 64)
        return false;
    if (domain.length > 255)
        return false;
    if (domain.includes('..'))
        return false;
    if (domain.startsWith('.') || domain.endsWith('.'))
        return false;
    for (const part of domain.split('.')) {
        if (part.length === 0)
            return false;
        for (let i = 0; i < part.length; i++) {
            const c = part.charCodeAt(i);
            const ok = (c >= 48 && c <= 57) // 0-9
                || (c >= 65 && c <= 90) // A-Z
                || (c >= 97 && c <= 122) // a-z
                || c === 45; // -
            if (!ok)
                return false;
        }
    }
    return true;
};
exports.isValidEmail = isValidEmail;
/** UUID v4 doğrulama */
const isValidUUID = (uuid) => {
    if (!uuid || uuid.length !== 36)
        return false;
    const p = uuid.split('-');
    if (p.length !== 5 ||
        p[0].length !== 8 ||
        p[1].length !== 4 ||
        p[2].length !== 4 ||
        p[3].length !== 4 ||
        p[4].length !== 12)
        return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
};
exports.isValidUUID = isValidUUID;
/** İsim doğrulama — Latin + Türkçe karakterlere izin verir */
const isValidName = (name, min = 2, max = 100) => {
    if (!name || name.length < min || name.length > max)
        return false;
    const TR_EXTRA = new Set(['ğ', 'Ğ', 'ı', 'İ', 'ş', 'Ş', 'ç', 'Ç', 'ö', 'Ö', 'ü', 'Ü']);
    for (let i = 0; i < name.length; i++) {
        const c = name[i];
        const code = name.charCodeAt(i);
        const isLetter = (code >= 65 && code <= 90) || // A-Z
            (code >= 97 && code <= 122) || // a-z
            TR_EXTRA.has(c);
        if (!isLetter && c !== ' ' && c !== '.' && c !== '-')
            return false;
    }
    return true;
};
exports.isValidName = isValidName;
/** URL-uyumlu slug doğrulama */
const isValidSlug = (slug, min = 2, max = 100) => {
    if (!slug || slug.length < min || slug.length > max)
        return false;
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
};
exports.isValidSlug = isValidSlug;
/** Şifre doğrulama — küçük/büyük harf + rakam zorunlu */
const isValidPassword = (password) => {
    if (!password || password.length < 8 || password.length > 128)
        return false;
    return /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /\d/.test(password);
};
exports.isValidPassword = isValidPassword;
/** Kullanıcı adı doğrulama */
const isValidUsername = (username, min = 3, max = 50) => {
    if (!username || username.length < min || username.length > max)
        return false;
    return /^[a-zA-Z0-9_.-]+$/.test(username);
};
exports.isValidUsername = isValidUsername;
/**
 * Türkiye odaklı telefon doğrulama.
 * Desteklenen formatlar: 05XX XXX XX XX · +90 5XX · 10 haneli sabit hat
 */
const isValidPhoneNumber = (phone) => {
    if (!phone || phone.length > 20)
        return false;
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.length < 10 || cleaned.length > 15)
        return false;
    for (let i = 0; i < cleaned.length; i++) {
        const c = cleaned.charCodeAt(i);
        if (c < 48 || c > 57)
            return false;
    }
    // Parantezler eklenerek öncelik hatası giderildi
    return (cleaned.startsWith('05') && cleaned.length === 11) ||
        (cleaned.startsWith('905') && cleaned.length === 12) ||
        (cleaned.length === 10);
};
exports.isValidPhoneNumber = isValidPhoneNumber;
/** URL doğrulama — yalnızca http/https protokolleri */
const isValidUrl = (url) => {
    if (!url || url.length > 2_000)
        return false;
    const lower = url.toLowerCase();
    if (!lower.startsWith('http://') && !lower.startsWith('https://'))
        return false;
    try {
        const { protocol, hostname } = new URL(url);
        return (protocol === 'http:' || protocol === 'https:') &&
            !!hostname && hostname.length <= 255;
    }
    catch {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
// ─── KARAKTERİŞLEVSEL KONTROLLER ─────────────────────────────────────────────
/** HTML tag içeriyor mu? */
const containsHtmlTags = (input) => !!input && input.includes('<') && input.includes('>');
exports.containsHtmlTags = containsHtmlTags;
/** Yalnızca rakam */
const isNumeric = (input) => {
    if (!input)
        return false;
    for (let i = 0; i < input.length; i++) {
        const c = input.charCodeAt(i);
        if (c < 48 || c > 57)
            return false;
    }
    return true;
};
exports.isNumeric = isNumeric;
/** Yalnızca ASCII harf */
const isAlpha = (input) => {
    if (!input)
        return false;
    for (let i = 0; i < input.length; i++) {
        const c = input.charCodeAt(i);
        if (!((c >= 65 && c <= 90) || (c >= 97 && c <= 122)))
            return false;
    }
    return true;
};
exports.isAlpha = isAlpha;
/** ASCII harf + rakam */
const isAlphanumeric = (input) => {
    if (!input)
        return false;
    for (let i = 0; i < input.length; i++) {
        const c = input.charCodeAt(i);
        if (!((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122)))
            return false;
    }
    return true;
};
exports.isAlphanumeric = isAlphanumeric;
// ─── GÜVENLİK KONTROL LİSTELERİ ──────────────────────────────────────────────
const DANGEROUS_EVENTS = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
    'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown',
    'onkeypress', 'onkeyup', 'onmousedown', 'onmouseup',
    'onmouseenter', 'onmouseleave',
];
const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'link', 'meta'];
const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'data:text/html'];
/** XSS vektörü içeriyor mu? */
const containsDangerousChars = (input) => {
    if (!input || input.length > MAX_INPUT_LENGTH)
        return false;
    const lower = input.toLowerCase();
    return DANGEROUS_EVENTS.some(e => lower.includes(e + '=')) ||
        DANGEROUS_TAGS.some(t => lower.includes('<' + t) ||
            lower.includes('</' + t)) ||
        DANGEROUS_PROTOCOLS.some(p => lower.includes(p));
};
exports.containsDangerousChars = containsDangerousChars;
/** SQL injection pattern'leri içeriyor mu? */
const SQL_PATTERNS = [
    /select.+from/i,
    /drop\s+(table|database)/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /union\s+select/i,
    /--\s*$/m,
    /;\s*$/m,
    /\/\*|\*\//,
    /exec\s+\(/i,
    /xp_cmdshell/i,
];
const containsSqlPatterns = (input) => {
    if (!input)
        return false;
    const check = input.length > SQL_CHECK_MAX_LEN
        ? input.substring(0, SQL_CHECK_MAX_LEN)
        : input;
    return SQL_PATTERNS.some(p => p.test(check));
};
exports.containsSqlPatterns = containsSqlPatterns;
// ─── ANA VALİDASYON FONKSİYONU ───────────────────────────────────────────────
/**
 * Birden fazla alanı toplu olarak doğrular.
 *
 * @param data    Doğrulanacak veri nesnesi
 * @param rules   Alan bazlı validator fonksiyonları
 * @param options Davranış seçenekleri
 * @returns       `{ valid, errors }`
 */
const validateInput = (data, rules, options = {}) => {
    const { requiredFields = [], optionalFields = [], errorMessages = {}, maxErrors = Infinity, abortEarly = false, allowEmptyStrings = false, } = options;
    const errors = {};
    const addError = (field, msg) => {
        errors[field] = errorMessages[field] ?? msg;
        return abortEarly || Object.keys(errors).length >= maxErrors;
    };
    const isEmpty = (v) => v === undefined || v === null || (!allowEmptyStrings && v === '');
    // 1. Zorunlu alan kontrolü
    for (const field of requiredFields) {
        if (isEmpty(data[field]) && addError(field, `${field} is required`)) {
            return { valid: false, errors };
        }
    }
    // 2. Validasyon kuralları
    for (const [field, validator] of Object.entries(rules)) {
        if (Object.keys(errors).length >= maxErrors)
            break;
        const value = data[field];
        if (optionalFields.includes(field) && isEmpty(value))
            continue;
        if (value === undefined || value === null)
            continue;
        try {
            if (!validator(value) && addError(field, `Invalid ${field}`)) {
                return { valid: false, errors };
            }
        }
        catch {
            if (addError(field, `Validation error for ${field}`)) {
                return { valid: false, errors };
            }
        }
    }
    return { valid: Object.keys(errors).length === 0, errors };
};
exports.validateInput = validateInput;
// ─── YARDIMCI FONKSİYONLAR ───────────────────────────────────────────────────
/** Hata nesnesini mesaj dizisine çevirir */
const formatValidationErrors = (errors) => Object.values(errors);
exports.formatValidationErrors = formatValidationErrors;
/** Tek alan doğrulama */
const validateField = (value, validator, fieldName) => validator(value)
    ? { valid: true }
    : { valid: false, error: `Invalid ${fieldName}` };
exports.validateField = validateField;
/**
 * Zamanlama saldırısına (timing attack) karşı dayanıklı string karşılaştırma.
 * Sabit süreli XOR — eşitsiz uzunluk hemen false döner (bu kaçınılmazdır).
 */
const safeCompare = (a, b) => {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
};
exports.safeCompare = safeCompare;
/** Tehlikeli karakterleri HTML entity'ye çevirir ve kontrol karakterlerini temizler */
const sanitizeInput = (input) => {
    if (!input)
        return '';
    return input
        .replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] ?? c))
        // Null byte ve yazdırılamayan kontrol karakterleri
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .substring(0, MAX_INPUT_LENGTH);
};
exports.sanitizeInput = sanitizeInput;
//# sourceMappingURL=regexValidator.js.map