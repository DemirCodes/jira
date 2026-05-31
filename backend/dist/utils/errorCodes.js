"use strict";
/**
 * HATA KODLARI SİSTEMİ (KURUMSAL MİMARİ)
 *
 * Format: XXX-YYY-ZZZ
 * - XXX: Modül (100=AUTH, 200=ORG, 300=SITE, 400=PROJECT, 500=ISSUE, 600=DB, 700=VALIDATION, 800=RATE_LIMIT)
 * - YYY: Kategori (01=NOT_FOUND, 02=PERMISSION, 03=CONFLICT, 04=VALIDATION, 00=GENERAL)
 * - ZZZ: Spesifik hata numarası (her kategoride 001'den başlar)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseErrorCode = exports.isAppError = exports.AppError = exports.getHttpStatusFromErrorCode = exports.ErrorMessages = exports.ErrorCodes = void 0;
// 1. Benzersiz Hata Kodları Tanımları
exports.ErrorCodes = {
    // AUTH MODULE (100)
    AUTH_NO_TOKEN: '100-002-001', // 401
    AUTH_INVALID_TOKEN: '100-002-002', // 401
    AUTH_TOKEN_EXPIRED: '100-002-003', // 401
    AUTH_INSUFFICIENT_PRIVILEGES: '100-002-004', // 403 (yeni)
    AUTH_INVALID_CREDENTIALS: '100-002-005', // 401 (genelde 401, ama 002 kategorisi)
    AUTH_USER_NOT_FOUND: '100-001-001', // 404
    AUTH_EMAIL_ALREADY_EXISTS: '100-003-001', // 409
    AUTH_WEAK_PASSWORD: '100-004-001', // 422
    AUTH_RATE_LIMIT: '100-000-001', // 429 (özel)
    // ORGANIZATION MODULE (200)
    ORG_NOT_FOUND: '200-001-001', // 404
    ORG_PERMISSION_DENIED: '200-002-001', // 403
    ORG_OWNER_REQUIRED: '200-002-002', // 403
    ORG_ALREADY_EXISTS: '200-003-001', // 409 (isim çakışması)
    ORG_SLUG_TAKEN: '200-003-002', // 409
    ORG_USER_ALREADY_MEMBER: '200-003-003', // 409
    ORG_LIMIT_REACHED: '200-004-001', // 422
    ORG_INVALID_INVITE_CODE: '200-004-002', // 422
    ORG_CANNOT_DELETE_HAS_SITES: '200-003-004', // 409
    // SITE MODULE (300)
    SITE_NOT_FOUND: '300-001-001', // 404
    SITE_PERMISSION_DENIED: '300-002-001', // 403
    SITE_ADMIN_REQUIRED: '300-002-002', // 403
    SITE_ALREADY_EXISTS: '300-003-001', // 409
    SITE_SLUG_TAKEN: '300-003-002', // 409
    SITE_PRIVATE_CANNOT_INVITE: '300-002-003', // 403
    SITE_CANNOT_DELETE_HAS_PROJECTS: '300-003-003', // 409
    // PROJECT MODULE (400)
    PROJECT_NOT_FOUND: '400-001-001', // 404
    PROJECT_PERMISSION_DENIED: '400-002-001', // 403
    PROJECT_ADMIN_REQUIRED: '400-002-002', // 403
    PROJECT_ALREADY_EXISTS: '400-003-001', // 409
    PROJECT_SLUG_TAKEN: '400-003-002', // 409
    PROJECT_PRIVATE_CANNOT_INVITE: '400-002-003', // 403
    PROJECT_CANNOT_DELETE_HAS_ISSUES: '400-003-003', // 409
    // ISSUE MODULE (500)
    ISSUE_NOT_FOUND: '500-001-001', // 404
    ISSUE_PERMISSION_DENIED: '500-002-001', // 403
    ISSUE_CANNOT_DELETE_HAS_CHILDREN: '500-003-001', // 409
    ISSUE_INVALID_STATUS: '500-004-001', // 422
    // DATABASE MODULE (600)
    DB_CONNECTION_FAILED: '600-000-001', // 503
    DB_QUERY_FAILED: '600-000-002', // 500
    DB_UNIQUE_VIOLATION: '600-003-001', // 409
    DB_FOREIGN_KEY_VIOLATION: '600-003-002', // 409
    // VALIDATION MODULE (700)
    VALIDATION_FAILED: '700-004-001', // 422
    VALIDATION_INVALID_EMAIL: '700-004-002', // 422
    VALIDATION_INVALID_UUID: '700-004-003', // 422
    VALIDATION_INVALID_PASSWORD: '700-004-004', // 422
    VALIDATION_INVALID_NAME: '700-004-005', // 422
    VALIDATION_INVALID_SLUG: '700-004-006', // 422
    VALIDATION_MISSING_FIELD: '700-004-007', // 422
    // RATE LIMIT MODULE (800)
    RATE_LIMIT_EXCEEDED: '800-000-001', // 429
};
// 3. Hata Mesajları (opsiyonel, çünkü servisler genelde kendi mesajını verir)
exports.ErrorMessages = {
    [exports.ErrorCodes.AUTH_NO_TOKEN]: 'No token provided. Please authenticate.',
    [exports.ErrorCodes.AUTH_INVALID_TOKEN]: 'Invalid token. Please login again.',
    [exports.ErrorCodes.AUTH_TOKEN_EXPIRED]: 'Token expired. Please refresh your token.',
    [exports.ErrorCodes.AUTH_INSUFFICIENT_PRIVILEGES]: 'You do not have sufficient privileges.',
    [exports.ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',
    [exports.ErrorCodes.AUTH_USER_NOT_FOUND]: 'User not found with this email.',
    [exports.ErrorCodes.AUTH_EMAIL_ALREADY_EXISTS]: 'Email already exists. Please use another email.',
    [exports.ErrorCodes.AUTH_WEAK_PASSWORD]: 'Password is too weak.',
    [exports.ErrorCodes.AUTH_RATE_LIMIT]: 'Too many attempts. Please try again later.',
    [exports.ErrorCodes.ORG_NOT_FOUND]: 'Organization not found.',
    [exports.ErrorCodes.ORG_PERMISSION_DENIED]: 'You do not have permission to perform this action.',
    [exports.ErrorCodes.ORG_OWNER_REQUIRED]: 'Only organization owner can perform this action.',
    [exports.ErrorCodes.ORG_ALREADY_EXISTS]: 'Organization with this name already exists.',
    [exports.ErrorCodes.ORG_SLUG_TAKEN]: 'This slug is already taken.',
    [exports.ErrorCodes.ORG_USER_ALREADY_MEMBER]: 'User is already a member of this organization.',
    [exports.ErrorCodes.ORG_LIMIT_REACHED]: 'Organization creation limit reached (max 2).',
    [exports.ErrorCodes.ORG_INVALID_INVITE_CODE]: 'Invalid friendship code.',
    [exports.ErrorCodes.ORG_CANNOT_DELETE_HAS_SITES]: 'Cannot delete organization with active sites.',
    [exports.ErrorCodes.SITE_NOT_FOUND]: 'Site not found.',
    [exports.ErrorCodes.SITE_PERMISSION_DENIED]: 'You do not have permission to perform this action on this site.',
    [exports.ErrorCodes.SITE_ADMIN_REQUIRED]: 'Only site admin can perform this action.',
    [exports.ErrorCodes.SITE_ALREADY_EXISTS]: 'Site with this name already exists.',
    [exports.ErrorCodes.SITE_SLUG_TAKEN]: 'This site slug is already taken.',
    [exports.ErrorCodes.SITE_PRIVATE_CANNOT_INVITE]: 'Cannot invite users to private site.',
    [exports.ErrorCodes.SITE_CANNOT_DELETE_HAS_PROJECTS]: 'Cannot delete site with existing projects.',
    [exports.ErrorCodes.PROJECT_NOT_FOUND]: 'Project not found.',
    [exports.ErrorCodes.PROJECT_PERMISSION_DENIED]: 'You do not have permission to perform this action on this project.',
    [exports.ErrorCodes.PROJECT_ADMIN_REQUIRED]: 'Only project admin can perform this action.',
    [exports.ErrorCodes.PROJECT_ALREADY_EXISTS]: 'Project with this name already exists in this site.',
    [exports.ErrorCodes.PROJECT_SLUG_TAKEN]: 'This project slug is already taken.',
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
    [exports.ErrorCodes.VALIDATION_INVALID_PASSWORD]: 'Password must be at least 8 characters.',
    [exports.ErrorCodes.VALIDATION_INVALID_NAME]: 'Invalid name format.',
    [exports.ErrorCodes.VALIDATION_INVALID_SLUG]: 'Invalid slug format.',
    [exports.ErrorCodes.VALIDATION_MISSING_FIELD]: 'Required field is missing.',
    [exports.ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
};
// 4. HTTP Durum Kodu Belirleyici
const getHttpStatusFromErrorCode = (errorCode) => {
    const parts = errorCode.split('-');
    const moduleCode = parseInt(parts[0], 10);
    const categoryCode = parseInt(parts[1], 10);
    // Modüle özel varsayılanlar
    if (moduleCode === 100)
        return 401; // Auth
    if (moduleCode === 600)
        return 500; // DB (genel hata)
    if (moduleCode === 800)
        return 429; // Rate Limit
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
        Object.setPrototypeOf(this, AppError.prototype);
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