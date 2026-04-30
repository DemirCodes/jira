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
//# sourceMappingURL=platformPool.d.ts.map