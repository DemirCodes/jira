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
import { Pool } from "pg";
export declare const platformPool: Pool;
export declare const healthCheck: () => Promise<boolean>;
export declare const getPoolMetrics: () => {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
    activeCount: number;
    maxClients: number;
    usagePercent: number;
    timestamp: string;
};
export declare const withConnection: <T>(callback: (client: any) => Promise<T>) => Promise<T>;
//# sourceMappingURL=platformPool.d.ts.map