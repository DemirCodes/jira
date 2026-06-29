/**
 * REGEX VALIDATOR (ReDoS Güvenli)
 *
 * Tüm regex pattern'leri ReDoS saldırılarına karşı korumalıdır:
 * - Sınırsız tekrar (a*, a+) içermez
 * - İç içe gruplar minimumda tutulur
 * - Uzunluk limitleri her zaman kontrol edilir
 * - Mümkünse regex yerine string metodları kullanılır
 */
export type ValidationRule = (value: unknown) => boolean;
export interface ValidationResult {
    valid: boolean;
    errors: Record<string, string>;
}
export interface ValidationOptions {
    /** Zorunlu alanlar — eksikse hata verir */
    requiredFields?: string[];
    /** Opsiyonel alanlar — eksikse hata vermez, varsa validate eder */
    optionalFields?: string[];
    /** Alan bazlı özel hata mesajları */
    errorMessages?: Record<string, string>;
    /** Maksimum hata sayısı (varsayılan: Infinity) */
    maxErrors?: number;
    /** true → ilk hatada durur */
    abortEarly?: boolean;
    /** true → boş string'e izin verir */
    allowEmptyStrings?: boolean;
}
/** RFC 5321 uyumlu, ReDoS-güvenli e-posta doğrulama */
export declare const isValidEmail: (email: string) => boolean;
/** UUID v4 doğrulama */
export declare const isValidUUID: (uuid: string) => boolean;
/** İsim doğrulama — Latin + Türkçe karakterlere izin verir */
export declare const isValidName: (name: string, min?: number, max?: number) => boolean;
/** URL-uyumlu slug doğrulama */
export declare const isValidSlug: (slug: string, min?: number, max?: number) => boolean;
/** Şifre doğrulama — küçük/büyük harf + rakam zorunlu */
export declare const isValidPassword: (password: string) => boolean;
/** Kullanıcı adı doğrulama */
export declare const isValidUsername: (username: string, min?: number, max?: number) => boolean;
/**
 * Türkiye odaklı telefon doğrulama.
 * Desteklenen formatlar: 05XX XXX XX XX · +90 5XX · 10 haneli sabit hat
 */
export declare const isValidPhoneNumber: (phone: string) => boolean;
/** URL doğrulama — yalnızca http/https protokolleri */
export declare const isValidUrl: (url: string) => boolean;
/** HTML tag içeriyor mu? */
export declare const containsHtmlTags: (input: string) => boolean;
/** Yalnızca rakam */
export declare const isNumeric: (input: string) => boolean;
/** Yalnızca ASCII harf */
export declare const isAlpha: (input: string) => boolean;
/** ASCII harf + rakam */
export declare const isAlphanumeric: (input: string) => boolean;
/** XSS vektörü içeriyor mu? */
export declare const containsDangerousChars: (input: string) => boolean;
export declare const containsSqlPatterns: (input: string) => boolean;
/**
 * Birden fazla alanı toplu olarak doğrular.
 *
 * @param data    Doğrulanacak veri nesnesi
 * @param rules   Alan bazlı validator fonksiyonları
 * @param options Davranış seçenekleri
 * @returns       `{ valid, errors }`
 */
export declare const validateInput: (data: Record<string, unknown>, rules: Record<string, ValidationRule>, options?: ValidationOptions) => ValidationResult;
/** Hata nesnesini mesaj dizisine çevirir */
export declare const formatValidationErrors: (errors: Record<string, string>) => string[];
/** Tek alan doğrulama */
export declare const validateField: (value: unknown, validator: ValidationRule, fieldName: string) => {
    valid: boolean;
    error?: string;
};
/**
 * Zamanlama saldırısına (timing attack) karşı dayanıklı string karşılaştırma.
 * Sabit süreli XOR — eşitsiz uzunluk hemen false döner (bu kaçınılmazdır).
 */
export declare const safeCompare: (a: string, b: string) => boolean;
/** Tehlikeli karakterleri HTML entity'ye çevirir ve kontrol karakterlerini temizler */
export declare const sanitizeInput: (input: string) => string;
//# sourceMappingURL=regexValidator.d.ts.map