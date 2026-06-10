import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { tenantPool } from '../db/tenantPool';
import issueRoutes from '../routes/issue.routes';
import { log } from '../utils/logger';
import { authMiddleware } from '../middlewares/auth';
import { ErrorCodes } from '../utils/errorCodes';

// 1. TEST İÇİN İZOLE BİR EXPRESS INSTANCES'I OLUŞTURUN
// Bu, index.ts'deki global app ile karışmasını engeller ve testin stabil çalışmasını sağlar.
const testApp = express();

// 2. GEREKLİ MIDDLEWARE'LERİ EKLEYİN
// express.json() middleware'i kritik! Bu olmadan req.body undefined kalır.
testApp.use(express.json());

// Auth middleware'ini ekleyin (Eğer authMiddleware token'ı req.user'a atıyorsa)
testApp.use(authMiddleware);

// Routes'ı mount edin
testApp.use('/api/issues', issueRoutes);

describe('Issue API Tests', () => {
    // Kullanıcılar
    let adminToken: string;
    let viewerToken: string;
    
    let adminUserId: string;
    let viewerUserId: string;

    // Veritabanı ID'leri
    let testOrgId: string;
    let testSiteId: string;
    let testProjectId: string;
    let testIssueId: string;
    let testFriendshipCode: string;

    beforeAll(async () => {
        const ts = Date.now();
        adminUserId = crypto.randomUUID();
        viewerUserId = crypto.randomUUID();
        testOrgId = crypto.randomUUID();
        testSiteId = crypto.randomUUID();
        testProjectId = crypto.randomUUID();
        testFriendshipCode = crypto.randomUUID();

        try {
            // 1. Kullanıcıları Oluştur
            await tenantPool.query(
                `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active, user_friendship_code) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [adminUserId, 'Admin User', `admin-${ts}@test.com`, 'hashed_password', true, crypto.randomUUID()]
            );

            await tenantPool.query(
                `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active, user_friendship_code) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [viewerUserId, 'Viewer User', `viewer-${ts}@test.com`, 'hashed_password', true, testFriendshipCode]
            );

            // 2. Zorunlu Organization Oluştur
            await tenantPool.query(
                `INSERT INTO organizations (org_id, org_check_id, org_name, slug) 
                 VALUES ($1, $2, $3, $4)`,
                [testOrgId, `chk-${ts}`, 'Test Org', `test-org-${ts}`]
            );

            // 3. Kullanıcıları Organizasyona Üye Yap
            await tenantPool.query(
                `INSERT INTO organization_memberships (org_id, user_id, role, membership_is_active) 
                 VALUES ($1, $2, 'admin', true), ($1, $3, 'viewer', true)`,
                [testOrgId, adminUserId, viewerUserId]
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
                 VALUES ($1, $2, 'admin', true), ($1, $3, 'viewer', true)`,
                [testSiteId, adminUserId, viewerUserId]
            );

            // 6. GÖREVLERİN BAĞLANACAĞI PROJEYİ OLUŞTUR
            await tenantPool.query(
                `INSERT INTO projects (project_id, site_id, project_check_id, project_name, project_key, board_type, is_private) 
                 VALUES ($1, $2, $3, 'Issue Test Project', 'ISSUE', 'scrum', false)`,
                [testProjectId, testSiteId, `pchk-${ts}`]
            );

            // 7. Proje Üyeliklerini Ata
            await tenantPool.query(
                `INSERT INTO project_memberships (project_id, user_id, role, membership_is_active) 
                 VALUES ($1, $2, 'project_admin', true), ($1, $3, 'viewer', true)`,
                [testProjectId, adminUserId, viewerUserId]
            );

            const secret = process.env.JWT_SECRET || 'test_secret_key_32_chars_long_for_jwt';
            adminToken = jwt.sign({ userId: adminUserId, tokenVersion: 1 }, secret);
            viewerToken = jwt.sign({ userId: viewerUserId, tokenVersion: 1 }, secret);

            log.info('Issue Test Setup Completed');
        } catch (error) {
            log.error('Setup failed', { error });
            throw error; // Testin devam etmemesi için hatayı fırlatın
        }
    });

    afterAll(async () => {
        try {
            // Cascade delete sayesinde organizasyon silinince site, projeler ve her şey temizlenir
            // Not: Sıralama önemlidir. Önce alt tabakıları silmek daha güvenlidir.
            await tenantPool.query('DELETE FROM project_memberships WHERE project_id = $1', [testProjectId]);
            await tenantPool.query('DELETE FROM projects WHERE site_id = $1', [testSiteId]);
            await tenantPool.query('DELETE FROM site_memberships WHERE org_id = $1', [testOrgId]);
            await tenantPool.query('DELETE FROM sites WHERE org_id = $1', [testOrgId]);
            await tenantPool.query('DELETE FROM organization_memberships WHERE org_id = $1', [testOrgId]);
            await tenantPool.query('DELETE FROM organizations WHERE org_id = $1', [testOrgId]);
            
            await tenantPool.query('DELETE FROM users WHERE user_id IN ($1, $2)', [adminUserId, viewerUserId]);
            
            log.info('Issue Test Cleanup Completed');
        } catch (e) {
            log.error('Cleanup failed', { e });
        }
        
        // Pool'u kapatın (Jest'in kapanmasını sağlar)
        await tenantPool.end();
    });

    // ==================== CREATE ====================
    describe('POST /api/issues', () => {
        it('should create a new issue with valid data (Admin/Contributor)', async () => {
            const response = await request(testApp) // <-- testApp kullanın
                .post('/api/issues')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Test Issue',
                    description: 'This is a test issue',
                    project_id: testProjectId,
                    priority: 'medium',
                    status: 'todo'
                });

            console.log('Create Issue Response:', response.status, response.body);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('issue_id');
            testIssueId = response.body.issue_id;
        });

        it('should return 400 validation error if project_id or title is missing', async () => {
            const response = await request(testApp)
                .post('/api/issues')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    description: 'Missing title and project_id'
                });

            expect(response.status).toBe(400);
        });

        it('should deny issue creation for Viewer role (403)', async () => {
            const response = await request(testApp)
                .post('/api/issues')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({
                    project_id: testProjectId,
                    title: 'Viewer Görev Açmaya Çalışıyor'
                });

            expect(response.status).toBe(403);
            expect(response.body.code).toBe(ErrorCodes.PROJECT_PERMISSION_DENIED);
        });
    });

    // ==================== READ ====================
    describe('GET /api/issues', () => {
        it('should list issues for project members', async () => {
            const response = await request(testApp)
                .get('/api/issues')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    project_id: testProjectId,
                    limit: 10,
                    offset: 0
                });

            console.log('List Issues Response:', response.status, response.body);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('GET /api/issues/:id', () => {
        it('should get issue details by id', async () => {
            // testIssueId'nin tanımlı olduğundan emin olun (Önceki testin başarılı olması gerekir)
            expect(testIssueId).toBeDefined();

            const response = await request(testApp)
                .get(`/api/issues/${testIssueId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ project_id: testProjectId });

            expect(response.status).toBe(200);
            expect(response.body.issue_id).toBe(testIssueId);
        });
    });

    // ==================== UPDATE ====================
    describe('PUT /api/issues/:id', () => {
        it('should allow authorized user to update issue', async () => {
            expect(testIssueId).toBeDefined();

            const response = await request(testApp)
                .put(`/api/issues/${testIssueId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    project_id: testProjectId,
                    title: 'Updated Title',
                    status: 'in_progress'
                });

            console.log('Update Issue Response:', response.status, response.body);

            expect(response.status).toBe(200);
        });
    });

    // ==================== INVITE (MEMBER TO ISSUE) ====================
    describe('POST /api/issues/:id/invite', () => {
        it('should successfully invite a project member to the issue', async () => {
            expect(testIssueId).toBeDefined();

            const response = await request(testApp)
                .post(`/api/issues/${testIssueId}/invite`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    friendship_code: testFriendshipCode,
                    org_id: testOrgId,
                    site_id: testSiteId,
                    project_id: testProjectId,
                    role: 'reviewer'
                });

            expect(response.status).toBe(201);
        });
    });

    // ==================== DELETE & RESTORE ====================
    describe('DELETE & POST Restore Operations', () => {
        it('should deny non-admin users from deleting the issue (403)', async () => {
            expect(testIssueId).toBeDefined();

            const response = await request(testApp)
                .delete(`/api/issues/${testIssueId}`)
                .set('Authorization', `Bearer ${viewerToken}`)
                .query({ project_id: testProjectId });

            expect(response.status).toBe(403);
        });

        it('should allow Project Admin to soft-delete the issue', async () => {
            expect(testIssueId).toBeDefined();

            const response = await request(testApp)
                .delete(`/api/issues/${testIssueId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    project_id: testProjectId
                });

            console.log('Delete Issue Response:', response.status, response.body);

            expect(response.status).toBe(200);
        });

        it('should allow Project Admin to restore the soft-deleted issue', async () => {
            expect(testIssueId).toBeDefined();

            const response = await request(testApp)
                .post(`/api/issues/${testIssueId}/restore`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ project_id: testProjectId });

            expect(response.status).toBe(200);
        });
    });
});
