"use strict";
/**
 * TENANT DATABASE CONNECTION POOL
 *
 * Normal kullanıcıların verilerinin tutulduğu 'jira' database'ine bağlantı havuzu oluşturur.
 *
 * Tenant database içindeki veriler:
 * - organizations, sites, projects, issues, users
 * - memberships, assets, notifications
 * - RLS (Row Level Security) aktif
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withConnection = exports.getPoolMetrics = exports.healthCheck = exports.tenantPool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
// ============================================
// 1. ENV VALIDATION
// ============================================
const requiredEnvVars = [
    'TENANT_DB_HOST',
    'TENANT_DB_NAME',
    'TENANT_DB_USER',
    'TENANT_DB_PASSWORD'
];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    throw new Error(`❌ Missing env vars: ${missingVars.join(', ')}`);
}
// ============================================
// 2. SSL KONFİGÜRASYONU
// ============================================
const getSSLConfig = () => {
    const sslMode = process.env.TENANT_DB_SSL_MODE || 'disable';
    if (sslMode === 'disable')
        return false;
    if (sslMode === 'require')
        return { rejectUnauthorized: false };
    if (sslMode === 'verify-full') {
        return {
            rejectUnauthorized: true,
            ca: process.env.TENANT_DB_CA_CERT,
            cert: process.env.TENANT_DB_CERT,
            key: process.env.TENANT_DB_KEY,
        };
    }
    return false;
};
// ============================================
// 3. POOL KONFİGÜRASYONU
// ============================================
exports.tenantPool = new pg_1.Pool({
    host: process.env.TENANT_DB_HOST,
    port: parseInt(process.env.TENANT_DB_PORT || '5434'),
    database: process.env.TENANT_DB_NAME,
    user: process.env.TENANT_DB_USER,
    password: process.env.TENANT_DB_PASSWORD,
    max: parseInt(process.env.TENANT_DB_POOL_MAX || '30'),
    min: parseInt(process.env.TENANT_DB_POOL_MIN || '5'),
    idleTimeoutMillis: parseInt(process.env.TENANT_DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.TENANT_DB_CONNECTION_TIMEOUT || '10000'),
    statement_timeout: parseInt(process.env.TENANT_DB_STATEMENT_TIMEOUT || '30000'),
    ssl: getSSLConfig(),
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    application_name: 'tenant_api',
});
// ============================================
// 4. EVENT LISTENER'LAR
// ============================================
exports.tenantPool.on('connect', () => {
    console.log('[TenantDB] ✅ Yeni bağlantı kuruldu');
});
exports.tenantPool.on('acquire', () => {
    console.log('[TenantDB] 📦 Bağlantı havuza alındı');
});
exports.tenantPool.on('remove', () => {
    console.log('[TenantDB] ❌ Bağlantı havuzdan kaldırıldı');
});
exports.tenantPool.on('error', (err) => {
    console.error('[TenantDB] 💥 Pool hatası:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });
});
// ============================================
// 5. GRACEFUL SHUTDOWN
// ============================================
const shutdown = async (signal) => {
    console.log(`[TenantDB] ⚠️ ${signal} sinyali alındı, bağlantılar kapatılıyor...`);
    try {
        await exports.tenantPool.end();
        console.log('[TenantDB] ✅ Tüm bağlantılar başarıyla kapatıldı');
        process.exit(0);
    }
    catch (error) {
        console.error('[TenantDB] ❌ Bağlantılar kapatılırken hata:', error);
        process.exit(1);
    }
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
// ============================================
// 6. HEALTH CHECK
// ============================================
const healthCheck = async () => {
    try {
        const client = await exports.tenantPool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('[TenantDB] 💚 Health check başarılı');
        return true;
    }
    catch (error) {
        console.error('[TenantDB] 💔 Health check başarısız:', error);
        return false;
    }
};
exports.healthCheck = healthCheck;
// ============================================
// 7. METRICS
// ============================================
const getPoolMetrics = () => {
    const maxClients = parseInt(process.env.TENANT_DB_POOL_MAX || '30');
    const activeCount = exports.tenantPool.totalCount - exports.tenantPool.idleCount;
    const metrics = {
        totalCount: exports.tenantPool.totalCount,
        idleCount: exports.tenantPool.idleCount,
        waitingCount: exports.tenantPool.waitingCount,
        activeCount: activeCount,
        maxClients: maxClients,
        usagePercent: (activeCount / maxClients) * 100,
        timestamp: new Date().toISOString()
    };
    console.log('[TenantDB] 📊 Pool metrics:', metrics);
    return metrics;
};
exports.getPoolMetrics = getPoolMetrics;
// ============================================
// 8. CONNECTION WRAPPER (Connection leak önleme)
// ============================================
const withConnection = async (callback) => {
    const client = await exports.tenantPool.connect();
    const startTime = Date.now();
    try {
        const result = await callback(client);
        const duration = Date.now() - startTime;
        if (duration > 5000) {
            console.warn(`[TenantDB] ⚠️ Yavaş sorgu (${duration}ms)`);
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
console.log('✅ Tenant DB connection pool initialized:', {
    host: process.env.TENANT_DB_HOST,
    database: process.env.TENANT_DB_NAME,
    port: process.env.TENANT_DB_PORT || '5434',
    maxConnections: process.env.TENANT_DB_POOL_MAX || '30',
    minConnections: process.env.TENANT_DB_POOL_MIN || '5',
    ssl: process.env.TENANT_DB_SSL_MODE || 'disable',
    env: process.env.NODE_ENV || 'development'
});
// ============================================
// 10. OTOMATIK HEALTH CHECK (Production)
// ============================================
if (process.env.NODE_ENV === 'production') {
    setInterval(async () => {
        const isHealthy = await (0, exports.healthCheck)();
        if (!isHealthy) {
            console.error('[TenantDB] 🚨 Health check failed!');
        }
    }, 30000);
}
//# sourceMappingURL=tenantPool.js.map