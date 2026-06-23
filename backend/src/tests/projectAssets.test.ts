import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { tenantPool } from '../db/tenantPool';
import * as projectController from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth';
import { ErrorCodes } from '../utils/errorCodes';

const app = express();
app.use(express.json());

app.use('/api/projects/:id/assets', authMiddleware, (req, res, next) => {
    if (req.method === 'POST') {
        req.file = {
            fieldname: 'file',
            originalname: 'project_doc.pdf',
            mimetype: 'application/pdf',
            buffer: Buffer.from('25504446', 'hex'), // Dummy PDF header
            size: 1024,
            checksum: crypto.createHash('sha256').update('25504446').digest('hex'),
            storageKey: `test/projects/assets/${crypto.randomUUID()}`
        } as any;
    }
    next();
});

app.post('/api/projects/:id/assets', projectController.uploadProjectAsset);
app.get('/api/projects/:id/assets', projectController.listProjectAssets);
app.delete('/api/projects/:id/assets/:assetId', projectController.removeProjectAsset);

describe('Project Assets API Tests', () => {
    let projectAdminToken: string;
    let projectViewerToken: string;

    let projectAdminId: string;
    let projectViewerId: string;

    let testOrgId: string;
    let testSiteId: string;
    let testProjectId: string;
    let testProjectAssetId: string;

    beforeAll(async () => {
        const ts = Date.now();
        projectAdminId = crypto.randomUUID();
        projectViewerId = crypto.randomUUID();
        testOrgId = crypto.randomUUID();
        testSiteId = crypto.randomUUID();
        testProjectId = crypto.randomUUID();

        // 1. Kullanıcılar
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) VALUES ($1, $2, $3, $4, $5)`,
            [projectAdminId, 'Project Admin', `p-admin-${ts}@test.com`, 'hashed', true]
        );
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) VALUES ($1, $2, $3, $4, $5)`,
            [projectViewerId, 'Project Viewer', `p-viewer-${ts}@test.com`, 'hashed', true]
        );

        // 2. Org & Site & Project
        await tenantPool.query(
            `INSERT INTO organizations (org_id, org_check_id, org_name, slug) VALUES ($1, $2, $3, $4)`,
            [testOrgId, `ochk-${ts}`, 'Proj Test Org', `proj-org-${ts}`]
        );
        await tenantPool.query(
            `INSERT INTO sites (site_id, org_id, site_name, site_slug) VALUES ($1, $2, $3, $4)`,
            [testSiteId, testOrgId, 'Proj Test Site', `proj-site-${ts}`]
        );
        await tenantPool.query(
            `INSERT INTO projects (project_id, site_id, project_check_id, project_name) VALUES ($1, $2, $3, $4)`,
            [testProjectId, testSiteId, `pchk-${ts}`, 'Target Project']
        );

        // 3. Project Memberships (Biri Admin, Biri Viewer)
        await tenantPool.query(
            `INSERT INTO project_memberships (project_membership_id, project_id, user_id, role, membership_is_active) 
             VALUES ($1, $2, $3, CAST('project_admin' AS project_role), true)`,
            [crypto.randomUUID(), testProjectId, projectAdminId]
        );
        await tenantPool.query(
            `INSERT INTO project_memberships (project_membership_id, project_id, user_id, role, membership_is_active) 
             VALUES ($1, $2, $3, CAST('viewer' AS project_role), true)`,
            [crypto.randomUUID(), testProjectId, projectViewerId]
        );

        const secret = process.env.JWT_SECRET || 'test_secret_key_32_chars_long_for_jwt';
        projectAdminToken = jwt.sign({ userId: projectAdminId, tokenVersion: 1 }, secret);
        projectViewerToken = jwt.sign({ userId: projectViewerId, tokenVersion: 1 }, secret);

        console.info('Project Asset Test Setup Completed');
    });

    afterAll(async () => {
        try {
            // Hiyerarşik temizlik (Çocuklardan ebeveynlere doğru silme işlemi)
            await tenantPool.query('DELETE FROM project_assets WHERE project_id = $1', [testProjectId]);
            await tenantPool.query('DELETE FROM project_memberships WHERE project_id = $1', [testProjectId]);
            await tenantPool.query('DELETE FROM projects WHERE project_id = $1', [testProjectId]);
            await tenantPool.query('DELETE FROM sites WHERE site_id = $1', [testSiteId]);
            await tenantPool.query('DELETE FROM organizations WHERE org_id = $1', [testOrgId]);
            await tenantPool.query('DELETE FROM users WHERE user_id IN ($1, $2)', [projectAdminId, projectViewerId]);
        } catch (e) {
            console.error('Project Asset Test Cleanup failed', { e });
        }

        // 🎯 Jest'in terminalde takılı kalmasını engelleyen altın vuruş
        tenantPool.removeAllListeners('remove');
        await tenantPool.end();
        console.info('Project Asset Test Cleanup Completed');
    });

    // ==================== POST ====================
    describe('POST /api/projects/:id/assets', () => {
        it('should allow Project Admin to upload', async () => {
            const res = await request(app)
                .post(`/api/projects/${testProjectId}/assets`)
                .set('Authorization', `Bearer ${projectAdminToken}`)
                .send({ asset_type: 'file' });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('project_asset_id');
            testProjectAssetId = res.body.project_asset_id;
        });

        it('should block Viewer from uploading (403)', async () => {
            const res = await request(app)
                .post(`/api/projects/${testProjectId}/assets`)
                .set('Authorization', `Bearer ${projectViewerToken}`)
                .send({ asset_type: 'file' });
            expect(res.status).toBe(403);
            expect(res.body.code).toBe(ErrorCodes.PROJECT_PERMISSION_DENIED);
        });
    });

    // ==================== GET ====================
    describe('GET /api/projects/:id/assets', () => {
        it('should allow Viewer to list assets (Read-Only)', async () => {
            const res = await request(app)
                .get(`/api/projects/${testProjectId}/assets`)
                .set('Authorization', `Bearer ${projectViewerToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should allow Project Admin to list assets', async () => {
            const res = await request(app)
                .get(`/api/projects/${testProjectId}/assets`)
                .set('Authorization', `Bearer ${projectAdminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    // ==================== DELETE ====================
    describe('DELETE /api/projects/:id/assets/:assetId', () => {
        it('should deny Viewer from deleting (403)', async () => {
            expect(testProjectAssetId).toBeDefined();

            const res = await request(app)
                .delete(`/api/projects/${testProjectId}/assets/${testProjectAssetId}`)
                .set('Authorization', `Bearer ${projectViewerToken}`);
            expect(res.status).toBe(403);
            expect(res.body.code).toBe(ErrorCodes.PROJECT_PERMISSION_DENIED);
        });

        it('should allow Project Admin to soft-delete', async () => {
            expect(testProjectAssetId).toBeDefined();

            const res = await request(app)
                .delete(`/api/projects/${testProjectId}/assets/${testProjectAssetId}`)
                .set('Authorization', `Bearer ${projectAdminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('successfully');
        });
    });
});