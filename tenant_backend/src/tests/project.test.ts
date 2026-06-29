import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { tenantPool } from '../db/tenantPool';
import projectRoutes from '../routes/project.routes'; // Kendi route yoluna göre düzelt
import { log } from '../utils/logger';
import { authMiddleware } from '../middlewares/auth';

const app = express();
app.use(express.json());
app.use('/api/projects', authMiddleware, projectRoutes);

describe('Project API Tests', () => {
    // Kullanıcılar
    let adminToken: string;
    let viewerToken: string;
    
    let adminUserId: string;
    let viewerUserId: string;

    // Veritabanı ID'leri
    let testOrgId: string;
    let testSiteId: string;
    let testProjectId: string;

    beforeAll(async () => {
        const ts = Date.now();
        adminUserId = crypto.randomUUID();
        viewerUserId = crypto.randomUUID();
        testOrgId = crypto.randomUUID();
        testSiteId = crypto.randomUUID();

        // 1. Kullanıcıları Oluştur
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
             VALUES ($1, $2, $3, $4, $5)`,
            [adminUserId, 'Admin User', `admin-${ts}@test.com`, 'hashed_password', true]
        );

        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
             VALUES ($1, $2, $3, $4, $5)`,
            [viewerUserId, 'Viewer User', `viewer-${ts}@test.com`, 'hashed_password', true]
        );

        // 2. Zorunlu Organization Oluştur
        await tenantPool.query(
            `INSERT INTO organizations (org_id, org_check_id, org_name, slug) 
             VALUES ($1, $2, $3, $4)`,
            [testOrgId, `chk-${ts}`, 'Test Org', `test-org-${ts}`]
        );

        // 3. EKSİK OLAN ADIM: Kullanıcıları Organizasyona Üye Yap
        await tenantPool.query(
            `INSERT INTO organization_memberships (org_id, user_id, role, membership_is_active) 
             VALUES ($1, $2, 'admin', true)`,
            [testOrgId, adminUserId]
        );

        await tenantPool.query(
            `INSERT INTO organization_memberships (org_id, user_id, role, membership_is_active) 
             VALUES ($1, $2, 'viewer', true)`,
            [testOrgId, viewerUserId]
        );

        // 4. Site'ı Oluştur
        await tenantPool.query(
            `INSERT INTO sites (site_id, org_id, site_name, site_slug) 
             VALUES ($1, $2, $3, $4)`,
            [testSiteId, testOrgId, 'Test Site', `test-site-${ts}`]
        );

        // 5. Site Üyeliklerini Ata
        await tenantPool.query(
            `INSERT INTO site_memberships (site_id, user_id, role, membership_is_active) 
             VALUES ($1, $2, 'admin', true)`,
            [testSiteId, adminUserId]
        );

        await tenantPool.query(
            `INSERT INTO site_memberships (site_id, user_id, role, membership_is_active) 
             VALUES ($1, $2, 'viewer', true)`,
            [testSiteId, viewerUserId]
        );

        // Token'ları Üret
        const secret = process.env.JWT_SECRET || 'test_secret_key_32_chars_long_for_jwt';
        adminToken = jwt.sign({ userId: adminUserId, tokenVersion: 1 }, secret);
        viewerToken = jwt.sign({ userId: viewerUserId, tokenVersion: 1 }, secret);

        log.info('Project Test Setup Completed');
    });

    afterAll(async () => {
        try {
            // Cascade delete sayesinde Org silinince site, projeler ve üyelikler uçar
            await tenantPool.query('DELETE FROM organizations WHERE org_id = $1', [testOrgId]);
            await tenantPool.query('DELETE FROM users WHERE user_id IN ($1, $2)', [adminUserId, viewerUserId]);
        } catch (e) {
            log.error('Cleanup failed', { e });
        }
        await tenantPool.end();
        log.info('Project Test Cleanup Completed');
    });

    // ==================== CREATE ====================
    describe('POST /api/projects', () => {
        it('should create a new project with valid data (Admin)', async () => {
            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    site_id: testSiteId,
                    name: 'E-Commerce Rewrite',
                    project_key: 'ECOMM',
                    board_type: 'scrum',
                    description: 'Full rewrite of the platform',
                    is_private: false
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('project_id');
            testProjectId = response.body.project_id;
        });

        it('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    site_id: testSiteId,
                    name: 'Missing Fields Project'
                    // project_key ve board_type bilerek yollanmadı
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('are required');
        });

        it('should deny project creation for Viewer (403)', async () => {
            const response = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({
                    site_id: testSiteId,
                    name: 'Hacker Project',
                    project_key: 'HACK',
                    board_type: 'kanban'
                });

            expect(response.status).toBe(403);
        });
    });

    // ==================== READ ====================
    describe('GET /api/projects', () => {
        it('should list projects for site members (Viewer/Admin)', async () => {
            const response = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`) // Admin zaten üye olduğu için projeyi görecektir.
                .query({ site_id: testSiteId });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0); // Artık 0 dönmeyecek!
        });

        it('should return 400 if site_id query is missing', async () => {
            const response = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/projects/:id', () => {
        it('should get project details by id', async () => {
            const response = await request(app)
                .get(`/api/projects/${testProjectId}?site_id=${testSiteId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.project_id).toBe(testProjectId);
        });

        it('should return 404 for non-existent project', async () => {
            const fakeId = crypto.randomUUID();
            const response = await request(app)
                .get(`/api/projects/${fakeId}?site_id=${testSiteId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });

    // ==================== UPDATE ====================
    describe('PUT /api/projects/:id', () => {
        it('should allow Admin to update project', async () => {
            const response = await request(app)
                .put(`/api/projects/${testProjectId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    site_id: testSiteId,
                    name: 'Updated E-Commerce Name',
                    description: 'Updated description'
                });

            expect(response.status).toBe(200);
        });

        it('should deny Viewer from updating project (403)', async () => {
            const response = await request(app)
                .put(`/api/projects/${testProjectId}`)
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({
                    site_id: testSiteId,
                    name: 'Viewer Try Update'
                });

            expect(response.status).toBe(403);
        });
    });
    
    // ==================== DELETE ====================
    describe('DELETE /api/projects/:id', () => {
        it('should deny Viewer from deleting project (403)', async () => {
            const response = await request(app)
                .delete(`/api/projects/${testProjectId}?site_id=${testSiteId}`)
                .set('Authorization', `Bearer ${viewerToken}`);

            expect(response.status).toBe(403);
        });

        it('should allow Admin to soft-delete project', async () => {
            const response = await request(app)
                .delete(`/api/projects/${testProjectId}?site_id=${testSiteId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        it('should return 404 for already deleted project', async () => {
            const response = await request(app)
                .delete(`/api/projects/${testProjectId}?site_id=${testSiteId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });

    // ==================== RESTORE ====================
    describe('POST /api/projects/:id/restore', () => {
        it('should restore a soft-deleted project (Admin)', async () => {
            const response = await request(app)
                .post(`/api/projects/${testProjectId}/restore`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ site_id: testSiteId });

            expect(response.status).toBe(200);
        });
    });
});