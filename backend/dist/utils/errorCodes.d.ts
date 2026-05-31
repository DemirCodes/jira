/**
 * HATA KODLARI SİSTEMİ (KURUMSAL MİMARİ)
 *
 * Format: XXX-YYY-ZZZ
 * - XXX: Modül (100=AUTH, 200=ORG, 300=SITE, 400=PROJECT, 500=ISSUE, 600=DB, 700=VALIDATION, 800=RATE_LIMIT)
 * - YYY: Kategori (01=NOT_FOUND, 02=PERMISSION, 03=CONFLICT, 04=VALIDATION, 00=GENERAL)
 * - ZZZ: Spesifik hata numarası (her kategoride 001'den başlar)
 */
export declare const ErrorCodes: {
    readonly AUTH_NO_TOKEN: "100-002-001";
    readonly AUTH_INVALID_TOKEN: "100-002-002";
    readonly AUTH_TOKEN_EXPIRED: "100-002-003";
    readonly AUTH_INSUFFICIENT_PRIVILEGES: "100-002-004";
    readonly AUTH_INVALID_CREDENTIALS: "100-002-005";
    readonly AUTH_USER_NOT_FOUND: "100-001-001";
    readonly AUTH_EMAIL_ALREADY_EXISTS: "100-003-001";
    readonly AUTH_WEAK_PASSWORD: "100-004-001";
    readonly AUTH_RATE_LIMIT: "100-000-001";
    readonly ORG_NOT_FOUND: "200-001-001";
    readonly ORG_PERMISSION_DENIED: "200-002-001";
    readonly ORG_OWNER_REQUIRED: "200-002-002";
    readonly ORG_ALREADY_EXISTS: "200-003-001";
    readonly ORG_SLUG_TAKEN: "200-003-002";
    readonly ORG_USER_ALREADY_MEMBER: "200-003-003";
    readonly ORG_LIMIT_REACHED: "200-004-001";
    readonly ORG_INVALID_INVITE_CODE: "200-004-002";
    readonly ORG_CANNOT_DELETE_HAS_SITES: "200-003-004";
    readonly SITE_NOT_FOUND: "300-001-001";
    readonly SITE_PERMISSION_DENIED: "300-002-001";
    readonly SITE_ADMIN_REQUIRED: "300-002-002";
    readonly SITE_ALREADY_EXISTS: "300-003-001";
    readonly SITE_SLUG_TAKEN: "300-003-002";
    readonly SITE_PRIVATE_CANNOT_INVITE: "300-002-003";
    readonly SITE_CANNOT_DELETE_HAS_PROJECTS: "300-003-003";
    readonly PROJECT_NOT_FOUND: "400-001-001";
    readonly PROJECT_PERMISSION_DENIED: "400-002-001";
    readonly PROJECT_ADMIN_REQUIRED: "400-002-002";
    readonly PROJECT_ALREADY_EXISTS: "400-003-001";
    readonly PROJECT_SLUG_TAKEN: "400-003-002";
    readonly PROJECT_PRIVATE_CANNOT_INVITE: "400-002-003";
    readonly PROJECT_CANNOT_DELETE_HAS_ISSUES: "400-003-003";
    readonly ISSUE_NOT_FOUND: "500-001-001";
    readonly ISSUE_PERMISSION_DENIED: "500-002-001";
    readonly ISSUE_CANNOT_DELETE_HAS_CHILDREN: "500-003-001";
    readonly ISSUE_INVALID_STATUS: "500-004-001";
    readonly DB_CONNECTION_FAILED: "600-000-001";
    readonly DB_QUERY_FAILED: "600-000-002";
    readonly DB_UNIQUE_VIOLATION: "600-003-001";
    readonly DB_FOREIGN_KEY_VIOLATION: "600-003-002";
    readonly VALIDATION_FAILED: "700-004-001";
    readonly VALIDATION_INVALID_EMAIL: "700-004-002";
    readonly VALIDATION_INVALID_UUID: "700-004-003";
    readonly VALIDATION_INVALID_PASSWORD: "700-004-004";
    readonly VALIDATION_INVALID_NAME: "700-004-005";
    readonly VALIDATION_INVALID_SLUG: "700-004-006";
    readonly VALIDATION_MISSING_FIELD: "700-004-007";
    readonly RATE_LIMIT_EXCEEDED: "800-000-001";
};
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
export declare const ErrorMessages: Partial<Record<ErrorCode, string>>;
export declare const getHttpStatusFromErrorCode: (errorCode: ErrorCode) => number;
export declare class AppError extends Error {
    statusCode: number;
    errorCode: ErrorCode;
    isOperational: boolean;
    constructor(errorCode: ErrorCode, message?: string, statusCode?: number);
}
export declare const isAppError: (error: unknown) => error is AppError;
export declare const parseErrorCode: (errorCode: ErrorCode) => {
    module: number;
    category: number;
    detail: number;
};
//# sourceMappingURL=errorCodes.d.ts.map