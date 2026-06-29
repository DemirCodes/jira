/**
 * ISSUE ASSETS SERVICE - UNIT TESTS
 * 
 * Test Kapsamı:
 * - Yetki kontrolleri (Contributor, Reviewer, Watcher, Üye Olmayan)
 * - Asset oluşturma (create)
 * - Asset listeleme (read)
 * - Asset silme (soft delete)
 * - Hata durumları (bulunamayan asset, yetkisiz erişim, geçersiz UUID)
 * - Watcher kısıtlamaları
 */

import { tenantPool } from '../db/tenantPool';
import * as issueAssetService from '../services/issueAssets.service';
import { AppError } from '../utils/errorCodes';

// Mock tenantPool
jest.mock('../db/tenantPool', () => ({
    tenantPool: {
        query: jest.fn()
    }
}));

// Mock logger
jest.mock('../utils/logger', () => ({
    log: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    }
}));

describe('IssueAssets Service', () => {
    // Test sabitleri
    const mockIssueId = '123e4567-e89b-12d3-a456-426614174000';
    const mockAssetId = '223e4567-e89b-12d3-a456-426614174001';
    const mockContributorUserId = '323e4567-e89b-12d3-a456-426614174002';
    const mockReviewerUserId = '423e4567-e89b-12d3-a456-426614174003';
    const mockWatcherUserId = '523e4567-e89b-12d3-a456-426614174004';
    const mockNonMemberUserId = '623e4567-e89b-12d3-a456-426614174005';

    // Mock asset input
    const mockAssetInput = {
        issue_id: mockIssueId,
        uploaded_by: mockContributorUserId,
        asset_type: 'image',
        file_name: 'test-screenshot.png',
        mime_type: 'image/png',
        byte_size: 102400,
        storage_key: `issues/${mockIssueId}/assets/1719000000000_test-screenshot.png`,
        checksum: 'abc123def456',
        metadata: { description: 'Test asset' }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ========================================================================
    // CREATE TESTS
    // ========================================================================
    describe('createIssueAsset', () => {
        it('✅ Contributor yeni asset ekleyebilmeli', async () => {
            // Mock: Yazma yetkisi kontrolü (contributor)
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'contributor' }]
            });

            // Mock: INSERT işlemi
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ issue_asset_id: mockAssetId }]
            });

            const result = await issueAssetService.createIssueAsset(mockAssetInput);

            expect(result).toBe(mockAssetId);
            expect(tenantPool.query).toHaveBeenCalledTimes(2);
        });

        it('✅ Reviewer yeni asset ekleyebilmeli', async () => {
            // Mock: Yazma yetkisi kontrolü (reviewer)
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'reviewer' }]
            });

            // Mock: INSERT işlemi
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ issue_asset_id: mockAssetId }]
            });

            const reviewerInput = { ...mockAssetInput, uploaded_by: mockReviewerUserId };
            const result = await issueAssetService.createIssueAsset(reviewerInput);

            expect(result).toBe(mockAssetId);
            expect(tenantPool.query).toHaveBeenCalledTimes(2);
        });

        it('❌ Watcher asset ekleyememeli (403 yetki hatası)', async () => {
            // Mock: Yazma yetkisi yok (watcher) - Boş rows dönmeli
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [] // Watcher yetkisi yetersiz, boş array
            });

            const watcherInput = { ...mockAssetInput, uploaded_by: mockWatcherUserId };

            // Tek bir çağrıda hem error türü hem message'ı kontrol et
            await expect(
                issueAssetService.createIssueAsset(watcherInput)
            ).rejects.toThrow('Contributor veya Reviewer yetkisi gereklidir');

            // Sadece yetki kontrolü çağrıldı, INSERT çağrılmadı
            expect(tenantPool.query).toHaveBeenCalledTimes(1);
        });

        it('❌ Üye olmayan kullanıcı asset ekleyememeli', async () => {
            // Mock: Üyelik yok - Boş rows
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            const nonMemberInput = { ...mockAssetInput, uploaded_by: mockNonMemberUserId };

            await expect(
                issueAssetService.createIssueAsset(nonMemberInput)
            ).rejects.toThrow(AppError);

            expect(tenantPool.query).toHaveBeenCalledTimes(1);
        });

        it('❌ Veritabanı hatasında INTERNAL_SERVER_ERROR fırlatmalı', async () => {
            // Mock: Yetki kontrolü başarılı
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'contributor' }]
            });

            // Mock: INSERT sırasında DB hatası
            (tenantPool.query as jest.Mock).mockRejectedValueOnce(new Error('DB connection lost'));

            await expect(
                issueAssetService.createIssueAsset(mockAssetInput)
            ).rejects.toThrow('Issue varlığı veritabanına kaydedilemedi');
        });

        it('✅ Metadata null olarak gönderildiğinde hata vermemeli', async () => {
            // Mock: Yetki kontrolü başarılı
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'contributor' }]
            });

            // Mock: INSERT başarılı
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ issue_asset_id: mockAssetId }]
            });

            const inputWithoutMetadata = { ...mockAssetInput, metadata: undefined };
            const result = await issueAssetService.createIssueAsset(inputWithoutMetadata);

            expect(result).toBe(mockAssetId);
            expect(tenantPool.query).toHaveBeenCalledTimes(2);
        });
    });

    // ========================================================================
    // LIST TESTS
    // ========================================================================
    describe('listIssueAssets', () => {
        const mockAssetList = [
            {
                issue_asset_id: mockAssetId,
                asset_type: 'image',
                file_name: 'test.png',
                mime_type: 'image/png',
                byte_size: 102400,
                storage_key: 'issues/123/assets/test.png',
                checksum: 'abc123',
                metadata: {},
                uploaded_by: mockContributorUserId,
                created_at: new Date().toISOString()
            }
        ];

        it('✅ Contributor asset listesini görebilmeli', async () => {
            // Mock: Görme yetkisi var
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'contributor' }]
            });

            // Mock: SELECT başarılı
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: mockAssetList
            });

            const result = await issueAssetService.listIssueAssets(mockIssueId, mockContributorUserId);

            expect(result).toEqual(mockAssetList);
            expect(result.length).toBe(1);
            expect(tenantPool.query).toHaveBeenCalledTimes(2);
        });

        it('✅ Reviewer asset listesini görebilmeli', async () => {
            // Mock: Görme yetkisi var (reviewer)
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'reviewer' }]
            });

            // Mock: SELECT başarılı
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: mockAssetList
            });

            const result = await issueAssetService.listIssueAssets(mockIssueId, mockReviewerUserId);
            expect(result).toEqual(mockAssetList);
        });

        it('✅ Watcher asset listesini görebilmeli (read-only)', async () => {
            // Mock: Görme yetkisi var (watcher)
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'watcher' }]
            });

            // Mock: SELECT başarılı
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: mockAssetList
            });

            const result = await issueAssetService.listIssueAssets(mockIssueId, mockWatcherUserId);
            expect(result).toEqual(mockAssetList);
        });

        it('❌ Üye olmayan kullanıcı asset listesini görememeli', async () => {
            // Mock: Üyelik yok - Boş rows
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            await expect(
                issueAssetService.listIssueAssets(mockIssueId, mockNonMemberUserId)
            ).rejects.toThrow('görüntüleme yetkiniz bulunmamaktadır');

            expect(tenantPool.query).toHaveBeenCalledTimes(1);
        });

        it('✅ Limit ve offset parametreleri doğru iletilmeli', async () => {
            // Mock: Görme yetkisi var
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'contributor' }]
            });

            // Mock: SELECT başarılı
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            const limit = 10;
            const offset = 20;
            await issueAssetService.listIssueAssets(mockIssueId, mockContributorUserId, limit, offset);

            // SELECT sorgusu limit ve offset ile çağrılmış mı kontrol et
            const selectCall = (tenantPool.query as jest.Mock).mock.calls[1];
            expect(selectCall[1]).toEqual([mockIssueId, limit, offset]);
        });

        it('✅ Silinmiş (soft-deleted) assetler listede gelmemeli', async () => {
            // Mock: Görme yetkisi var
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'contributor' }]
            });

            // Mock: Sadece aktif ve silinmemiş assetler
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [] // Hiç aktif asset yok
            });

            const result = await issueAssetService.listIssueAssets(mockIssueId, mockContributorUserId);
            expect(result).toEqual([]);
        });
    });

    // ========================================================================
    // DELETE (SOFT) TESTS
    // ========================================================================
    describe('deleteIssueAsset', () => {
        it('✅ Contributor asset silebilmeli (soft delete)', async () => {
            // Mock: Yazma yetkisi var
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'contributor' }]
            });

            // Mock: Asset bulundu
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ issue_asset_id: mockAssetId }]
            });

            // Mock: Soft delete UPDATE başarılı
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            await expect(
                issueAssetService.deleteIssueAsset(mockAssetId, mockIssueId, mockContributorUserId)
            ).resolves.toBeUndefined();

            expect(tenantPool.query).toHaveBeenCalledTimes(3);
        });

        it('✅ Reviewer asset silebilmeli (soft delete)', async () => {
            // Mock: Yazma yetkisi var (reviewer)
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'reviewer' }]
            });

            // Mock: Asset bulundu
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ issue_asset_id: mockAssetId }]
            });

            // Mock: Soft delete UPDATE başarılı
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            await expect(
                issueAssetService.deleteIssueAsset(mockAssetId, mockIssueId, mockReviewerUserId)
            ).resolves.toBeUndefined();
        });

        it('❌ Watcher asset silememeli (403 yetki hatası)', async () => {
            // Mock: Watcher yetkisi yetersiz - Boş rows
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [] // Watcher yazamaz
            });

            await expect(
                issueAssetService.deleteIssueAsset(mockAssetId, mockIssueId, mockWatcherUserId)
            ).rejects.toThrow('Contributor veya Reviewer yetkisi gereklidir');

            // Sadece yetki kontrolü yapıldı, find ve delete sorguları çağrılmadı
            expect(tenantPool.query).toHaveBeenCalledTimes(1);
        });

        it('❌ Zaten silinmiş veya var olmayan asset için ISSUE_NOT_FOUND hatası', async () => {
            // Mock: Yazma yetkisi var
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'contributor' }]
            });

            // Mock: Asset bulunamadı (zaten silinmiş veya hiç yok)
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            await expect(
                issueAssetService.deleteIssueAsset(mockAssetId, mockIssueId, mockContributorUserId)
            ).rejects.toThrow('Asset bulunamadı veya zaten silinmiş');
        });

        it('❌ Yanlış issue_id ile asset silinememeli', async () => {
            const wrongIssueId = '999e4567-e89b-12d3-a456-426614174999';

            // Mock: Yazma yetkisi var (kendi issue'sında)
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'contributor' }]
            });

            // Mock: Asset bu issue'da bulunamadı
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            await expect(
                issueAssetService.deleteIssueAsset(mockAssetId, wrongIssueId, mockContributorUserId)
            ).rejects.toThrow('Asset bulunamadı veya zaten silinmiş');
        });

        it('✅ Soft delete sırasında deleted_at ve deleted_by doğru set edilmeli', async () => {
            // Mock: Yazma yetkisi var
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'contributor' }]
            });

            // Mock: Asset bulundu
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ issue_asset_id: mockAssetId }]
            });

            // Mock: UPDATE başarılı
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });

            await issueAssetService.deleteIssueAsset(mockAssetId, mockIssueId, mockContributorUserId);

            // UPDATE sorgusunu yakala ve parametreleri kontrol et
            const updateCall = (tenantPool.query as jest.Mock).mock.calls[2];
            expect(updateCall[1][0]).toBe(mockContributorUserId); // deleted_by
            expect(updateCall[1][1]).toBe(mockAssetId);           // issue_asset_id
            expect(updateCall[1][2]).toBe(mockIssueId);           // issue_id
        });

        it('❌ DB hatasında INTERNAL_SERVER_ERROR fırlatmalı', async () => {
            // Mock: Yazma yetkisi var
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'contributor' }]
            });

            // Mock: Asset bulundu
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ issue_asset_id: mockAssetId }]
            });

            // Mock: UPDATE sırasında hata
            (tenantPool.query as jest.Mock).mockRejectedValueOnce(new Error('DB timeout'));

            await expect(
                issueAssetService.deleteIssueAsset(mockAssetId, mockIssueId, mockContributorUserId)
            ).rejects.toThrow('Issue asset silme işlemi başarısız oldu');
        });
    });

    // ========================================================================
    // KOMBİNE SENARYOLAR
    // ========================================================================
    describe('Kombine Yetki Senaryoları', () => {
        it('Watcher listeleyebilir ama silemez', async () => {
            // LIST testi - Watcher görebilmeli
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ role: 'watcher' }]
            });
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [{ issue_asset_id: mockAssetId, file_name: 'test.png' }]
            });

            const listResult = await issueAssetService.listIssueAssets(mockIssueId, mockWatcherUserId);
            expect(listResult.length).toBe(1);

            // DELETE testi - Watcher silememeli
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [] // Watcher yazma yetkisi yok
            });

            await expect(
                issueAssetService.deleteIssueAsset(mockAssetId, mockIssueId, mockWatcherUserId)
            ).rejects.toThrow('Contributor veya Reviewer yetkisi gereklidir');
        });

        it('Üye olmayan hiçbir şey yapamamalı', async () => {
            // LIST denemesi
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });
            await expect(
                issueAssetService.listIssueAssets(mockIssueId, mockNonMemberUserId)
            ).rejects.toThrow();

            // CREATE denemesi
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });
            await expect(
                issueAssetService.createIssueAsset({ ...mockAssetInput, uploaded_by: mockNonMemberUserId })
            ).rejects.toThrow();

            // DELETE denemesi
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: []
            });
            await expect(
                issueAssetService.deleteIssueAsset(mockAssetId, mockIssueId, mockNonMemberUserId)
            ).rejects.toThrow();
        });

        it('Aktif olmayan (is_active = false) üyelik ile işlem yapılamamalı', async () => {
            // Mock: Üyelik var ama aktif değil (membership_is_active = false)
            // Bu durumda hiçbir rol kontrolü geçilmemeli
            (tenantPool.query as jest.Mock).mockResolvedValueOnce({
                rows: [] // Sorgu membership_is_active = true filtresi nedeniyle boş döner
            });

            await expect(
                issueAssetService.listIssueAssets(mockIssueId, mockContributorUserId)
            ).rejects.toThrow('görüntüleme yetkiniz bulunmamaktadır');
        });
    });
});