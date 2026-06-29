/**
 * SITE ASSETS SERVICE
 * Keskin Yetki Sınırlamalı, Zero-Trust Site Yönetim Katmanı.
 * Kural: Sadece Site Admin yazar/siler. Diğer herkes sadece okur.
 */
import crypto from 'crypto';
import { tenantPool } from '../db/tenantPool';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';

interface CreateSiteAssetInput {
    site_id: string;
    uploaded_by: string;
    asset_type: string;
    file_name: string;
    mime_type: string;
    byte_size: number;
    storage_key: string;
    checksum: string;
    metadata?: any;
}

/**
 * Sadece Görme Yetkisi Kontrolü (Read-Only)
 * Org üyesi VEYA Site üyesi olan herkes görebilir.
 */
async function checkSiteReadPermission(userId: string, siteId: string): Promise<void> {
    const orgCheckQuery = `
        SELECT om.role 
        FROM sites s
        JOIN organization_memberships om ON s.org_id = om.org_id
        WHERE s.site_id = $1 AND om.user_id = $2 AND om.membership_is_active = true
    `;
    const orgResult = await tenantPool.query(orgCheckQuery, [siteId, userId]);
    if (orgResult.rows.length > 0) return;

    const siteCheckQuery = `
        SELECT role FROM site_memberships 
        WHERE site_id = $1 AND user_id = $2 AND membership_is_active = true
    `;
    const siteResult = await tenantPool.query(siteCheckQuery, [siteId, userId]);
    if (siteResult.rows.length === 0) {
        throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu siteye erişim yetkiniz bulunmamaktadır.');
    }
}

/**
 * Yazma/Silme Yetkisi Kontrolü
 * Sadece Site Admin yapabilir. Org rolü ne olursa olsun geçmez.
 */
async function checkSiteWritePermission(userId: string, siteId: string): Promise<void> {
    const query = `
        SELECT role FROM site_memberships 
        WHERE site_id = $1 AND user_id = $2 AND role = 'admin' AND membership_is_active = true
    `;
    const result = await tenantPool.query(query, [siteId, userId]);
    if (result.rows.length === 0) {
        throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu işlem için Site Admin yetkisi gereklidir.');
    }
}

// ==================== 1. CREATE ====================
export const createSiteAsset = async (input: CreateSiteAssetInput): Promise<string> => {
    await checkSiteWritePermission(input.uploaded_by, input.site_id);

    const query = `
        INSERT INTO site_assets (
            site_asset_id, site_id, uploaded_by, asset_type, 
            file_name, mime_type, byte_size, storage_key, 
            checksum, metadata, is_active
        ) 
        VALUES ($1, $2, $3, $4::text::asset_type, $5, $6, $7, $8, $9, $10, true)
        RETURNING site_asset_id;
    `;

    const generatedAssetId = crypto.randomUUID();
    const values = [
        generatedAssetId,
        input.site_id,
        input.uploaded_by,
        input.asset_type,
        input.file_name,
        input.mime_type,
        input.byte_size,
        input.storage_key,
        input.checksum,
        input.metadata ? JSON.stringify(input.metadata) : null
    ];

    try {
        const result = await tenantPool.query(query, values);
        return result.rows[0].site_asset_id;
    } catch (error) {
        log.error('DB Error: Failed to create site asset', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Site varlığı veritabanına kaydedilemedi.');
    }
};

// ==================== 2. READ ====================
export const listSiteAssets = async (siteId: string, userId: string, limit = 50, offset = 0) => {
    await checkSiteReadPermission(userId, siteId);

    const query = `
        SELECT 
            site_asset_id, asset_type, file_name, mime_type, 
            byte_size, storage_key, checksum, metadata, created_at
        FROM site_assets
        WHERE site_id = $1 AND is_active = true AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3;
    `;

    try {
        const result = await tenantPool.query(query, [siteId, limit, offset]);
        return result.rows;
    } catch (error) {
        log.error('DB Error: Failed to list site assets', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Site asset listesi alınamadı.');
    }
};

// ==================== 3. DELETE (SOFT) ====================
export const deleteSiteAsset = async (siteAssetId: string, siteId: string, userId: string): Promise<void> => {
    await checkSiteWritePermission(userId, siteId);

    const findQuery = `
        SELECT site_asset_id FROM site_assets 
        WHERE site_asset_id = $1 AND site_id = $2 AND is_active = true
    `;
    const assetCheck = await tenantPool.query(findQuery, [siteAssetId, siteId]);

    if (assetCheck.rows.length === 0) {
        throw new AppError(ErrorCodes.ISSUE_NOT_FOUND, 'Asset bulunamadı veya zaten silinmiş.');
    }

    const deleteQuery = `
        UPDATE site_assets 
        SET is_active = false, deleted_at = NOW(), deleted_by = $1
        WHERE site_asset_id = $2 AND site_id = $3
    `;

    try {
        await tenantPool.query(deleteQuery, [userId, siteAssetId, siteId]);
    } catch (error) {
        log.error('DB Error: Failed to soft-delete site asset', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Site asset silme işlemi başarısız oldu.');
    }
};