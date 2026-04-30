"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantPool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
//.env dosyasını yükle
dotenv_1.default.config();
/**
 * PostgreSQL bağlantı havuzu (Pool) oluşturuluyor.
 * Pool, aynı anda birden fazla bağlantıyı yönetir.
 */
exports.tenantPool = new pg_1.Pool({
    // Veri tabanı sunucusunun adresi 
    host: process.env.TENANT_DB_HOST,
    // Baglantı Portu 
    port: parseInt(process.env.TENANT_DB_PORT || '5432'),
    // DATABASE 
    database: process.env.TENANT_DB_NAME,
    // user
    user: process.env.TENANT_DB_USER,
    // pass
    password: process.env.TENANT_DB_PASSWORD,
    // max Baglantı sayısı
    max: 20,
    // Baglantı bossa ne kadar surede kapanacagı
    idleTimeoutMillis: 30000,
    // Yen baglantı kurulurken ne kadar beklenecegı
    connectionTimeoutMillis: 2000
});
//# sourceMappingURL=tenantPool.js.map