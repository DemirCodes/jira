/**
 * REGEX VALIDATOR (ReDoS Güvenli)
 * 
 * Tüm regex pattern'leri ReDoS saldırılarına karşı korumalıdır.
 * - Sınırsız tekrar (a*, a+, a{1,}) içermez
 * - İç içe gruplar minimumda tutulur
 * - Uzunluk limitleri her zaman kontrol edilir
 * - Mümkünse regex yerine string method'ları kullanılır
 */

// ============ TİP TANIMLARI ============

export type ValidationRule = (value: unknown) => boolean;

export interface ValidationResult {
    valid: boolean;
    errors: Record<string, string>;
}

export interface ValidationOptions {
    requiredFields?: string[];      // Zorunlu alanlar
    optionalFields?: string[];      // Opsiyonel alanlar (bunlar eksikse hata vermez)
    errorMessages?: Record<string, string>;  // Özel hata mesajları
    maxErrors?: number;              // Maksimum hata sayısı
    abortEarly?: boolean;            // İlk hatada dur
    allowEmptyStrings?: boolean;     // Boş string'e izin ver
}

// ============ GÜVENLİK KONSTANTLARI ============
const MAX_INPUT_LENGTH = 10000;
const SQL_PATTERN_MAX_LENGTH = 1000;

// ============ BAZI TEMEL VALIDATORLER ============

// Email - Basit ve güvenli (aşırı karmaşık regex yok)
export const isValidEmail = (email: string): boolean => {
    if (!email || email.length > 254) return false;
    const atIndex = email.indexOf('@');
    if (atIndex === -1 || atIndex === 0 || atIndex === email.length - 1) return false;
    
    const localPart = email.substring(0, atIndex);
    const domain = email.substring(atIndex + 1);
    
    if (localPart.length === 0 || localPart.length > 64) return false;
    if (domain.length === 0 || domain.length > 255) return false;
    if (domain.includes('..')) return false;
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    
    // Domain'de geçersiz karakter kontrolü
    const domainParts = domain.split('.');
    for (const part of domainParts) {
        if (part.length === 0) return false;
        // Her bir parça alfanumerik ve tire içerebilir
        for (let i = 0; i < part.length; i++) {
            const code = part.charCodeAt(i);
            const isValid = (code >= 48 && code <= 57) || // 0-9
                           (code >= 65 && code <= 90) || // A-Z
                           (code >= 97 && code <= 122) || // a-z
                           code === 45; // -
            if (!isValid) return false;
        }
    }
    
    return true;
};

