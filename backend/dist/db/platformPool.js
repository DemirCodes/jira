"use strict";
/**
 * PLATFORM DATABASE CONNECTION POOL
 *
 * Bu dosya, platform yöneticilerinin verilerinin tutulduğu 'jira_platform_db'
 * database'ine bağlantı havuzu oluşturur.
 *
 * Platform database içindeki veriler:
 * - platform_users (super_admin, support_admin, billing_admin)
 * - user_sessions (oturum yönetimi)
 * - api_keys (API anahtarları)
 * - login_attempts (başarısız giriş denemeleri)
 *
 * Bu database, tenant database'den tamamen izoledir.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withConnection = exports.getPoolMetrics = exports.healthCheck = exports.platformPool = void 0;
var pg_1 = require("pg");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
// ============================================
// 1. ENV VALIDATION
// ============================================
var requiredEnvVars = [
    'PLATFORM_DB_HOST',
    'PLATFORM_DB_NAME',
    'PLATFORM_DB_USER',
    'PLATFORM_DB_PASSWORD'
];
var missingVars = requiredEnvVars.filter(function (varName) { return !process.env[varName]; });
if (missingVars.length > 0) {
    throw new Error("\u274C Missing env vars: ".concat(missingVars.join(', ')));
}
// ============================================
// 2. SSL KONFİGÜRASYONU (Environment variable ile kontrol)
// ============================================
var getSSLConfig = function () {
    var sslMode = process.env.PLATFORM_DB_SSL_MODE || 'disable';
    if (sslMode === 'disable') {
        return false;
    }
    if (sslMode === 'require') {
        return { rejectUnauthorized: false };
    }
    if (sslMode === 'verify-full') {
        return {
            rejectUnauthorized: true,
            ca: process.env.PLATFORM_DB_CA_CERT,
            cert: process.env.PLATFORM_DB_CERT,
            key: process.env.PLATFORM_DB_KEY,
        };
    }
    return false;
};
// ============================================
// 3. POOL KONFİGÜRASYONU
// ============================================
exports.platformPool = new pg_1.Pool({
    host: process.env.PLATFORM_DB_HOST,
    port: parseInt(process.env.PLATFORM_DB_PORT || '5432'),
    database: process.env.PLATFORM_DB_NAME,
    user: process.env.PLATFORM_DB_USER,
    password: process.env.PLATFORM_DB_PASSWORD,
    // Havuz boyutlandırma
    max: parseInt(process.env.PLATFORM_DB_POOL_MAX || '20'),
    min: parseInt(process.env.PLATFORM_DB_POOL_MIN || '2'),
    // Timeout ayarları
    idleTimeoutMillis: parseInt(process.env.PLATFORM_DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.PLATFORM_DB_CONNECTION_TIMEOUT || '10000'),
    statement_timeout: parseInt(process.env.PLATFORM_DB_STATEMENT_TIMEOUT || '30000'),
    // SSL (dinamik)
    ssl: getSSLConfig(),
    // Keep alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    // Monitoring için uygulama adı
    application_name: 'platform_api',
});
// ============================================
// 4. EVENT LISTENER'LAR (Monitoring & Debugging)
// ============================================
exports.platformPool.on('connect', function () {
    console.log('[PlatformDB] ✅ Yeni bağlantı kuruldu');
});
exports.platformPool.on('acquire', function () {
    console.log('[PlatformDB] 📦 Bağlantı havuza alındı');
});
exports.platformPool.on('remove', function () {
    console.log('[PlatformDB] ❌ Bağlantı havuzdan kaldırıldı');
});
exports.platformPool.on('error', function (err) {
    console.error('[PlatformDB] 💥 Pool hatası:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });
});
// ============================================
// 5. GRACEFUL SHUTDOWN
// ============================================
var shutdown = function (signal) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("[PlatformDB] \u26A0\uFE0F ".concat(signal, " sinyali al\u0131nd\u0131, ba\u011Flant\u0131lar kapat\u0131l\u0131yor..."));
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, exports.platformPool.end()];
            case 2:
                _a.sent();
                console.log('[PlatformDB] ✅ Tüm bağlantılar başarıyla kapatıldı');
                process.exit(0);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error('[PlatformDB] ❌ Bağlantılar kapatılırken hata:', error_1);
                process.exit(1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
process.once('SIGTERM', function () { return shutdown('SIGTERM'); });
process.once('SIGINT', function () { return shutdown('SIGINT'); });
// ============================================
// 6. HEALTH CHECK (Load Balancer için)
// ============================================
var healthCheck = function () { return __awaiter(void 0, void 0, void 0, function () {
    var client, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, exports.platformPool.connect()];
            case 1:
                client = _a.sent();
                return [4 /*yield*/, client.query('SELECT 1')];
            case 2:
                _a.sent();
                client.release();
                console.log('[PlatformDB] 💚 Health check başarılı');
                return [2 /*return*/, true];
            case 3:
                error_2 = _a.sent();
                console.error('[PlatformDB] ❤️ Health check başarısız:', error_2);
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.healthCheck = healthCheck;
// ============================================
// 7. METRICS (Monitoring için)
// ============================================
var getPoolMetrics = function () {
    var maxClients = parseInt(process.env.PLATFORM_DB_POOL_MAX || '20');
    var activeCount = exports.platformPool.totalCount - exports.platformPool.idleCount;
    var metrics = {
        totalCount: exports.platformPool.totalCount,
        idleCount: exports.platformPool.idleCount,
        waitingCount: exports.platformPool.waitingCount,
        activeCount: activeCount,
        maxClients: maxClients,
        usagePercent: (activeCount / maxClients) * 100,
        timestamp: new Date().toISOString()
    };
    console.log('[PlatformDB] 📊 Pool metrics:', metrics);
    return metrics;
};
exports.getPoolMetrics = getPoolMetrics;
// ============================================
// 8. CONNECTION WRAPPER (Connection leak önleme)
// ============================================
var withConnection = function (callback) { return __awaiter(void 0, void 0, void 0, function () {
    var client, startTime, result, duration;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.platformPool.connect()];
            case 1:
                client = _a.sent();
                startTime = Date.now();
                _a.label = 2;
            case 2:
                _a.trys.push([2, , 4, 5]);
                return [4 /*yield*/, callback(client)];
            case 3:
                result = _a.sent();
                duration = Date.now() - startTime;
                if (duration > 5000) {
                    console.warn("[PlatformDB] \u26A0\uFE0F Yava\u015F sorgu (".concat(duration, "ms)"));
                }
                return [2 /*return*/, result];
            case 4:
                client.release();
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.withConnection = withConnection;
// ============================================
// 9. INITIALIZATION LOG
// ============================================
console.log('✅ Platform DB connection pool initialized:', {
    host: process.env.PLATFORM_DB_HOST,
    database: process.env.PLATFORM_DB_NAME,
    port: process.env.PLATFORM_DB_PORT || '5432',
    maxConnections: process.env.PLATFORM_DB_POOL_MAX || '20',
    minConnections: process.env.PLATFORM_DB_POOL_MIN || '2',
    ssl: process.env.PLATFORM_DB_SSL_MODE || 'disable',
    env: process.env.NODE_ENV || 'development'
});
// ============================================
// 10. OTOMATIK HEALTH CHECK (Opsiyonel - Production'da aktif)
// ============================================
if (process.env.NODE_ENV === 'production') {
    setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
        var isHealthy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, exports.healthCheck)()];
                case 1:
                    isHealthy = _a.sent();
                    if (!isHealthy) {
                        console.error('[PlatformDB] 🚨 Health check failed!');
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
}
