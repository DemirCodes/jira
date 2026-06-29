import { Pool, PoolConfig } from 'pg';
import { log } from '../utils/logger';

// Platform Backend'in Tenant DB'ye bağlanması için gereken ayarlar
const poolConfig: PoolConfig = {
    host: process.env.TENANT_DB_HOST || 'localhost',
    port: parseInt(process.env.TENANT_DB_PORT || '5434', 10),
    database: process.env.TENANT_DB_NAME || 'jira',
    user: process.env.TENANT_DB_USER || 'jira',
    password: process.env.TENANT_DB_PASSWORD || 'jira',
    max: parseInt(process.env.TENANT_DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};

export const tenantPool = new Pool(poolConfig);

tenantPool.on('connect', () => {
    log.info('🔗 Platform Backend connected to Tenant DB successfully.');
});

tenantPool.on('error', (err) => {
    log.error('❌ Unexpected error on idle client in Tenant Pool', { error: err.message });
    process.exit(-1);
});

/**
 * Destek Yöneticisi (Support Admin) bir Tenant verisine erişmek istediğinde
 * RLS context'ini ayarlayarak izole bir bağlantı (Client) verir.
 */
export const getTenantClientWithContext = async (platformUserId: string, tenantId: string) => {
    const client = await tenantPool.connect();
    try {
        // RLS (Row Level Security) için context set ediyoruz.
        // Böylece Platform yetkilisi sadece ilgili tenant'ın verilerini görebilir.
        await client.query('SELECT set_config($1, $2, true)', ['app.current_platform_user_id', platformUserId]);
        await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', tenantId]);
        return client;
    } catch (error) {
        client.release();
        throw error;
    }
};