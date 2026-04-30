"use strict";
/**
 * HATA KODLARI SİSTEMİ (GELİŞTİRİLMİŞ)
 *
 * Format: XXX-YYY-ZZZ
 * - XXX: Modül (100=AUTH, 200=ORG, 300=SITE, 400=PROJECT, 500=ISSUE, 600=DB, 700=VALIDATION, 800=RATE_LIMIT)
 * - YYY: Kategori (00=GENERAL, 01=NOT_FOUND, 02=PERMISSION, 03=CONFLICT, 04=VALIDATION)
 * - ZZZ: Spesifik hata numarası
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseErrorCode = exports.isAppError = exports.AppError = exports.getHttpStatusFromErrorCode = exports.ErrorMessages = exports.ErrorCodes = void 0;
// 1. Hata Kodları Tanımları (Immutable)
exports.ErrorCodes = {
    // AUTH MODULE (100)
    AUTH_NO_TOKEN: '100-001-001',
    AUTH_INVALID_TOKEN: '100-001-002',
    AUTH_TOKEN_EXPIRED: '100-001-003',
    AUTH_INVALID_CREDENTIALS: '100-002-001',
    AUTH_USER_NOT_FOUND: '100-003-001',
    AUTH_EMAIL_ALREADY_EXISTS: '100-003-002',
    AUTH_WEAK_PASSWORD: '100-004-001',
    AUTH_RATE_LIMIT: '100-004-002',
    // ORGANIZATION MODULE (200)
    ORG_NOT_FOUND: '200-001-001',
    ORG_ALREADY_EXISTS: '200-002-001',
    ORG_SLUG_TAKEN: '200-002-002',
    ORG_PERMISSION_DENIED: '200-003-001',
    ORG_OWNER_REQUIRED: '200-003-002',
    ORG_LIMIT_REACHED: '200-004-001',
    ORG_INVALID_INVITE_CODE: '200-005-001',
    ORG_USER_ALREADY_MEMBER: '200-005-002',
    // SITE MODULE (300)
    SITE_NOT_FOUND: '300-001-001',
    SITE_ALREADY_EXISTS: '300-002-001',
    SITE_SLUG_TAKEN: '300-002-002',
    SITE_PERMISSION_DENIED: '300-003-001',
    SITE_ADMIN_REQUIRED: '300-003-002',
    SITE_PRIVATE_CANNOT_INVITE: '300-004-001',
    // PROJECT MODULE (400)
    PROJECT_NOT_FOUND: '400-001-001',
    PROJECT_ALREADY_EXISTS: '400-002-001',
    PROJECT_SLUG_TAKEN: '400-002-002',
    PROJECT_PERMISSION_DENIED: '400-003-001',
    PROJECT_ADMIN_REQUIRED: '400-003-002',
    PROJECT_PRIVATE_CANNOT_INVITE: '400-004-001',
    PROJECT_CANNOT_DELETE_HAS_ISSUES: '400-005-001',
    // ISSUE MODULE (500)
    ISSUE_NOT_FOUND: '500-001-001',
    ISSUE_PERMISSION_DENIED: '500-002-001',
    ISSUE_CANNOT_DELETE_HAS_CHILDREN: '500-003-001',
    ISSUE_INVALID_STATUS: '500-004-001',
    // DATABASE MODULE (600)
    DB_CONNECTION_FAILED: '600-001-001',
    DB_QUERY_FAILED: '600-002-001',
    DB_UNIQUE_VIOLATION: '600-003-001',
    DB_FOREIGN_KEY_VIOLATION: '600-003-002',
    // VALIDATION MODULE (700)
    VALIDATION_FAILED: '700-001-001',
    VALIDATION_INVALID_EMAIL: '700-002-001',
    VALIDATION_INVALID_UUID: '700-002-002',
    VALIDATION_INVALID_PASSWORD: '700-002-003',
    VALIDATION_INVALID_NAME: '700-002-004',
    VALIDATION_INVALID_SLUG: '700-002-005',
    VALIDATION_MISSING_FIELD: '700-003-001',
    // RATE LIMIT MODULE (800)
    RATE_LIMIT_EXCEEDED: '800-001-001',
};
// 3. Hata Mesajları
exports.ErrorMessages = {
    [exports.ErrorCodes.AUTH_NO_TOKEN]: 'No token provided. Please authenticate.',
    [exports.ErrorCodes.AUTH_INVALID_TOKEN]: 'Invalid token. Please login again.',
    [exports.ErrorCodes.AUTH_TOKEN_EXPIRED]: 'Token expired. Please refresh your token.',
    [exports.ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',
    [exports.ErrorCodes.AUTH_USER_NOT_FOUND]: 'User not found with this email.',
    [exports.ErrorCodes.AUTH_EMAIL_ALREADY_EXISTS]: 'Email already exists. Please use another email.',
    [exports.ErrorCodes.AUTH_WEAK_PASSWORD]: 'Password is too weak. Use at least 8 characters with uppercase, lowercase and number.',
    [exports.ErrorCodes.AUTH_RATE_LIMIT]: 'Too many attempts. Please try again later.',
    [exports.ErrorCodes.ORG_NOT_FOUND]: 'Organization not found.',
    [exports.ErrorCodes.ORG_ALREADY_EXISTS]: 'Organization with this name already exists.',
    [exports.ErrorCodes.ORG_SLUG_TAKEN]: 'This slug is already taken.',
    [exports.ErrorCodes.ORG_PERMISSION_DENIED]: 'You do not have permission to perform this action.',
    [exports.ErrorCodes.ORG_OWNER_REQUIRED]: 'Only organization owner can perform this action.',
    [exports.ErrorCodes.ORG_LIMIT_REACHED]: 'Organization creation limit reached (max 2).',
    [exports.ErrorCodes.ORG_INVALID_INVITE_CODE]: 'Invalid friendship code.',
    [exports.ErrorCodes.ORG_USER_ALREADY_MEMBER]: 'User is already a member of this organization.',
    [exports.ErrorCodes.SITE_NOT_FOUND]: 'Site not found.',
    [exports.ErrorCodes.SITE_ALREADY_EXISTS]: 'Site with this name already exists.',
    [exports.ErrorCodes.SITE_SLUG_TAKEN]: 'This site slug is already taken.',
    [exports.ErrorCodes.SITE_PERMISSION_DENIED]: 'You do not have permission to perform this action on this site.',
    [exports.ErrorCodes.SITE_ADMIN_REQUIRED]: 'Only site admin can perform this action.',
    [exports.ErrorCodes.SITE_PRIVATE_CANNOT_INVITE]: 'Cannot invite users to private site.',
    [exports.ErrorCodes.PROJECT_NOT_FOUND]: 'Project not found.',
    [exports.ErrorCodes.PROJECT_ALREADY_EXISTS]: 'Project with this name already exists in this site.',
    [exports.ErrorCodes.PROJECT_SLUG_TAKEN]: 'This project slug is already taken.',
    [exports.ErrorCodes.PROJECT_PERMISSION_DENIED]: 'You do not have permission to perform this action on this project.',
    [exports.ErrorCodes.PROJECT_ADMIN_REQUIRED]: 'Only project admin can perform this action.',
    [exports.ErrorCodes.PROJECT_PRIVATE_CANNOT_INVITE]: 'Cannot invite users to private project.',
    [exports.ErrorCodes.PROJECT_CANNOT_DELETE_HAS_ISSUES]: 'Cannot delete project with existing issues.',
    [exports.ErrorCodes.ISSUE_NOT_FOUND]: 'Issue not found.',
    [exports.ErrorCodes.ISSUE_PERMISSION_DENIED]: 'You do not have permission to perform this action on this issue.',
    [exports.ErrorCodes.ISSUE_CANNOT_DELETE_HAS_CHILDREN]: 'Cannot delete issue with child issues.',
    [exports.ErrorCodes.ISSUE_INVALID_STATUS]: 'Invalid status transition.',
    [exports.ErrorCodes.DB_CONNECTION_FAILED]: 'Database connection failed.',
    [exports.ErrorCodes.DB_QUERY_FAILED]: 'Database query failed.',
    [exports.ErrorCodes.DB_UNIQUE_VIOLATION]: 'Resource already exists.',
    [exports.ErrorCodes.DB_FOREIGN_KEY_VIOLATION]: 'Related resource not found.',
    [exports.ErrorCodes.VALIDATION_FAILED]: 'Validation failed.',
    [exports.ErrorCodes.VALIDATION_INVALID_EMAIL]: 'Invalid email format.',
    [exports.ErrorCodes.VALIDATION_INVALID_UUID]: 'Invalid UUID format.',
    [exports.ErrorCodes.VALIDATION_INVALID_PASSWORD]: 'Password must be at least 8 characters with uppercase, lowercase and number.',
    [exports.ErrorCodes.VALIDATION_INVALID_NAME]: 'Invalid name format.',
    [exports.ErrorCodes.VALIDATION_INVALID_SLUG]: 'Invalid slug format. Use only lowercase letters, numbers and hyphens.',
    [exports.ErrorCodes.VALIDATION_MISSING_FIELD]: 'Required field is missing.',
    [exports.ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
};
// 4. HTTP Durum Kodu Belirleyici
const getHttpStatusFromErrorCode = (errorCode) => {
    const parts = errorCode.split('-');
    const moduleCode = parseInt(parts[0], 10);
    const categoryCode = parseInt(parts[1], 10);
    // Kategoriye göre HTTP kodunu belirle
    if (categoryCode === 1)
        return 404; // NOT_FOUND
    if (categoryCode === 2)
        return 403; // PERMISSION
    if (categoryCode === 3)
        return 409; // CONFLICT
    if (categoryCode === 4)
        return 422; // VALIDATION
    // Modüle göre varsayılanlar
    if (moduleCode === 100)
        return 401; // Auth
    if (moduleCode === 600)
        return 503; // Database
    if (moduleCode === 800)
        return 429; // Rate Limit
    return 500;
};
exports.getHttpStatusFromErrorCode = getHttpStatusFromErrorCode;
// 5. Custom Error Sınıfı
class AppError extends Error {
    statusCode;
    errorCode;
    isOperational;
    constructor(errorCode, message, statusCode) {
        const errorMessage = message || exports.ErrorMessages[errorCode] || 'Unknown Error';
        const calculatedStatus = statusCode || (0, exports.getHttpStatusFromErrorCode)(errorCode);
        super(errorMessage);
        this.name = 'AppError';
        this.errorCode = errorCode;
        this.statusCode = calculatedStatus;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// 6. Yardımcı Fonksiyonlar
const isAppError = (error) => {
    return error instanceof AppError;
};
exports.isAppError = isAppError;
const parseErrorCode = (errorCode) => {
    const parts = errorCode.split('-');
    return {
        module: parseInt(parts[0], 10),
        category: parseInt(parts[1], 10),
        detail: parseInt(parts[2], 10),
    };
};
exports.parseErrorCode = parseErrorCode;
//# sourceMappingURL=errorCodes.js.map