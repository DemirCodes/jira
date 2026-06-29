import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { tenantPool } from '../db/tenantPool';
import * as siteController from '../controllers/site.controller';
import { authMiddleware } from '../middlewares/auth';
import { ErrorCodes } from '../utils/errorCodes';

const app = express();
app.use(express.json());

app.use('/api/sites/:id/assets', authMiddleware, (req, res, next) => {
    if (req.method === 'POST') {
        req.file = {
            fieldname: 'file',
            originalname: 'site_banner.png',
            mimetype: 'image/png',
            buffer: Buffer.from('89504e47', 'hex'),
            size: 4,
            checksum: crypto.createHash('sha256').update('89504e47').digest('hex'),
            storageKey: `test/sites/assets/${crypto.randomUUID()}`
        } as any;
    }
    next();
});

app.post('/api/sites/:id/assets', siteController.uploadSiteAsset);
app.get('/api/sites/:id/assets', siteController.listSiteAssets);
app.delete('/api/sites/:id/assets/:assetId', siteController.removeSiteAsset);

describe('Site Assets API Tests', () => {
    let orgAdminToken: string;
    let siteAdminToken: string;

    let orgAdminUserId: string;
    let siteAdminUserId: string;

    let testOrgId: string;
    let testSiteId: string;
    let testSiteAssetId: string;

    beforeAll(async () => {
        const ts = Date.now();
        orgAdminUserId = crypto.randomUUID();
        siteAdminUserId = crypto.randomUUID();
        testOrgId = crypto.randomUUID();
        testSiteId = crypto.randomUUID();

        // 1. Kullanıcılar
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active, user_friendship_code) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [orgAdminUserId, 'Org Admin User', `org-admin-${ts}@test.com`, 'hashed_password', true, crypto.randomUUID()]
        );
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active, user_friendship_code) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [siteAdminUserId, 'Site Admin User', `site-admin-${ts}@test.com`, 'hashed_password', true, crypto.randomUUID()]
        );

        // 2. Organizasyon
        await tenantPool.query(
            `INSERT INTO organizations (org_id, org_check_id, org_name, slug) VALUES ($1, $2, $3, $4)`,
            [testOrgId, `ochk-${ts}`, 'Site Test Org', `site-org-${ts}`]
        );

        // 3. Org üyelikleri
        await tenantPool.query(
            `INSERT INTO organization_memberships (org_membership_id, org_id, user_id, role, membership_is_active) 
             VALUES ($1, $2, $3, CAST('admin' AS org_role), true)`,
            [crypto.randomUUID(), testOrgId, orgAdminUserId]
        );
        await tenantPool.query(
            `INSERT INTO organization_memberships (org_membership_id, org_id, user_id, role, membership_is_active) 
             VALUES ($1, $2, $3, CAST('admin' AS org_role), true)`,
            [crypto.randomUUID(), testOrgId, siteAdminUserId]
        );

        // 4. Site
        await tenantPool.query(
            `INSERT INTO sites (site_id, org_id, site_name, site_slug, site_status, created_by, is_private) 
             VALUES ($1, $2, $3, $4, CAST('active' AS site_status), $5, false)`,
            [testSiteId, testOrgId, 'Test Target Site', `target-site-${ts}`, orgAdminUserId]
        );

        // 5. Site Admin üyeliği — sadece siteAdminUserId
        await tenantPool.query(
            `INSERT INTO site_memberships (site_membership_id, site_id, user_id, role, membership_is_active) 
             VALUES ($1, $2, $3, CAST('admin' AS site_role), true)`,
            [crypto.randomUUID(), testSiteId, siteAdminUserId]
        );
        // orgAdminUserId site_memberships'e eklenmedi — sadece org üyesi, okuyabilir ama yazamaz

        const secret = process.env.JWT_SECRET || 'test_secret_key_32_chars_long_for_jwt';
        orgAdminToken = jwt.sign({ userId: orgAdminUserId, tokenVersion: 1 }, secret);
        siteAdminToken = jwt.sign({ userId: siteAdminUserId, tokenVersion: 1 }, secret);

        console.info('Site Asset Test Setup Completed');
    });

    afterAll(async () => {
        try {
            await tenantPool.query('DELETE FROM site_assets WHERE site_id = $1', [testSiteId]);
            await tenantPool.query('DELETE FROM site_memberships WHERE site_id = $1', [testSiteId]);
            await tenantPool.query('DELETE FROM sites WHERE site_id = $1', [testSiteId]);
            await tenantPool.query('DELETE FROM organization_memberships WHERE org_id = $1', [testOrgId]);
            await tenantPool.query('DELETE FROM organizations WHERE org_id = $1', [testOrgId]);
            await tenantPool.query('DELETE FROM users WHERE user_id IN ($1, $2)', [orgAdminUserId, siteAdminUserId]);
        } catch (e) {
            console.error('Site Asset Test Cleanup failed', { e });
        }

        tenantPool.removeAllListeners('remove');
        await tenantPool.end();
        console.info('Site Asset Test Cleanup Completed');
    });

    // ==================== POST ====================
    describe('POST /api/sites/:id/assets', () => {
        it('should allow Site Admin to upload a valid site asset', async () => {
            const response = await request(app)
                .post(`/api/sites/${testSiteId}/assets`)
                .set('Authorization', `Bearer ${siteAdminToken}`)
                .send({ asset_type: 'image' });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('site_asset_id');
            testSiteAssetId = response.body.site_asset_id;
        });

        it('should block Org Admin from uploading asset (403)', async () => {
            const response = await request(app)
                .post(`/api/sites/${testSiteId}/assets`)
                .set('Authorization', `Bearer ${orgAdminToken}`)
                .send({ asset_type: 'image' });

            expect(response.status).toBe(403);
            expect(response.body.code).toBe(ErrorCodes.PROJECT_PERMISSION_DENIED);
        });
    });

    // ==================== GET ====================
    describe('GET /api/sites/:id/assets', () => {
        it('should allow Org Admin to list site assets (Read-Only)', async () => {
            const response = await request(app)
                .get(`/api/sites/${testSiteId}/assets`)
                .set('Authorization', `Bearer ${orgAdminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should allow Site Admin to list site assets', async () => {
            const response = await request(app)
                .get(`/api/sites/${testSiteId}/assets`)
                .set('Authorization', `Bearer ${siteAdminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    // ==================== DELETE ====================
    describe('DELETE /api/sites/:id/assets/:assetId', () => {
        it('should deny Org Admin from deleting site asset (403)', async () => {
            expect(testSiteAssetId).toBeDefined();

            const response = await request(app)
                .delete(`/api/sites/${testSiteId}/assets/${testSiteAssetId}`)
                .set('Authorization', `Bearer ${orgAdminToken}`);

            expect(response.status).toBe(403);
            expect(response.body.code).toBe(ErrorCodes.PROJECT_PERMISSION_DENIED);
        });

        it('should allow Site Admin to soft-delete the site asset', async () => {
            expect(testSiteAssetId).toBeDefined();

            const response = await request(app)
                .delete(`/api/sites/${testSiteId}/assets/${testSiteAssetId}`)
                .set('Authorization', `Bearer ${siteAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('successfully');
        });
    });
});