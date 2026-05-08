"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = exports.authLimiter = exports.apiLimiter = exports.setupSecurity = void 0;
var helmet_1 = require("helmet");
var cors_1 = require("cors");
var setupSecurity = function (app) {
    app.use((0, helmet_1.default)());
    var allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',');
    app.use((0, cors_1.default)({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
};
exports.setupSecurity = setupSecurity;
EOF;
#;
2.;
express_rate_limit_1.default.ts;
cat > src / middlewares / express_rate_limit_1.default.ts << 'EOF';
var express_rate_limit_1 = require("express-rate-limit");
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts, please try again later.' },
    skipSuccessfulRequests: true,
});
EOF;
#;
3.;
response.ts;
mkdir - p;
src / utils;
cat > src / utils / response.ts << 'EOF';
var sendSuccess = function (res, data, statusCode) {
    if (statusCode === void 0) { statusCode = 200; }
    return res.status(statusCode).json({
        success: true,
        data: data,
        meta: {
            timestamp: new Date().toISOString(),
        },
    });
};
exports.sendSuccess = sendSuccess;
var sendError = function (res, code, message, statusCode, details) {
    if (statusCode === void 0) { statusCode = 400; }
    return res.status(statusCode).json({
        success: false,
        error: { code: code, message: message, details: details },
        meta: { timestamp: new Date().toISOString() },
    });
};
exports.sendError = sendError;
