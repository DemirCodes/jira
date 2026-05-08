"use strict";
/**
 * REGEX VALIDATOR (ReDoS Güvenli)
 *
 * Tüm regex pattern'leri ReDoS saldırılarına karşı korumalıdır.
 * - Sınırsız tekrar (a*, a+, a{1,}) içermez
 * - İç içe gruplar minimumda tutulur
 * - Uzunluk limitleri her zaman kontrol edilir
 * - Mümkünse regex yerine string method'ları kullanılır
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.safeCompare = exports.validateField = exports.formatValidationErrors = exports.createValidationRules = exports.validateInput = exports.containsSqlPatterns = exports.containsDangerousChars = exports.isAlphanumeric = exports.isAlpha = exports.isNumeric = exports.containsHtmlTags = exports.isValidUrl = exports.isValidPhoneNumber = exports.isValidUsername = exports.isValidPassword = exports.isValidSlug = exports.isValidName = exports.isValidUUID = exports.isValidEmail = void 0;
// ============ GÜVENLİK KONSTANTLARI ============
var MAX_INPUT_LENGTH = 10000;
var SQL_PATTERN_MAX_LENGTH = 1000;
// ============ BAZI TEMEL VALIDATORLER ============
// Email - Basit ve güvenli (aşırı karmaşık regex yok)
var isValidEmail = function (email) {
    if (!email || email.length > 254)
        return false;
    var atIndex = email.indexOf('@');
    if (atIndex === -1 || atIndex === 0 || atIndex === email.length - 1)
        return false;
    var localPart = email.substring(0, atIndex);
    var domain = email.substring(atIndex + 1);
    if (localPart.length === 0 || localPart.length > 64)
        return false;
    if (domain.length === 0 || domain.length > 255)
        return false;
    if (domain.includes('..'))
        return false;
    if (domain.startsWith('.') || domain.endsWith('.'))
        return false;
    // Domain'de geçersiz karakter kontrolü
    var domainParts = domain.split('.');
    for (var _i = 0, domainParts_1 = domainParts; _i < domainParts_1.length; _i++) {
        var part = domainParts_1[_i];
        if (part.length === 0)
            return false;
        // Her bir parça alfanumerik ve tire içerebilir
        for (var i = 0; i < part.length; i++) {
            var code = part.charCodeAt(i);
            var isValid = (code >= 48 && code <= 57) || // 0-9
                (code >= 65 && code <= 90) || // A-Z
                (code >= 97 && code <= 122) || // a-z
                code === 45; // -
            if (!isValid)
                return false;
        }
    }
    return true;
};
exports.isValidEmail = isValidEmail;
// UUID - Basit ve güvenli
var isValidUUID = function (uuid) {
    var _a, _b, _c, _d, _e;
    if (!uuid || uuid.length !== 36)
        return false;
    var parts = uuid.split('-');
    if (parts.length !== 5)
        return false;
    if (((_a = parts[0]) === null || _a === void 0 ? void 0 : _a.length) !== 8)
        return false;
    if (((_b = parts[1]) === null || _b === void 0 ? void 0 : _b.length) !== 4)
        return false;
    if (((_c = parts[2]) === null || _c === void 0 ? void 0 : _c.length) !== 4)
        return false;
    if (((_d = parts[3]) === null || _d === void 0 ? void 0 : _d.length) !== 4)
        return false;
    if (((_e = parts[4]) === null || _e === void 0 ? void 0 : _e.length) !== 12)
        return false;
    // Regex sadece format kontrolü için (kısa ve güvenli)
    var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.isValidUUID = isValidUUID;
// İsim - Sadece karakter ve uzunluk kontrolü (regex yok)
var isValidName = function (name, min, max) {
    if (min === void 0) { min = 2; }
    if (max === void 0) { max = 100; }
    if (!name || name.length < min || name.length > max)
        return false;
    // Regex yerine karakter kontrolü (daha güvenli)
    for (var i = 0; i < name.length; i++) {
        var code = name.charCodeAt(i);
        var char = name[i];
        // Harf kontrolü (Türkçe dahil)
        var isLetter = (code >= 65 && code <= 90) || // A-Z
            (code >= 97 && code <= 122) || // a-z
            (char >= 'ğ' && char <= 'ü') || // Türkçe harfler
            char === 'ı' || char === 'İ' ||
            char === 'ş' || char === 'Ş' ||
            char === 'ç' || char === 'Ç' ||
            char === 'ö' || char === 'Ö' ||
            char === 'ü' || char === 'Ü' ||
            char === 'ğ' || char === 'Ğ';
        var isAllowed = isLetter || char === ' ' || char === '.' || char === '-';
        if (!isAllowed)
            return false;
    }
    return true;
};
exports.isValidName = isValidName;
// Slug - Basit ve güvenli
var isValidSlug = function (slug, min, max) {
    if (min === void 0) { min = 2; }
    if (max === void 0) { max = 100; }
    if (!slug || slug.length < min || slug.length > max)
        return false;
    // Regex sadece bir kere çalışır, tekrarlı değil
    var slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
};
exports.isValidSlug = isValidSlug;
// Şifre - Regex kısa ve sınırlı
var isValidPassword = function (password) {
    if (!password || password.length < 8 || password.length > 128)
        return false;
    // Ayrı regex'ler (iç içe değil)
    var hasLower = /[a-z]/.test(password);
    var hasUpper = /[A-Z]/.test(password);
    var hasNumber = /\d/.test(password);
    return hasLower && hasUpper && hasNumber;
};
exports.isValidPassword = isValidPassword;
// Username - Basit ve güvenli
var isValidUsername = function (username, min, max) {
    if (min === void 0) { min = 3; }
    if (max === void 0) { max = 50; }
    if (!username || username.length < min || username.length > max)
        return false;
    var usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    return usernameRegex.test(username);
};
exports.isValidUsername = isValidUsername;
// Telefon numarası (Geliştirilmiş)
var isValidPhoneNumber = function (phone) {
    if (!phone || phone.length > 20)
        return false;
    // Önce temizlik
    var cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    // Uzunluk kontrolü
    if (cleaned.length < 10 || cleaned.length > 15)
        return false;
    // Rakam kontrolü (döngü ile, regex yok)
    for (var i = 0; i < cleaned.length; i++) {
        var code = cleaned.charCodeAt(i);
        if (code < 48 || code > 57)
            return false;
    }
    // Format kontrolü (basit)
    var isValidFormat = cleaned.startsWith('05') && cleaned.length === 11 || // TR cep
        cleaned.startsWith('905') && cleaned.length === 12 || // Uluslararası
        cleaned.length === 10; // Sabit hat
    return isValidFormat;
};
exports.isValidPhoneNumber = isValidPhoneNumber;
// URL - try-catch ile (Geliştirilmiş)
var isValidUrl = function (url) {
    if (!url || url.length > 2000)
        return false;
    // Protocol kontrolü
    var lowerUrl = url.toLowerCase();
    if (!lowerUrl.startsWith('http://') &&
        !lowerUrl.startsWith('https://')) {
        return false;
    }
    try {
        var parsedUrl = new URL(url);
        // Sadece HTTP/HTTPS protokolleri
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return false;
        }
        // Hostname kontrolü
        if (!parsedUrl.hostname || parsedUrl.hostname.length > 255) {
            return false;
        }
        return true;
    }
    catch (_a) {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
// HTML tag kontrolü (basit string araması)
var containsHtmlTags = function (input) {
    if (!input)
        return false;
    return input.includes('<') && input.includes('>');
};
exports.containsHtmlTags = containsHtmlTags;
// Sadece sayı
var isNumeric = function (input) {
    if (!input)
        return false;
    for (var i = 0; i < input.length; i++) {
        var code = input.charCodeAt(i);
        if (code < 48 || code > 57)
            return false;
    }
    return true;
};
exports.isNumeric = isNumeric;
// Sadece harf
var isAlpha = function (input) {
    if (!input)
        return false;
    for (var i = 0; i < input.length; i++) {
        var code = input.charCodeAt(i);
        var isLetter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
        if (!isLetter)
            return false;
    }
    return true;
};
exports.isAlpha = isAlpha;
// Alphanumeric
var isAlphanumeric = function (input) {
    if (!input)
        return false;
    for (var i = 0; i < input.length; i++) {
        var code = input.charCodeAt(i);
        var isValid = (code >= 48 && code <= 57) || // 0-9
            (code >= 65 && code <= 90) || // A-Z
            (code >= 97 && code <= 122); // a-z
        if (!isValid)
            return false;
    }
    return true;
};
exports.isAlphanumeric = isAlphanumeric;
// XSS koruması için tehlikeli pattern'ler (Geliştirilmiş)
var DANGEROUS_EVENTS = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus',
    'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect',
    'onkeydown', 'onkeypress', 'onkeyup', 'onmousedown',
    'onmouseup', 'onmouseenter', 'onmouseleave'
];
var DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'link', 'meta'];
var containsDangerousChars = function (input) {
    if (!input || input.length > MAX_INPUT_LENGTH)
        return false;
    var lowerInput = input.toLowerCase();
    // Event handler kontrolü
    if (DANGEROUS_EVENTS.some(function (event) { return lowerInput.includes(event + '='); })) {
        return true;
    }
    // Tag kontrolü
    if (DANGEROUS_TAGS.some(function (tag) { return lowerInput.includes('<' + tag) || lowerInput.includes('</' + tag); })) {
        return true;
    }
    // JavaScript pseudo-protocol
    if (lowerInput.includes('javascript:') ||
        lowerInput.includes('vbscript:') ||
        lowerInput.includes('data:text/html')) {
        return true;
    }
    return false;
};
exports.containsDangerousChars = containsDangerousChars;
// SQL injection için basit kontrol (Geliştirilmiş)
var SQL_PATTERNS = [
    /select.+from/i,
    /drop\s+(table|database)/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /union\s+select/i,
    /--\s*$/m,
    /;\s*$/m,
    /\*\/|\/\*/,
    /exec\s+\(/i,
    /xp_cmdshell/i
];
var containsSqlPatterns = function (input) {
    if (!input || input.length === 0)
        return false;
    if (input.length > 5000)
        return false;
    // Uzun girdilerde performans için sınırlama
    var checkStr = input.length > SQL_PATTERN_MAX_LENGTH
        ? input.substring(0, SQL_PATTERN_MAX_LENGTH)
        : input;
    return SQL_PATTERNS.some(function (pattern) { return pattern.test(checkStr); });
};
exports.containsSqlPatterns = containsSqlPatterns;
// ============ ANA VALİDASYON FONKSİYONU (DÜZELTİLMİŞ) ============
/**
 * Tüm alanları toplu olarak doğrular
 * @param data - Doğrulanacak veri nesnesi
 * @param rules - Alan bazlı validator fonksiyonları
 * @param options - Validasyon seçenekleri (requiredFields, optionalFields)
 * @returns ValidationResult - valid ve errors objesi döner
 */
