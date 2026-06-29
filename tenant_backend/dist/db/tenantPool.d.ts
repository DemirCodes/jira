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
import { Pool } from "pg";
export declare const tenantPool: Pool;
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
//# sourceMappingURL=tenantPool.d.ts.map