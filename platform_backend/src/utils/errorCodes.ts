/**
 * HATA KODLARI SİSTEMİ (KURUMSAL MİMARİ)
 * 
 * Format: XXX-YYY-ZZZ
 * - XXX: Modül (100=AUTH, 200=ORG, 300=SITE, 400=PROJECT, 500=ISSUE, 600=DB, 700=VALIDATION, 800=RATE_LIMIT)
 * - YYY: Kategori (01=NOT_FOUND, 02=PERMISSION, 03=CONFLICT, 04=VALIDATION, 00=GENERAL)
 * - ZZZ: Spesifik hata numarası (her kategoride 001'den başlar)
 */

// 1. Benzersiz Hata Kodları Tanımları
export const ErrorCodes = {
    // ==========================================
    // PLATFORM AUTH MODULE (100) - Eklenecekler
    // ==========================================
    AUTH_NO_TOKEN: '100-002-001',             // 401 - Token yok
    AUTH_INVALID_TOKEN: '100-002-002',         // 401 - Token geçersiz
    AUTH_TOKEN_EXPIRED: '100-002-003',         // 401 - Token süresi dolmuş
    AUTH_INSUFFICIENT_PRIVILEGES: '100-002-004', // 403 - Yetki yetersiz
    AUTH_INVALID_CREDENTIALS: '100-002-005',    // 401 - Geçersiz email/şifre
    AUTH_FORBIDDEN: '100-002-006',              // 403 - Platform user context missing
    AUTH_SESSION_REVOKED: '100-002-007',        // 401 - Session iptal edilmiş
    AUTH_USER_NOT_FOUND: '100-001-001',         // 404 - Kullanıcı bulunamadı
    AUTH_SESSION_NOT_FOUND: '100-001-002',      // 404 - Session bulunamadı
    AUTH_EMAIL_ALREADY_EXISTS: '100-003-001',   // 409 - Email zaten kayıtlı
    AUTH_USER_ALREADY_EXISTS: '100-003-002',    // 409 - Kullanıcı zaten var
    AUTH_SESSION_ALREADY_EXISTS: '100-003-003', // 409 - Aktif session zaten var
    AUTH_WEAK_PASSWORD: '100-004-001',          // 422 - Zayıf şifre
    AUTH_INVALID_EMAIL: '100-004-002',          // 422 - Geçersiz email formatı
    AUTH_INVALID_ROLE: '100-004-003',           // 422 - Geçersiz rol
    AUTH_PASSWORD_MISMATCH: '100-004-004',      // 422 - Şifreler eşleşmiyor
    AUTH_USER_INACTIVE: '100-002-008',          // 403 - Hesap devre dışı
    AUTH_USER_DELETED: '100-002-009',           // 403 - Hesap silinmiş
    AUTH_RATE_LIMIT: '100-000-001',             // 429 - Çok fazla deneme
    AUTH_REGISTRATION_DISABLED: '100-002-010',  // 403 - Kayıt kapalı
    AUTH_SESSION_EXPIRED: '100-001-003',        // 401 - Session süresi dolmuş
    AUTH_LOGOUT_FAILED: '100-000-002',          // 500 - Çıkış başarısız
    AUTH_REGISTER_FAILED: '100-000-003',        // 500 - Kayıt başarısız
    AUTH_LOGIN_FAILED: '100-000-004',           // 500 - Giriş başarısız
    AUTH_HASH_FAILED: '100-000-005',            // 500 - Şifre hash'leme hatası
    AUTH_TOKEN_GENERATION_FAILED: '100-000-006', // 500 - Token oluşturma hatası
    AUTH_CACHE_FAILED: '100-000-007',           // 500 - Cache hatası
    AUTH_DB_ERROR: '100-000-008',              // 500 - Veritabanı hatası




    // ORGANIZATION MODULE (200)
    ORG_NOT_FOUND: '200-001-001',               // 404
    ORG_PERMISSION_DENIED: '200-002-001',       // 403
    ORG_OWNER_REQUIRED: '200-002-002',          // 403
    ORG_ALREADY_EXISTS: '200-003-001',          // 409 (isim çakışması)
    ORG_SLUG_TAKEN: '200-003-002',              // 409
    ORG_USER_ALREADY_MEMBER: '200-003-003',     // 409
    ORG_LIMIT_REACHED: '200-004-001',           // 422
    ORG_INVALID_INVITE_CODE: '200-004-002',     // 422
    ORG_CANNOT_DELETE_HAS_SITES: '200-003-004', // 409

    // SITE MODULE (300)
    SITE_NOT_FOUND: '300-001-001',              // 404
    SITE_PERMISSION_DENIED: '300-002-001',      // 403
    SITE_ADMIN_REQUIRED: '300-002-002',         // 403
    SITE_ALREADY_EXISTS: '300-003-001',         // 409
    SITE_SLUG_TAKEN: '300-003-002',             // 409
    SITE_PRIVATE_CANNOT_INVITE: '300-002-003',  // 403
    SITE_CANNOT_DELETE_HAS_PROJECTS: '300-003-003', // 409

    // PROJECT MODULE (400)
    PROJECT_NOT_FOUND: '400-001-001',           // 404
    PROJECT_PERMISSION_DENIED: '400-002-001',   // 403
    PROJECT_ADMIN_REQUIRED: '400-002-002',      // 403
    PROJECT_ALREADY_EXISTS: '400-003-001',      // 409
    PROJECT_SLUG_TAKEN: '400-003-002',          // 409
    PROJECT_PRIVATE_CANNOT_INVITE: '400-002-003', // 403
    PROJECT_CANNOT_DELETE_HAS_ISSUES: '400-003-003', // 409

    // ISSUE MODULE (500)
    ISSUE_NOT_FOUND: '500-001-001',             // 404
    ISSUE_PERMISSION_DENIED: '500-002-001',     // 403
    ISSUE_CANNOT_DELETE_HAS_CHILDREN: '500-003-001', // 409
    ISSUE_ALREADY_EXISTS: '500-003-002',           // 409 
    ISSUE_INVALID_STATUS: '500-004-001',        // 422

    // DATABASE MODULE (600)
    DB_CONNECTION_FAILED: '600-000-001',        // 503
    DB_QUERY_FAILED: '600-000-002',             // 500
    DB_UNIQUE_VIOLATION: '600-003-001',         // 409
    DB_FOREIGN_KEY_VIOLATION: '600-003-002',    // 409

    // VALIDATION MODULE (700)
    VALIDATION_FAILED: '700-004-001',           // 422
    VALIDATION_INVALID_EMAIL: '700-004-002',    // 422
    VALIDATION_INVALID_UUID: '700-004-003',     // 422
    VALIDATION_INVALID_PASSWORD: '700-004-004', // 422
    VALIDATION_INVALID_NAME: '700-004-005',     // 422
    VALIDATION_INVALID_SLUG: '700-004-006',     // 422
    VALIDATION_MISSING_FIELD: '700-004-007',    // 422

    // RATE LIMIT MODULE (800)
    RATE_LIMIT_EXCEEDED: '800-000-001',         // 429

    INTERNAL_SERVER_ERROR: '600-000-999',        // 500 (genel hata, özel durumlar için kullanılabilir)

} as const;

