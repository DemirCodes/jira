"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.log = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// ─── GÜVENLİK ─────────────────────────────────────────────────────────────────
const SENSITIVE_FIELDS = new Set([
    'password', 'token', 'authorization', 'cookie', 'secret',
]);
const sanitizeMeta = (meta) => {
    const result = {};
    for (const [k, v] of Object.entries(meta)) {
        result[k] = SENSITIVE_FIELDS.has(k.toLowerCase()) ? '[REDACTED]' : v;
    }
    return result;
};
// ─── FORMAT ───────────────────────────────────────────────────────────────────
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    let line = `${timestamp} [${level}]: ${message}`;
    if (stack)
        line += `\n${stack}`;
    if (Object.keys(meta).length > 0)
        line += ` ${JSON.stringify(meta)}`;
    return line;
}));
// ─── LOGS KLASÖRÜ ─────────────────────────────────────────────────────────────
const logsDir = path_1.default.join(process.cwd(), 'logs');
fs_1.default.mkdirSync(logsDir, { recursive: true });
// ─── ROTASYON AYARLARI ────────────────────────────────────────────────────────
/**
 * Ortak rotasyon seçenekleri:
 *  - datePattern : her gün yeni dosya  (YYYY-MM-DD)
 *  - maxSize     : tek dosya 20 MB'ı geçemez
 *  - maxFiles    : 30 günden eski dosyalar silinir
 *  - zippedArchive: eski dosyalar .gz olarak sıkıştırılır (disk tasarrufu)
 */
const rotateBase = {
    dirname: logsDir,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true,
    format: fileFormat,
};
const makeRotateTransport = (filename, level) => new winston_daily_rotate_file_1.default({
    ...rotateBase,
    filename, // ör. "error-%DATE%.log"
    ...(level ? { level } : {}),
});
// ─── LOGGER ───────────────────────────────────────────────────────────────────
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    transports: [
        makeRotateTransport('error-%DATE%.log', 'error'),
        makeRotateTransport('combined-%DATE%.log'),
    ],
    exceptionHandlers: [
        makeRotateTransport('exceptions-%DATE%.log'),
    ],
    rejectionHandlers: [
        makeRotateTransport('rejections-%DATE%.log'),
    ],
});
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
        level: 'debug',
    }));
}
// Rotasyon olaylarını logla (isteğe bağlı, izleme için faydalı)
exports.logger.transports.forEach(t => {
    if (t instanceof winston_daily_rotate_file_1.default) {
        t.on('rotate', (oldFile, newFile) => {
            exports.logger.info('Log rotated', { oldFile, newFile });
        });
        t.on('new', (newFile) => {
            exports.logger.info('New log file created', { newFile });
        });
    }
});
const makeMethod = (level) => (message, meta) => exports.logger[level](message, meta ? sanitizeMeta(meta) : undefined);
exports.log = {
    info: makeMethod('info'),
    error: makeMethod('error'),
    warn: makeMethod('warn'),
    debug: makeMethod('debug'),
};
// ─── MORGAN STREAM ────────────────────────────────────────────────────────────
exports.stream = {
    write: (message) => { exports.logger.info(message.trim()); },
};
//# sourceMappingURL=logger.js.map