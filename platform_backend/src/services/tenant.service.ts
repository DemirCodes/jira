import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { tenantPool } from '../db/tenantPool';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';

export interface CreateTenantParams {
    companyName: string;
    domain: string;
    adminEmail: string;
    adminPasswordPlain: string;
    platformUserId: string; // İşlemi yapan Platform admininin ID'si (Audit Log için)
}

export const provisionNewTenant = async (params: CreateTenantParams) => {
    const { companyName, domain, adminEmail, adminPasswordPlain, platformUserId } = params;
    
    const client = await tenantPool.connect();
    
    try {
        // İşlemi Transaction içine alıyoruz (Ya hep ya hiç)
        await client.query('BEGIN');

        // 1. Audit ve RLS Context'i Ayarla (Platform Yöneticisi kimliğini bildir)
        await client.query('SELECT set_config($1, $2, true)', ['app.current_platform_user_id', platformUserId]);
        const orgCheckId = crypto.randomUUID();
        // 2. Tenant (Organizasyon) Oluşturma
        // (Not: Tablo isimleri senin tenant_db şemana göre organizations veya tenants olabilir)
        const orgResult = await client.query(`
            INSERT INTO organizations (org_name, slug, org_status, org_check_id, created_at)
            VALUES ($1, $2, 'active', $3, NOW())
            RETURNING org_id
        `, [companyName, domain, orgCheckId]);

        const orgId = orgResult.rows[0].org_id;

        // 3. Org Admin Şifresini Hashle
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(adminPasswordPlain, saltRounds);

        // 4. Şirketin İlk Yöneticisini (Org Admin) Oluştur
        const userResult = await client.query(`
            INSERT INTO users (org_id, email, password_hash, role, is_active)
            VALUES ($1, $2, $3, 'org_admin', true)
            RETURNING user_id, email
        `, [orgId, adminEmail, passwordHash]);

        // 5. Her şey başarılıysa onayla
        await client.query('COMMIT');

        log.info('New tenant provisioned successfully', { 
            orgId, 
            domain, 
            provisionedBy: platformUserId 
        });

        // İlerleyen süreçte buraya bir BullMQ job'ı fırlatıp:
        // "Sisteminiz hazırlandı" e-postasını asenkron olarak yollatabiliriz.

        return {
            orgId,
            domain,
            adminEmail: userResult.rows[0].email
        };

    } catch (error: any) {
        // Hata durumunda veritabanını eski haline çevir
        await client.query('ROLLBACK');
        
        log.error('Tenant provisioning failed, rolled back.', { error: error.message, domain });

        // Eğer domain veya email zaten varsa (Unique Constraint hatası - Postgres kodu 23505)
        if (error.code === '23505') {
            throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Domain or admin email already exists in the system.');
        }

        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to provision new tenant.');
    } finally {
        // Client'ı ne olursa olsun havuza geri bırak (Connection Leak önleme)
        client.release();
    }
};