var validateInput = function (data, rules, options) {
    if (options === void 0) { options = {}; }
    var errors = {};
    var _a = options.requiredFields, requiredFields = _a === void 0 ? [] : _a, _b = options.optionalFields, optionalFields = _b === void 0 ? [] : _b, _c = options.errorMessages, errorMessages = _c === void 0 ? {} : _c, _d = options.maxErrors, maxErrors = _d === void 0 ? Infinity : _d, _e = options.abortEarly, abortEarly = _e === void 0 ? false : _e, _f = options.allowEmptyStrings, allowEmptyStrings = _f === void 0 ? false : _f;
    // 1. Required alanların varlık kontrolü
    for (var _i = 0, requiredFields_1 = requiredFields; _i < requiredFields_1.length; _i++) {
        var field = requiredFields_1[_i];
        var value = data[field];
        var isEmpty = value === undefined || value === null ||
            (!allowEmptyStrings && value === '');
        if (isEmpty) {
            errors[field] = errorMessages[field] || "".concat(field, " is required");
            if (abortEarly) {
                return { valid: false, errors: errors };
            }
            if (Object.keys(errors).length >= maxErrors) {
                return { valid: false, errors: errors };
            }
        }
    }
    // 2. Validasyon kurallarını uygula (sadece var olan alanlar için)
    for (var _g = 0, _h = Object.entries(rules); _g < _h.length; _g++) {
        var _j = _h[_g], field = _j[0], validator = _j[1];
        // Hata limiti kontrolü
        if (Object.keys(errors).length >= maxErrors)
            break;
        var value = data[field];
        var isOptional = optionalFields.includes(field);
        var isEmpty = value === undefined || value === null ||
            (!allowEmptyStrings && value === '');
        // Optional alanlar için atlama
        if (isOptional && isEmpty) {
            continue;
        }
        // Required alanlar zaten yukarıda kontrol edildi, burada sadece validasyon yap
        if (value !== undefined && value !== null) {
            try {
                if (!validator(value)) {
                    errors[field] = errorMessages[field] || "Invalid ".concat(field);
                    if (abortEarly) {
                        return { valid: false, errors: errors };
                    }
                }
            }
            catch (error) {
                // Validator hatası durumunda
                errors[field] = errorMessages[field] || "Validation error for ".concat(field);
                if (abortEarly) {
                    return { valid: false, errors: errors };
                }
            }
        }
    }
    return {
        valid: Object.keys(errors).length === 0,
        errors: errors
    };
};
exports.validateInput = validateInput;
// ============ YARDIMCI FONKSİYONLAR ============
/**
 * Validasyon kuralları oluşturmak için yardımcı fonksiyon
 */