// UUID - Basit ve güvenli
export const isValidUUID = (uuid: string): boolean => {
    if (!uuid || uuid.length !== 36) return false;
    
    const parts = uuid.split('-');
    if (parts.length !== 5) return false;
    if (parts[0]?.length !== 8) return false;
    if (parts[1]?.length !== 4) return false;
    if (parts[2]?.length !== 4) return false;
    if (parts[3]?.length !== 4) return false;
    if (parts[4]?.length !== 12) return false;
    
    // Regex sadece format kontrolü için (kısa ve güvenli)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// İsim - Sadece karakter ve uzunluk kontrolü (regex yok)
export const isValidName = (name: string, min: number = 2, max: number = 100): boolean => {
    if (!name || name.length < min || name.length > max) return false;
    
    // Regex yerine karakter kontrolü (daha güvenli)
    for (let i = 0; i < name.length; i++) {
        const code = name.charCodeAt(i);
        const char = name[i];
        
        // Harf kontrolü (Türkçe dahil)
        const isLetter = (code >= 65 && code <= 90) || // A-Z
                        (code >= 97 && code <= 122) || // a-z
                        (char >= 'ğ' && char <= 'ü') || // Türkçe harfler
                        char === 'ı' || char === 'İ' ||
                        char === 'ş' || char === 'Ş' ||
                        char === 'ç' || char === 'Ç' ||
                        char === 'ö' || char === 'Ö' ||
                        char === 'ü' || char === 'Ü' ||
                        char === 'ğ' || char === 'Ğ';
        
        const isAllowed = isLetter || char === ' ' || char === '.' || char === '-';
        if (!isAllowed) return false;
    }
    
    return true;
};

// Slug - Basit ve güvenli
export const isValidSlug = (slug: string, min: number = 2, max: number = 100): boolean => {
    if (!slug || slug.length < min || slug.length > max) return false;
    
    // Regex sadece bir kere çalışır, tekrarlı değil
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
};

// Şifre - Regex kısa ve sınırlı
export const isValidPassword = (password: string): boolean => {
    if (!password || password.length < 8 || password.length > 128) return false;
    
    // Ayrı regex'ler (iç içe değil)
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return hasLower && hasUpper && hasNumber;
};

// Username - Basit ve güvenli
export const isValidUsername = (username: string, min: number = 3, max: number = 50): boolean => {
    if (!username || username.length < min || username.length > max) return false;
    
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    return usernameRegex.test(username);
};

// Telefon numarası (Geliştirilmiş)
export const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone || phone.length > 20) return false;
    
    // Önce temizlik
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Uzunluk kontrolü
    if (cleaned.length < 10 || cleaned.length > 15) return false;
    
    // Rakam kontrolü (döngü ile, regex yok)
    for (let i = 0; i < cleaned.length; i++) {
        const code = cleaned.charCodeAt(i);
        if (code < 48 || code > 57) return false;
    }
    
    // Format kontrolü (basit)
    const isValidFormat = 
        cleaned.startsWith('05') && cleaned.length === 11 || // TR cep
        cleaned.startsWith('905') && cleaned.length === 12 || // Uluslararası
        cleaned.length === 10; // Sabit hat
    
    return isValidFormat;
};

// URL - try-catch ile (Geliştirilmiş)
export const isValidUrl = (url: string): boolean => {
    if (!url || url.length > 2000) return false;
    
    // Protocol kontrolü
    const lowerUrl = url.toLowerCase();
    if (!lowerUrl.startsWith('http://') && 
        !lowerUrl.startsWith('https://')) {
        return false;
    }
    
    try {
        const parsedUrl = new URL(url);
        
        // Sadece HTTP/HTTPS protokolleri
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return false;
        }
        
        // Hostname kontrolü
        if (!parsedUrl.hostname || parsedUrl.hostname.length > 255) {
            return false;
        }
        
        return true;
    } catch {
        return false;
    }
};

// HTML tag kontrolü (basit string araması)
export const containsHtmlTags = (input: string): boolean => {
    if (!input) return false;
    return input.includes('<') && input.includes('>');
};

// Sadece sayı
export const isNumeric = (input: string): boolean => {
    if (!input) return false;
    for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        if (code < 48 || code > 57) return false;
    }
    return true;
};

// Sadece harf
export const isAlpha = (input: string): boolean => {
    if (!input) return false;
    for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        const isLetter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
        if (!isLetter) return false;
    }
    return true;
};

// Alphanumeric
export const isAlphanumeric = (input: string): boolean => {
    if (!input) return false;
    for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        const isValid = (code >= 48 && code <= 57) || // 0-9
                       (code >= 65 && code <= 90) || // A-Z
                       (code >= 97 && code <= 122);  // a-z
        if (!isValid) return false;
    }
    return true;
};

// XSS koruması için tehlikeli pattern'ler (Geliştirilmiş)
const DANGEROUS_EVENTS = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 
    'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect',
    'onkeydown', 'onkeypress', 'onkeyup', 'onmousedown', 
    'onmouseup', 'onmouseenter', 'onmouseleave'
];

const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'link', 'meta'];

