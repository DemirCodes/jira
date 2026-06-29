/**
 * RATE LIMITING MIDDLEWARE
 *
 * DoS saldırılarını engellemek için istek sınırlandırması yapar
 */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const inviteLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const memberManagementLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimit.d.ts.map