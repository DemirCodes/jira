import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Log meta tipi
type LogMeta = Record<string, unknown>;

// Log formatı
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Konsol formatı (daha okunabilir)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf((info: winston.Logform.TransformableInfo) => {
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
    })
);

// logs klasörünü oluştur
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Logger instance'ı
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({ 
            filename: path.join('logs', 'error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join('logs', 'combined.log') 
        }),
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: path.join('logs', 'exceptions.log') })
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: path.join('logs', 'rejections.log') })
    ]
});

// Development ortamında konsola da yaz
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

// Kısa kullanım için helper'lar (any yok!)
export const log = {
    info: (message: string, meta?: LogMeta): winston.Logger => logger.info(message, meta),
    error: (message: string, meta?: LogMeta): winston.Logger => logger.error(message, meta),
    warn: (message: string, meta?: LogMeta): winston.Logger => logger.warn(message, meta),
    debug: (message: string, meta?: LogMeta): winston.Logger => logger.debug(message, meta),
};

// Winston stream for morgan (HTTP logging)
export const stream = {
    write: (message: string): void => {
        logger.info(message.trim());
    },
};