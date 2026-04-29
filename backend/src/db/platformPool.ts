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
import dotenv from 'dotenv';

dotenv.config();

export const platformPool = new Pool({
    host: process.env.PLATFORM_DB_HOST,
    port: parseInt( process.env.PLATFORM_DB_PORT || '5432' ),
    database: process.env.PLATFORM_DB_NAME,
    user: process.env.PLATFORM_DB_USER,
    password: process.env.PLATFORM_DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});


