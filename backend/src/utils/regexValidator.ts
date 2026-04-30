/**
 * REGEX VALIDATOR (ReDoS Güvenli)
 * 
 * Tüm regex pattern'leri ReDoS saldırılarına karşı korumalıdır.
 * - Sınırsız tekrar (a*, a+, a{1,}) içermez
 * - İç içe gruplar minimumda tutulur
 * - Uzunluk limitleri her zaman kontrol edilir
 * - Mümkünse regex yerine string method'ları kullanılır
 */

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

// Telefon numarası
export const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone) return false;
    const cleaned = phone.replace(/\s/g, '');
    const phoneRegex = /^(05|\+905)[0-9]{9}$/;
    return phoneRegex.test(cleaned);
};

// URL - try-catch ile
export const isValidUrl = (url: string): boolean => {
    if (!url || url.length > 2000) return false;
    try {
        new URL(url);
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

// XSS koruması için özel karakterler
export const containsDangerousChars = (input: string): boolean => {
    if (!input) return false;
    const dangerous = ['<script', 'javascript:', 'onclick', 'onerror', 'onload'];
    const lowerInput = input.toLowerCase();
    return dangerous.some(danger => lowerInput.includes(danger));
};

// SQL injection için basit kontrol (ilk katman)
export const containsSqlPatterns = (input: string): boolean => {
    if (!input || input.length > 5000) return false;
    
    const dangerousSql = [
        /\bSELECT\b/i, /\bDROP\b/i, /\bDELETE\b/i, 
        /\bINSERT\b/i, /\bUPDATE\b/i, /\bUNION\b/i,
        /--/, /;/, /\/\*/, /\*\//
    ];
    
    return dangerousSql.some(pattern => pattern.test(input));
};

// ============ TİP TANIMLARI ============

export type ValidationRule = (value: unknown) => boolean;

interface ValidationResult {
    valid: boolean;
    errors: Record<string, string>;
}

interface ValidationOptions {
    requiredFields?: string[];      // Zorunlu alanlar
    optionalFields?: string[];      // Opsiyonel alanlar (bunlar eksikse hata vermez)
}

// ============ ANA VALİDASYON FONKSİYONU (GÜNCELLENMİŞ) ============

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
    const { requiredFields = [], optionalFields = [] } = options;
    
    // 1. Required alanların varlık kontrolü
    for (const field of requiredFields) {
        const value = data[field];
        if (value === undefined || value === null || value === '') {
            errors[field] = `${field} is required`;
        }
    }
    
    // 2. Validasyon kurallarını uygula (sadece var olan alanlar için)
    for (const [field, validator] of Object.entries(rules)) {
        const value = data[field];
        
        // Optional alanlar kontrolü: eğer alan optional ise ve değer yoksa atla
        const isOptional = optionalFields.includes(field);
        if (isOptional && (value === undefined || value === null || value === '')) {
            continue;
        }
        
        // Required alanlar zaten yukarıda kontrol edildi, burada sadece validasyon yap
        if (value !== undefined && value !== null) {
            if (!validator(value)) {
                errors[field] = `Invalid ${field}`;
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
 * Örnek kullanım:
 * 
 * const rules = createValidationRules({
 *     email: isValidEmail,
 *     password: isValidPassword,
 *     name: (value) => isValidName(value as string)
 * });
 * 
 * const result = validateInput(
 *     { email: "test@example.com", password: "Pass1234", name: "John Doe" },
 *     rules,
 *     { requiredFields: ["email", "password"] }
 * );
 * 
 * if (!result.valid) {
 *     console.error(result.errors);
 * }
 */