"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.log = exports.logger = void 0;
var winston_1 = require("winston");
var path_1 = require("path");
var fs_1 = require("fs");
// Log formatı
var logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Konsol formatı (daha okunabilir)
var consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf(function (info) {
    var timestamp = info.timestamp, level = info.level, message = info.message, stack = info.stack, meta = __rest(info, ["timestamp", "level", "message", "stack"]);
    var log = "".concat(timestamp, " [").concat(level, "]: ").concat(message);
    if (stack) {
        log += "\n".concat(stack);
    }
    var metaKeys = Object.keys(meta);
    if (metaKeys.length > 0 && metaKeys[0] !== 'timestamp' && metaKeys[0] !== 'level' && metaKeys[0] !== 'message') {
        log += " ".concat(JSON.stringify(meta));
    }
    return log;
}));
// logs klasörünü oluştur
var logsDir = path_1.default.join(process.cwd(), 'logs');
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
    info: function (message, meta) { return exports.logger.info(message, meta); },
    error: function (message, meta) { return exports.logger.error(message, meta); },
    warn: function (message, meta) { return exports.logger.warn(message, meta); },
    debug: function (message, meta) { return exports.logger.debug(message, meta); },
};
// Winston stream for morgan (HTTP logging)
exports.stream = {
    write: function (message) {
        exports.logger.info(message.trim());
    },
};
