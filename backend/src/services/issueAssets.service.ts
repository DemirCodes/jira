/**
 * ISSUE ASSETS SERVICE
 * Issue bazlı varlık yönetimi. Yetkilendirme: Contributor ve Reviewer yazar/siler, Watcher sadece okur.
 * Zero-Trust: Her işlem öncesi issue membership kontrolü yapılır.
 */
import crypto from 'crypto';
import { tenantPool } from '../db/tenantPool';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';

interface CreateIssueAssetInput {
    issue_id: string;
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
 * Issue Görme Yetkisi Kontrolü (Read-Only)
 * Watcher, reviewer, contributor herkes görebilir.
 */
async function checkIssueReadPermission(userId: string, issueId: string): Promise<void> {
    const query = `
        SELECT role FROM issue_memberships 
        WHERE issue_id = $1 AND user_id = $2 AND membership_is_active = true
    `;
    const result = await tenantPool.query(query, [issueId, userId]);

    if (!result || !result.rows || result.rows.length === 0) {
        throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu issue için görüntüleme yetkiniz bulunmamaktadır.');
    }
}

/**
 * Issue Yazma/Silme Yetkisi Kontrolü
 * Sadece Contributor ve Reviewer ekleme/silme yapabilir.
 */
async function checkIssueWritePermission(userId: string, issueId: string): Promise<void> {
    const query = `
        SELECT role FROM issue_memberships 
        WHERE issue_id = $1 AND user_id = $2 
        AND role IN ('contributor', 'reviewer') 
        AND membership_is_active = true
    `;
    const result = await tenantPool.query(query, [issueId, userId]);
    
    if (!result || !result.rows || result.rows.length === 0) {
        throw new AppError(ErrorCodes.PROJECT_PERMISSION_DENIED, 'Bu işlem için Contributor veya Reviewer yetkisi gereklidir.');
    }
}

// ==================== 1. CREATE ====================
export const createIssueAsset = async (input: CreateIssueAssetInput): Promise<string> => {
    // Önce issue üyeliğini ve yazma yetkisini kontrol et
    await checkIssueWritePermission(input.uploaded_by, input.issue_id);

    const query = `
        INSERT INTO issue_assets (
            issue_asset_id, issue_id, uploaded_by, asset_type, 
            file_name, mime_type, byte_size, storage_key, 
            checksum, metadata, is_active
        ) 
        VALUES ($1, $2, $3, $4::text::asset_type, $5, $6, $7, $8, $9, $10, true)
        RETURNING issue_asset_id;
    `;

    const generatedAssetId = crypto.randomUUID();
    const values = [
        generatedAssetId,
        input.issue_id,
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
        if (!result || !result.rows || result.rows.length === 0) {
            throw new Error('INSERT sorgusu beklenen sonucu dönmedi');
        }
        log.info('Issue asset created successfully', { issueAssetId: result.rows[0].issue_asset_id, issueId: input.issue_id });
        return result.rows[0].issue_asset_id;
    } catch (error) {
        log.error('DB Error: Failed to create issue asset', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Issue varlığı veritabanına kaydedilemedi.');
    }
};

// ==================== 2. READ (LIST) ====================
export const listIssueAssets = async (issueId: string, userId: string, limit = 50, offset = 0) => {
    // Önce görme yetkisini kontrol et
    await checkIssueReadPermission(userId, issueId);

    const query = `
        SELECT 
            issue_asset_id, asset_type, file_name, mime_type, 
            byte_size, storage_key, checksum, metadata, 
            uploaded_by, created_at
        FROM issue_assets
        WHERE issue_id = $1 AND is_active = true AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3;
    `;

    try {
        const result = await tenantPool.query(query, [issueId, limit, offset]);
        return result?.rows || [];
    } catch (error) {
        log.error('DB Error: Failed to list issue assets', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Issue asset listesi alınamadı.');
    }
};

// ==================== 3. DELETE (SOFT) ====================
export const deleteIssueAsset = async (issueAssetId: string, issueId: string, userId: string): Promise<void> => {
    // Yazma yetkisini kontrol et (silme = yazma yetkisi)
    await checkIssueWritePermission(userId, issueId);

    const findQuery = `
        SELECT issue_asset_id FROM issue_assets 
        WHERE issue_asset_id = $1 AND issue_id = $2 AND is_active = true AND deleted_at IS NULL
    `;
    const assetCheck = await tenantPool.query(findQuery, [issueAssetId, issueId]);

    if (!assetCheck || !assetCheck.rows || assetCheck.rows.length === 0) {
        throw new AppError(ErrorCodes.ISSUE_NOT_FOUND, 'Asset bulunamadı veya zaten silinmiş.');
    }

    const deleteQuery = `
        UPDATE issue_assets 
        SET is_active = false, deleted_at = NOW(), deleted_by = $1
        WHERE issue_asset_id = $2 AND issue_id = $3
    `;

    try {
        await tenantPool.query(deleteQuery, [userId, issueAssetId, issueId]);
        log.info('Issue asset soft-deleted', { issueAssetId, issueId, deletedBy: userId });
    } catch (error) {
        log.error('DB Error: Failed to soft-delete issue asset', { error });
        throw new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Issue asset silme işlemi başarısız oldu.');
    }
};