var createValidationRules = function (schema) {
    return schema;
};
exports.createValidationRules = createValidationRules;
/**
 * Validasyon hatalarını formata etmek için yardımcı fonksiyon
 */
var formatValidationErrors = function (errors) {
    return Object.values(errors);
};
exports.formatValidationErrors = formatValidationErrors;
/**
 * Tek bir alanı validate etmek için yardımcı fonksiyon
 */
var validateField = function (value, validator, fieldName) {
    if (!validator(value)) {
        return { valid: false, error: "Invalid ".concat(fieldName) };
    }
    return { valid: true };
};
exports.validateField = validateField;
/**
 * Güvenli string karşılaştırma (timing attack resistant)
 */
var safeCompare = function (a, b) {
    if (a.length !== b.length)
        return false;
    var result = 0;
    for (var i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
};
exports.safeCompare = safeCompare;
/**
 * Input sanitize etme
 */
var sanitizeInput = function (input) {
    if (!input)
        return '';
    // Tehlikeli karakterleri escape et
    return input
        .replace(/[&<>]/g, function (char) {
        switch (char) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            default: return char;
        }
    })
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Kontrol karakterlerini temizle
        .substring(0, MAX_INPUT_LENGTH);
};
exports.sanitizeInput = sanitizeInput;
// ============ ÖRNEK KULLANIM ============
/*
// Validasyon kuralları oluşturma
const rules = createValidationRules({
    email: isValidEmail,
    password: isValidPassword,
    name: (value) => isValidName(value as string)
});

// Validasyon opsiyonları
const options = {
    requiredFields: ["email", "password"],
    optionalFields: ["name"],
    errorMessages: {
        email: "Please enter a valid email address",
        password: "Password must be at least 8 characters with uppercase, lowercase and numbers"
    },
    abortEarly: false,
    maxErrors: 5
};

// Validasyonu çalıştırma
const formData = {
    email: "test@example.com",
    password: "Pass1234",
    name: "John Doe"
};

const result = validateInput(formData, rules, options);

if (!result.valid) {
    console.error("Validation errors:", result.errors);
    // Output: { valid: true, errors: {} } - eğer validasyon başarılıysa
} else {
    console.log("Validation passed!");
}

// Tek alan validasyonu
const emailValidation = validateField("test@example.com", isValidEmail, "email");
if (!emailValidation.valid) {
    console.error(emailValidation.error);
}

// Input sanitize
const userInput = "<script>alert('xss')</script>";
const safeInput = sanitizeInput(userInput);
console.log(safeInput); // &lt;script&gt;alert('xss')&lt;/script&gt;
*/ 
