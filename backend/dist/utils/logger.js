"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.log = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Log formatı
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Konsol formatı (daha okunabilir)
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0 && metaKeys[0] !== 'timestamp' && metaKeys[0] !== 'level' && metaKeys[0] !== 'message') {
        log += ` ${JSON.stringify(meta)}`;
    }
    return log;
}));
// logs klasörünü oluştur
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// Logger instance'ı
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join('logs', 'error.log'),
            level: 'error'
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join('logs', 'combined.log')
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({ filename: path_1.default.join('logs', 'exceptions.log') })
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({ filename: path_1.default.join('logs', 'rejections.log') })
    ]
});
// Development ortamında konsola da yaz
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}
// Kısa kullanım için helper'lar (any yok!)
exports.log = {
    info: (message, meta) => exports.logger.info(message, meta),
    error: (message, meta) => exports.logger.error(message, meta),
    warn: (message, meta) => exports.logger.warn(message, meta),
    debug: (message, meta) => exports.logger.debug(message, meta),
};
// Winston stream for morgan (HTTP logging)
exports.stream = {
    write: (message) => {
        exports.logger.info(message.trim());
    },
};
//# sourceMappingURL=logger.js.map