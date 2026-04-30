/**
 * REGEX VALIDATOR (ReDoS Güvenli)
 *
 * Tüm regex pattern'leri ReDoS saldırılarına karşı korumalıdır.
 * - Sınırsız tekrar (a*, a+, a{1,}) içermez
 * - İç içe gruplar minimumda tutulur
 * - Uzunluk limitleri her zaman kontrol edilir
 * - Mümkünse regex yerine string method'ları kullanılır
 */
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidUUID: (uuid: string) => boolean;
export declare const isValidName: (name: string, min?: number, max?: number) => boolean;
export declare const isValidSlug: (slug: string, min?: number, max?: number) => boolean;
export declare const isValidPassword: (password: string) => boolean;
export declare const isValidUsername: (username: string, min?: number, max?: number) => boolean;
export declare const isValidPhoneNumber: (phone: string) => boolean;
export declare const isValidUrl: (url: string) => boolean;
export declare const containsHtmlTags: (input: string) => boolean;
export declare const isNumeric: (input: string) => boolean;
export declare const isAlpha: (input: string) => boolean;
export declare const isAlphanumeric: (input: string) => boolean;
export declare const containsDangerousChars: (input: string) => boolean;
export declare const containsSqlPatterns: (input: string) => boolean;
export type ValidationRule = (value: unknown) => boolean;
interface ValidationResult {
    valid: boolean;
    errors: Record<string, string>;
}
interface ValidationOptions {
    requiredFields?: string[];
    optionalFields?: string[];
}
/**
 * Tüm alanları toplu olarak doğrular
 * @param data - Doğrulanacak veri nesnesi
 * @param rules - Alan bazlı validator fonksiyonları
 * @param options - Validasyon seçenekleri (requiredFields, optionalFields)
 * @returns ValidationResult - valid ve errors objesi döner
 */
export declare const validateInput: (data: Record<string, unknown>, rules: Record<string, ValidationRule>, options?: ValidationOptions) => ValidationResult;
/**
 * Validasyon kuralları oluşturmak için yardımcı fonksiyon
 */
export declare const createValidationRules: <T extends Record<string, unknown>>(schema: Record<keyof T, ValidationRule>) => Record<keyof T, ValidationRule>;
export {};
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
//# sourceMappingURL=regexValidator.d.ts.map