// 2. TypeScript Tip Tanımları
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// 3. Hata Mesajları (opsiyonel, çünkü servisler genelde kendi mesajını verir)
export const ErrorMessages: Partial<Record<ErrorCode, string>> = {

    
    [ErrorCodes.AUTH_NO_TOKEN]: 'Authentication token is required',
    [ErrorCodes.AUTH_INVALID_TOKEN]: 'Invalid authentication token',
    [ErrorCodes.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
    [ErrorCodes.AUTH_INSUFFICIENT_PRIVILEGES]: 'You do not have permission to perform this action',
    [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
    [ErrorCodes.AUTH_FORBIDDEN]: 'Access denied. Platform user context required',
    [ErrorCodes.AUTH_SESSION_REVOKED]: 'Session has been revoked. Please login again',
    [ErrorCodes.AUTH_USER_NOT_FOUND]: 'User not found',
    [ErrorCodes.AUTH_SESSION_NOT_FOUND]: 'Session not found',
    [ErrorCodes.AUTH_EMAIL_ALREADY_EXISTS]: 'This email address is already registered',
    [ErrorCodes.AUTH_USER_ALREADY_EXISTS]: 'User already exists',
    [ErrorCodes.AUTH_SESSION_ALREADY_EXISTS]: 'Active session already exists',
    [ErrorCodes.AUTH_WEAK_PASSWORD]: 'Password does not meet security requirements',
    [ErrorCodes.AUTH_INVALID_EMAIL]: 'Invalid email format',
    [ErrorCodes.AUTH_INVALID_ROLE]: 'Invalid user role specified',
    [ErrorCodes.AUTH_PASSWORD_MISMATCH]: 'Passwords do not match',
    [ErrorCodes.AUTH_USER_INACTIVE]: 'Account is deactivated. Please contact administrator',
    [ErrorCodes.AUTH_USER_DELETED]: 'Account has been deleted',
    [ErrorCodes.AUTH_RATE_LIMIT]: 'Too many login attempts. Please try again later',
    [ErrorCodes.AUTH_REGISTRATION_DISABLED]: 'Registration is currently disabled',
    [ErrorCodes.AUTH_SESSION_EXPIRED]: 'Session has expired. Please login again',
    [ErrorCodes.AUTH_LOGOUT_FAILED]: 'Logout failed. Please try again',
    [ErrorCodes.AUTH_REGISTER_FAILED]: 'Registration failed. Please try again',
    [ErrorCodes.AUTH_LOGIN_FAILED]: 'Login failed. Please try again',
    [ErrorCodes.AUTH_HASH_FAILED]: 'Password processing failed',
    [ErrorCodes.AUTH_TOKEN_GENERATION_FAILED]: 'Token generation failed',
    [ErrorCodes.AUTH_CACHE_FAILED]: 'Cache operation failed',
    [ErrorCodes.AUTH_DB_ERROR]: 'Database operation failed',


    [ErrorCodes.ORG_NOT_FOUND]: 'Organization not found.',
    [ErrorCodes.ORG_PERMISSION_DENIED]: 'You do not have permission to perform this action.',
    [ErrorCodes.ORG_OWNER_REQUIRED]: 'Only organization owner can perform this action.',
    [ErrorCodes.ORG_ALREADY_EXISTS]: 'Organization with this name already exists.',
    [ErrorCodes.ORG_SLUG_TAKEN]: 'This slug is already taken.',
    [ErrorCodes.ORG_USER_ALREADY_MEMBER]: 'User is already a member of this organization.',
    [ErrorCodes.ORG_LIMIT_REACHED]: 'Organization creation limit reached (max 2).',
    [ErrorCodes.ORG_INVALID_INVITE_CODE]: 'Invalid friendship code.',
    [ErrorCodes.ORG_CANNOT_DELETE_HAS_SITES]: 'Cannot delete organization with active sites.',

    [ErrorCodes.SITE_NOT_FOUND]: 'Site not found.',
    [ErrorCodes.SITE_PERMISSION_DENIED]: 'You do not have permission to perform this action on this site.',
    [ErrorCodes.SITE_ADMIN_REQUIRED]: 'Only site admin can perform this action.',
    [ErrorCodes.SITE_ALREADY_EXISTS]: 'Site with this name already exists.',
    [ErrorCodes.SITE_SLUG_TAKEN]: 'This site slug is already taken.',
    [ErrorCodes.SITE_PRIVATE_CANNOT_INVITE]: 'Cannot invite users to private site.',
    [ErrorCodes.SITE_CANNOT_DELETE_HAS_PROJECTS]: 'Cannot delete site with existing projects.',

    [ErrorCodes.PROJECT_NOT_FOUND]: 'Project not found.',
    [ErrorCodes.PROJECT_PERMISSION_DENIED]: 'You do not have permission to perform this action on this project.',
    [ErrorCodes.PROJECT_ADMIN_REQUIRED]: 'Only project admin can perform this action.',
    [ErrorCodes.PROJECT_ALREADY_EXISTS]: 'Project with this name already exists in this site.',
    [ErrorCodes.PROJECT_SLUG_TAKEN]: 'This project slug is already taken.',
    [ErrorCodes.PROJECT_PRIVATE_CANNOT_INVITE]: 'Cannot invite users to private project.',
    [ErrorCodes.PROJECT_CANNOT_DELETE_HAS_ISSUES]: 'Cannot delete project with existing issues.',

    [ErrorCodes.ISSUE_NOT_FOUND]: 'Issue not found.',
    [ErrorCodes.ISSUE_PERMISSION_DENIED]: 'You do not have permission to perform this action on this issue.',
    [ErrorCodes.ISSUE_ALREADY_EXISTS]: 'Issue with this name already exists.',
    [ErrorCodes.ISSUE_CANNOT_DELETE_HAS_CHILDREN]: 'Cannot delete issue with child issues.',
    [ErrorCodes.ISSUE_INVALID_STATUS]: 'Invalid status transition.',

    [ErrorCodes.DB_CONNECTION_FAILED]: 'Database connection failed.',
    [ErrorCodes.DB_QUERY_FAILED]: 'Database query failed.',
    [ErrorCodes.DB_UNIQUE_VIOLATION]: 'Resource already exists.',
    [ErrorCodes.DB_FOREIGN_KEY_VIOLATION]: 'Related resource not found.',

    [ErrorCodes.VALIDATION_FAILED]: 'Validation failed.',
    [ErrorCodes.VALIDATION_INVALID_EMAIL]: 'Invalid email format.',
    [ErrorCodes.VALIDATION_INVALID_UUID]: 'Invalid UUID format.',
    [ErrorCodes.VALIDATION_INVALID_PASSWORD]: 'Password must be at least 8 characters.',
    [ErrorCodes.VALIDATION_INVALID_NAME]: 'Invalid name format.',
    [ErrorCodes.VALIDATION_INVALID_SLUG]: 'Invalid slug format.',
    [ErrorCodes.VALIDATION_MISSING_FIELD]: 'Required field is missing.',

    [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',

    [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error. Please try again later.',


};

// 4. HTTP Durum Kodu Belirleyici
export const getHttpStatusFromErrorCode = (errorCode: ErrorCode): number => {
    const parts = errorCode.split('-');
    const moduleCode = parseInt(parts[0], 10);
    const categoryCode = parseInt(parts[1], 10);

    // Modüle özel varsayılanlar
    if (moduleCode === 100) return 401; // Auth
    if (moduleCode === 600) return 500; // DB (genel hata)
    if (moduleCode === 800) return 429; // Rate Limit

    // Kategoriye göre HTTP durum kodları
    switch (categoryCode) {
        case 1: return 404; // Not Found
        case 2: return 403; // Forbidden (Permission)
        case 3: return 409; // Conflict
        case 4: return 422; // Unprocessable Entity (Validation)
        case 0:
        default:
            return 500; // Internal Server Error
    }
};

// 5. Custom Error Sınıfı
export class AppError extends Error {
    public statusCode: number;
    public errorCode: ErrorCode;
    public isOperational: boolean;

    constructor(errorCode: ErrorCode, message?: string, statusCode?: number) {
        const errorMessage = message || ErrorMessages[errorCode] || 'Unknown Error';
        const calculatedStatus = statusCode || getHttpStatusFromErrorCode(errorCode);

        super(errorMessage);
        this.name = 'AppError';
        this.errorCode = errorCode;
        this.statusCode = calculatedStatus;
        this.isOperational = true;

        Object.setPrototypeOf(this, AppError.prototype);
    }
}

// 6. Yardımcı Fonksiyonlar
export const isAppError = (error: unknown): error is AppError => {
    return error instanceof AppError;
};

export const parseErrorCode = (errorCode: ErrorCode): { module: number; category: number; detail: number } => {
    const parts = errorCode.split('-');
    return {
        module: parseInt(parts[0], 10),
        category: parseInt(parts[1], 10),
        detail: parseInt(parts[2], 10),
    };
};