/**
 * PROJECT ASSETS SERVICE
 * Keskin Yetki Sınırlamalı, Zero-Trust Project Yönetim Katmanı.
 * Kural: Sadece Project Admin ve Contributor yazar/siler. Diğer herkes okur.
 */
import crypto from 'crypto';
import { tenantPool } from '../db/tenantPool';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';

interface CreateProjectAssetInput {
    project_id: string;
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
 * Proje üyesi olan herkes (admin, contributor, reviewer, viewer) görebilir.
 */
async function checkProjectReadPermission(userId: string, projectId: string): Promise<void> {
    const projectCheckQuery = `
        SELECT role FROM project_memberships 
        WHERE project_id = $1 AND user_id = $2 AND membership_is_active = true
    `;
    const result = await tenantPool.query(projectCheckQuery, [projectId, userId]);
    
    // TODO: İstersen buraya Site/Org üst yetki kontrolü de ekleyebilirsin (site_admin de görsün vb.)
    if (result.rows.length === 0) {
        throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu projeye erişim yetkiniz bulunmamaktadır.');
    }
}

/**
 * Yazma/Silme Yetkisi Kontrolü
 * Sadece Project Admin ve Contributor yapabilir.
 */
async function checkProjectWritePermission(userId: string, projectId: string): Promise<void> {
    const query = `
        SELECT role FROM project_memberships 
        WHERE project_id = $1 AND user_id = $2 
        AND role IN ('project_admin', 'contributor') 
        AND membership_is_active = true
    `;
    const result = await tenantPool.query(query, [projectId, userId]);
    if (result.rows.length === 0) {
        throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu işlem için Project Admin veya Contributor yetkisi gereklidir.');
    }
}

// ==================== 1. CREATE ====================
export const createProjectAsset = async (input: CreateProjectAssetInput): Promise<string> => {
    await checkProjectWritePermission(input.uploaded_by, input.project_id);

    const query = `
        INSERT INTO project_assets (
            project_asset_id, project_id, uploaded_by, asset_type, 
            file_name, mime_type, byte_size, storage_key, 
            checksum, metadata, is_active
        ) 
        VALUES ($1, $2, $3, $4::text::asset_type, $5, $6, $7, $8, $9, $10, true)
        RETURNING project_asset_id;
    `;

    const generatedAssetId = crypto.randomUUID();
    const values = [
        generatedAssetId,
        input.project_id,
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
        return result.rows[0].project_asset_id;
    } catch (error) {
        log.error('DB Error: Failed to create project asset', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Proje varlığı veritabanına kaydedilemedi.');
    }
};

// ==================== 2. READ ====================
export const listProjectAssets = async (projectId: string, userId: string, limit = 50, offset = 0) => {
    await checkProjectReadPermission(userId, projectId);

    const query = `
        SELECT 
            project_asset_id, asset_type, file_name, mime_type, 
            byte_size, storage_key, checksum, metadata, created_at
        FROM project_assets
        WHERE project_id = $1 AND is_active = true AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3;
    `;

    try {
        const result = await tenantPool.query(query, [projectId, limit, offset]);
        return result.rows;
    } catch (error) {
        log.error('DB Error: Failed to list project assets', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Proje asset listesi alınamadı.');
    }
};

// ==================== 3. DELETE (SOFT) ====================
export const deleteProjectAsset = async (projectAssetId: string, projectId: string, userId: string): Promise<void> => {
    await checkProjectWritePermission(userId, projectId);

    const findQuery = `
        SELECT project_asset_id FROM project_assets 
        WHERE project_asset_id = $1 AND project_id = $2 AND is_active = true
    `;
    const assetCheck = await tenantPool.query(findQuery, [projectAssetId, projectId]);

    if (assetCheck.rows.length === 0) {
        throw new AppError(ErrorCodes.ISSUE_NOT_FOUND, 'Asset bulunamadı veya zaten silinmiş.');
    }

    const deleteQuery = `
        UPDATE project_assets 
        SET is_active = false, deleted_at = NOW(), deleted_by = $1
        WHERE project_asset_id = $2 AND project_id = $3
    `;

    try {
        await tenantPool.query(deleteQuery, [userId, projectAssetId, projectId]);
    } catch (error) {
        log.error('DB Error: Failed to soft-delete project asset', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Proje asset silme işlemi başarısız oldu.');
    }
};