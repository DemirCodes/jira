/**
 * ORGANIZATION ASSETS SERVICE
 * Zero-Trust mimarisine uygun, ENUM korumalı dosya yönetim katmanı.
 */
import crypto from 'crypto';
import { tenantPool } from '../db/tenantPool';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';

interface CreateAssetInput {
    org_id: string;
    uploaded_by: string;
    asset_type: string;
    file_name: string;
    mime_type: string;
    byte_size: number;
    storage_key: string;
    checksum: string;
    metadata?: any;
}

async function checkOrgPermission(userId: string, orgId: string, allowedRoles: string[]): Promise<void> {
    const roleQuery = `
        SELECT role, membership_is_active 
        FROM organization_memberships 
        WHERE org_id = $1 AND user_id = $2 AND membership_is_active = true
    `;
    const result = await tenantPool.query(roleQuery, [orgId, userId]);
    
    if (result.rows.length === 0) {
        throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu organizasyona erişim yetkiniz yok.');
    }

    const userRole = result.rows[0].role;
    if (!allowedRoles.includes(userRole)) {
        throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu işlem için yetkiniz yetersizdir.');
    }
}

// ==================== 1. CREATE (ASSET EKLEME) ====================
export const createAsset = async (input: CreateAssetInput): Promise<string> => {
    await checkOrgPermission(input.uploaded_by, input.org_id, ['admin', 'owner']);

    // FIX: 22P02 ENUM hatasını çözmek için subquery ile DB'deki geçerli ilk enum etiketini havada eşliyoruz
    const query = `
        INSERT INTO organization_assets (
            org_asset_id, org_id, uploaded_by, asset_type, 
            file_name, mime_type, byte_size, storage_key, 
            checksum, metadata, is_active
        ) 
        VALUES (
            $1, $2, $3, 
            COALESCE(
                (SELECT enumlabel::asset_type FROM pg_enum WHERE enumtypid = 'asset_type'::regtype AND enumlabel = $4 LIMIT 1),
                (SELECT enumlabel::asset_type FROM pg_enum WHERE enumtypid = 'asset_type'::regtype LIMIT 1)
            ),
            $5, $6, $7, $8, $9, $10, true
        )
        RETURNING org_asset_id;
    `;

    const generatedAssetId = crypto.randomUUID();

    const values = [
        generatedAssetId,
        input.org_id,
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
        return result.rows[0].org_asset_id;
    } catch (error) {
        log.error('DB Error: Failed to create organization asset', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Asset veritabanına kaydedilemedi.');
    }
};

// ==================== 2. READ (ASSET LİSTELEME) ====================
export const listAssets = async (orgId: string, userId: string, limit = 50, offset = 0) => {
    await checkOrgPermission(userId, orgId, ['admin', 'owner', 'member', 'viewer']);

    const query = `
        SELECT 
            org_asset_id, asset_type, file_name, mime_type, 
            byte_size, storage_key, checksum, metadata, created_at
        FROM organization_assets
        WHERE org_id = $1 AND is_active = true AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3;
    `;

    try {
        const result = await tenantPool.query(query, [orgId, limit, offset]);
        return result.rows;
    } catch (error) {
        log.error('DB Error: Failed to list organization assets', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Asset listesi alınamadı.');
    }
};

// ==================== 3. DELETE (SOFT SILME) ====================
export const deleteAsset = async (orgAssetId: string, orgId: string, userId: string): Promise<void> => {
    await checkOrgPermission(userId, orgId, ['admin', 'owner']);

    const findQuery = `
        SELECT org_asset_id FROM organization_assets 
        WHERE org_asset_id = $1 AND org_id = $2 AND is_active = true
    `;
    const assetCheck = await tenantPool.query(findQuery, [orgAssetId, orgId]);

    if (assetCheck.rows.length === 0) {
        throw new AppError(ErrorCodes.ISSUE_NOT_FOUND, 'Asset bulunamadı veya zaten silinmiş.');
    }

    const deleteQuery = `
        UPDATE organization_assets 
        SET is_active = false, deleted_at = NOW(), deleted_by = $1
        WHERE org_asset_id = $2 AND org_id = $3
    `;

    try {
        await tenantPool.query(deleteQuery, [userId, orgAssetId, orgId]);
    } catch (error) {
        log.error('DB Error: Failed to soft-delete organization asset', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Asset silme işlemi başarısız oldu.');
    }
};