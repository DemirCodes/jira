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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withConnection = exports.getPoolMetrics = exports.healthCheck = exports.platformPool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// ============================================
// 1. ENV VALIDATION
// ============================================
const requiredEnvVars = [
    'PLATFORM_DB_HOST',
    'PLATFORM_DB_NAME',
    'PLATFORM_DB_USER',
    'PLATFORM_DB_PASSWORD'
];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    throw new Error(`❌ Missing env vars: ${missingVars.join(', ')}`);
}
// ============================================
// 2. SSL KONFİGÜRASYONU (Environment variable ile kontrol)
// ============================================
const getSSLConfig = () => {
    const sslMode = process.env.PLATFORM_DB_SSL_MODE || 'disable';
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
exports.platformPool.on('connect', () => {
    console.log('[PlatformDB] ✅ Yeni bağlantı kuruldu');
});
exports.platformPool.on('acquire', () => {
    console.log('[PlatformDB] 📦 Bağlantı havuza alındı');
});
exports.platformPool.on('remove', () => {
    console.log('[PlatformDB] ❌ Bağlantı havuzdan kaldırıldı');
});
exports.platformPool.on('error', (err) => {
    console.error('[PlatformDB] 💥 Pool hatası:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });
});
// ============================================
// 5. GRACEFUL SHUTDOWN
// ============================================
const shutdown = async (signal) => {
    console.log(`[PlatformDB] ⚠️ ${signal} sinyali alındı, bağlantılar kapatılıyor...`);
    try {
        await exports.platformPool.end();
        console.log('[PlatformDB] ✅ Tüm bağlantılar başarıyla kapatıldı');
        process.exit(0);
    }
    catch (error) {
        console.error('[PlatformDB] ❌ Bağlantılar kapatılırken hata:', error);
        process.exit(1);
    }
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
// ============================================
// 6. HEALTH CHECK (Load Balancer için)
// ============================================
const healthCheck = async () => {
    // database bağlantısının sağlıklı olup olmadığını kontrol eder, boşuna istek atarak bağlantı havuzunu zorlamamak için basit bir sorgu çalıştırır
    try {
        const client = await exports.platformPool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('[PlatformDB] 💚 Health check başarılı');
        return true;
    }
    catch (error) {
        console.error('[PlatformDB] ❤️ Health check başarısız:', error);
        return false;
    }
};
exports.healthCheck = healthCheck;
// ============================================
// 7. METRICS (Monitoring için)
// ============================================
const getPoolMetrics = () => {
    const maxClients = parseInt(process.env.PLATFORM_DB_POOL_MAX || '20');
    const activeCount = exports.platformPool.totalCount - exports.platformPool.idleCount;
    const metrics = {
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
const withConnection = async (callback) => {
    const client = await exports.platformPool.connect();
    const startTime = Date.now();
    try {
        const result = await callback(client);
        const duration = Date.now() - startTime;
        if (duration > 5000) {
            console.warn(`[PlatformDB] ⚠️ Yavaş sorgu (${duration}ms)`);
        }
        return result;
    }
    finally {
        client.release();
    }
};
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
    setInterval(async () => {
        const isHealthy = await (0, exports.healthCheck)();
        if (!isHealthy) {
            console.error('[PlatformDB] 🚨 Health check failed!');
        }
    }, 30000);
}
//# sourceMappingURL=platformPool.js.map