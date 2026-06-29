import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// ─── TİP TANIMLARI ────────────────────────────────────────────────────────────

type LogMeta = Record<string, unknown>;

// ─── GÜVENLİK ─────────────────────────────────────────────────────────────────

const SENSITIVE_FIELDS = new Set([
    'password', 'token', 'authorization', 'cookie', 'secret',
]);

const sanitizeMeta = (meta: LogMeta): LogMeta => {
    const result: LogMeta = {};
    for (const [k, v] of Object.entries(meta)) {
        result[k] = SENSITIVE_FIELDS.has(k.toLowerCase()) ? '[REDACTED]' : v;
    }
    return result;
};

// ─── FORMAT ───────────────────────────────────────────────────────────────────

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf((info: winston.Logform.TransformableInfo) => {
        const { timestamp, level, message, stack, ...meta } = info;
        let line = `${timestamp} [${level}]: ${message}`;
        if (stack) line += `\n${stack}`;
        if (Object.keys(meta).length > 0) line += ` ${JSON.stringify(meta)}`;
        return line;
    }),
);

// ─── LOGS KLASÖRÜ ─────────────────────────────────────────────────────────────

const logsDir = path.join(process.cwd(), 'logs');
fs.mkdirSync(logsDir, { recursive: true });

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

const makeRotateTransport = (
    filename: string,
    level?: string,
): DailyRotateFile =>
    new DailyRotateFile({
        ...rotateBase,
        filename,          // ör. "error-%DATE%.log"
        ...(level ? { level } : {}),
    });

// ─── LOGGER ───────────────────────────────────────────────────────────────────

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    transports: [
        makeRotateTransport('error-%DATE%.log',    'error'),
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
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug',
    }));
}

// Rotasyon olaylarını logla (isteğe bağlı, izleme için faydalı)
logger.transports.forEach(t => {
    if (t instanceof DailyRotateFile) {
        t.on('rotate', (oldFile: string, newFile: string) => {
            logger.info('Log rotated', { oldFile, newFile });
        });
        t.on('new', (newFile: string) => {
            logger.info('New log file created', { newFile });
        });
    }
});

// ─── KISA KULLANIM ────────────────────────────────────────────────────────────

type LogMethod = (message: string, meta?: LogMeta) => void;

const makeMethod = (level: 'info' | 'error' | 'warn' | 'debug'): LogMethod =>
    (message, meta) => logger[level](message, meta ? sanitizeMeta(meta) : undefined);

export const log = {
    info:  makeMethod('info'),
    error: makeMethod('error'),
    warn:  makeMethod('warn'),
    debug: makeMethod('debug'),
};

// ─── MORGAN STREAM ────────────────────────────────────────────────────────────

export const stream = {
    write: (message: string): void => {logger.info(message.trim())},
};