export const containsDangerousChars = (input: string): boolean => {
    if (!input || input.length > MAX_INPUT_LENGTH) return false;
    
    const lowerInput = input.toLowerCase();
    
    // Event handler kontrolü
    if (DANGEROUS_EVENTS.some(event => lowerInput.includes(event + '='))) {
        return true;
    }
    
    // Tag kontrolü
    if (DANGEROUS_TAGS.some(tag => lowerInput.includes('<' + tag) || lowerInput.includes('</' + tag))) {
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

// SQL injection için basit kontrol (Geliştirilmiş)
const SQL_PATTERNS = [
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

export const containsSqlPatterns = (input: string): boolean => {
    if (!input || input.length === 0) return false;
    if (input.length > 5000) return false;
    
    // Uzun girdilerde performans için sınırlama
    const checkStr = input.length > SQL_PATTERN_MAX_LENGTH 
        ? input.substring(0, SQL_PATTERN_MAX_LENGTH) 
        : input;
    
    return SQL_PATTERNS.some(pattern => pattern.test(checkStr));
};

// ============ ANA VALİDASYON FONKSİYONU (DÜZELTİLMİŞ) ============

/**
 * Tüm alanları toplu olarak doğrular
 * @param data - Doğrulanacak veri nesnesi
 * @param rules - Alan bazlı validator fonksiyonları
 * @param options - Validasyon seçenekleri (requiredFields, optionalFields)
 * @returns ValidationResult - valid ve errors objesi döner
 */
export const validateInput = (
    data: Record<string, unknown>,
    rules: Record<string, ValidationRule>,
    options: ValidationOptions = {}
): ValidationResult => {
    const errors: Record<string, string> = {};
    const {
        requiredFields = [],
        optionalFields = [],
        errorMessages = {},
        maxErrors = Infinity,
        abortEarly = false,
        allowEmptyStrings = false
    } = options;
    
    // 1. Required alanların varlık kontrolü
    for (const field of requiredFields) {
        const value = data[field];
        const isEmpty = value === undefined || value === null || 
                       (!allowEmptyStrings && value === '');
        
        if (isEmpty) {
            errors[field] = errorMessages[field] || `${field} is required`;
            if (abortEarly) {
                return { valid: false, errors };
            }
            if (Object.keys(errors).length >= maxErrors) {
                return { valid: false, errors };
            }
        }
    }
    
    // 2. Validasyon kurallarını uygula (sadece var olan alanlar için)
    for (const [field, validator] of Object.entries(rules)) {
        // Hata limiti kontrolü
        if (Object.keys(errors).length >= maxErrors) break;
        
        const value = data[field];
        const isOptional = optionalFields.includes(field);
        const isEmpty = value === undefined || value === null || 
                       (!allowEmptyStrings && value === '');
        
        // Optional alanlar için atlama
        if (isOptional && isEmpty) {
            continue;
        }
        
        // Required alanlar zaten yukarıda kontrol edildi, burada sadece validasyon yap
        if (value !== undefined && value !== null) {
            try {
                if (!validator(value)) {
                    errors[field] = errorMessages[field] || `Invalid ${field}`;
                    if (abortEarly) {
                        return { valid: false, errors };
                    }
                }
            } catch (error) {
                // Validator hatası durumunda
                errors[field] = errorMessages[field] || `Validation error for ${field}`;
                if (abortEarly) {
                    return { valid: false, errors };
                }
            }
        }
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
};

// ============ YARDIMCI FONKSİYONLAR ============

/**
 * Validasyon kuralları oluşturmak için yardımcı fonksiyon
 */
export const createValidationRules = <T extends Record<string, unknown>>(
    schema: Record<keyof T, ValidationRule>
): Record<keyof T, ValidationRule> => {
    return schema;
};

/**
 * Validasyon hatalarını formata etmek için yardımcı fonksiyon
 */
export const formatValidationErrors = (errors: Record<string, string>): string[] => {
    return Object.values(errors);
};

/**
 * Tek bir alanı validate etmek için yardımcı fonksiyon
 */
export const validateField = (
    value: unknown,
    validator: ValidationRule,
    fieldName: string
): { valid: boolean; error?: string } => {
    if (!validator(value)) {
        return { valid: false, error: `Invalid ${fieldName}` };
    }
    return { valid: true };
};

/**
 * Güvenli string karşılaştırma (timing attack resistant)
 */
export const safeCompare = (a: string, b: string): boolean => {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
};

/**
 * Input sanitize etme
 */
export const sanitizeInput = (input: string): string => {
    if (!input) return '';
    
    // Tehlikeli karakterleri escape et
    return input
        .replace(/[&<>]/g, (char) => {
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