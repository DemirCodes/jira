"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSecurity = void 0;
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const setupSecurity = (app) => {
    // helmet security headers ekler
    app.use((0, helmet_1.default)());
    // cors - sadece izin verilen domainlerden istek kabul et 
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5137').split(',');
    app.use((0, cors_1.default)({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
};
exports.setupSecurity = setupSecurity;
//# sourceMappingURL=security.js.map