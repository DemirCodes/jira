import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { tenantPool } from '../db/tenantPool';
import issueRoutes from '../routes/issue.routes';
import { log } from '../utils/logger';
import { authMiddleware } from '../middlewares/auth';

const testApp = express();
testApp.use(express.json());
testApp.use(authMiddleware);
testApp.use('/api/issues', issueRoutes);

describe('Issue API Tests', () => {
    let adminToken: string;
    let viewerToken: string;

    let adminUserId: string;
    let viewerUserId: string;

    let testOrgId: string;
    let testSiteId: string;
    let testProjectId: string;
    let testIssueId: string;

    let testFriendshipCode: string;

    beforeAll(async () => {
        const ts = Date.now();

        adminUserId        = crypto.randomUUID();
        viewerUserId       = crypto.randomUUID();
        testOrgId          = crypto.randomUUID();
        testSiteId         = crypto.randomUUID();
        testProjectId      = crypto.randomUUID();
        testFriendshipCode = crypto.randomUUID();

        try {
            await tenantPool.query(
                "SELECT set_config('app.current_user_id', $1, true)",
                [adminUserId]
            );

            // ── USERS ────────────────────────────────────────────────────────
            await tenantPool.query(
                `INSERT INTO users
                    (user_id, user_name, user_email, user_password, user_is_active, user_friendship_code)
                 VALUES
                    ($1, 'Admin User',  $3, 'hashed_password', true, $5),
                    ($2, 'Viewer User', $4, 'hashed_password', true, $6)`,
                [
                    adminUserId,  viewerUserId,
                    `admin-${ts}@test.com`, `viewer-${ts}@test.com`,
                    crypto.randomUUID(), testFriendshipCode,
                ]
            );

            // ── ORGANIZATION ─────────────────────────────────────────────────
            await tenantPool.query(
                `INSERT INTO organizations (org_id, org_check_id, org_name, slug)
                 VALUES ($1, $2, 'Test Org', $3)`,
                [testOrgId, `chk-${ts}`, `test-org-${ts}`]
            );

            await tenantPool.query(
                `INSERT INTO organization_memberships
                    (org_id, user_id, role, membership_is_active)
                 VALUES
                    ($1, $2, 'admin',  true),
                    ($1, $3, 'member', true)`,
                [testOrgId, adminUserId, viewerUserId]
            );

            // ── SITE ─────────────────────────────────────────────────────────
            await tenantPool.query(
                `INSERT INTO sites (site_id, org_id, site_name, site_slug)
                 VALUES ($1, $2, 'Test Site', $3)`,
                [testSiteId, testOrgId, `test-site-${ts}`]
            );

            // 🎯 DÜZELTME: site_role enum'unda 'member' yok, 'viewer' kullanıyoruz
            await tenantPool.query(
                `INSERT INTO site_memberships
                    (site_id, user_id, role, membership_is_active)
                 VALUES
                    ($1, $2, 'admin',  true),
                    ($1, $3, 'viewer', true)`,
                [testSiteId, adminUserId, viewerUserId]
            );

            // ── PROJECT ──────────────────────────────────────────────────────
            await tenantPool.query(
                `INSERT INTO projects
                    (project_id, site_id, project_check_id, project_name, project_key, board_type, is_private)
                 VALUES ($1, $2, $3, 'Issue Test Project', 'ISSUE', 'scrum', false)`,
                [testProjectId, testSiteId, `pchk-${ts}`]
            );

            // 🎯 DÜZELTME: viewerUser'ı 'contributor' yapıyoruz
            // 'contributor' → sadece 'watcher' issue rolünü alabilir (trigger kuralı)
            await tenantPool.query(
                `INSERT INTO project_memberships
                    (project_id, user_id, role, membership_is_active)
                 VALUES
                    ($1, $2, 'project_admin', true),
                    ($1, $3, 'contributor',   true)`,
                [testProjectId, adminUserId, viewerUserId]
            );

            // ── JWT ──────────────────────────────────────────────────────────
            const secret = process.env.JWT_SECRET ?? 'test_secret_key_32_chars_long_for_jwt';
            adminToken  = jwt.sign({ userId: adminUserId,  tokenVersion: 1 }, secret);
            viewerToken = jwt.sign({ userId: viewerUserId, tokenVersion: 1 }, secret);

        } catch (error) {
            log.error('Test setup failed', { error });
            throw error;
        }
    });

    afterAll(async () => {
        try {
            await tenantPool.query(
                "SELECT set_config('app.current_user_id', $1, true)",
                [adminUserId]
            );

            await tenantPool.query('DELETE FROM issue_memberships');
            await tenantPool.query('DELETE FROM issues');
            await tenantPool.query(
                'DELETE FROM project_memberships WHERE project_id = $1',
                [testProjectId]
            );
            await tenantPool.query(
                'DELETE FROM projects WHERE project_id = $1',
                [testProjectId]
            );
            await tenantPool.query(
                'DELETE FROM site_memberships WHERE site_id = $1',
                [testSiteId]
            );
            await tenantPool.query(
                'DELETE FROM sites WHERE site_id = $1',
                [testSiteId]
            );
            await tenantPool.query(
                'DELETE FROM organization_memberships WHERE org_id = $1',
                [testOrgId]
            );
            await tenantPool.query(
                'DELETE FROM organizations WHERE org_id = $1',
                [testOrgId]
            );
            await tenantPool.query(
                'DELETE FROM users WHERE user_id IN ($1, $2)',
                [adminUserId, viewerUserId]
            );

        } catch (e) {
            log.error('Test cleanup failed', { e });
        }

        tenantPool.removeAllListeners('remove');
        await tenantPool.end();
    });

    // ═══════════════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════════════
    describe('POST /api/issues', () => {
        it('should create a new issue (project_admin)', async () => {
            const res = await request(testApp)
                .post('/api/issues')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title:      'Test Issue',
                    description:'This is a test issue',
                    project_id: testProjectId,
                    priority:   'medium',
                    status:     'todo',
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('issue_id');
            testIssueId = res.body.issue_id;
        });

        it('should return 400 when title or project_id is missing', async () => {
            const res = await request(testApp)
                .post('/api/issues')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'Missing title and project_id' });

            expect(res.status).toBe(400);
        });

        it('should return 403 when viewer (contributor) tries to create issue', async () => {
            const res = await request(testApp)
                .post('/api/issues')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({
                    project_id: testProjectId,
                    title:      'Viewer Creates Issue',
                });

            expect(res.status).toBe(403);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // READ
    // ═══════════════════════════════════════════════════════════════
    describe('GET /api/issues', () => {
        it('should list issues for project members', async () => {
            const res = await request(testApp)
                .get('/api/issues')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ project_id: testProjectId });

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('GET /api/issues/:id', () => {
        it('should return issue details by id', async () => {
            const res = await request(testApp)
                .get(`/api/issues/${testIssueId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ project_id: testProjectId });

            expect(res.status).toBe(200);
            expect(res.body.issue_id).toBe(testIssueId);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════════════
    describe('PUT /api/issues/:id', () => {
        it('should allow project_admin to update issue', async () => {
            const res = await request(testApp)
                .put(`/api/issues/${testIssueId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ project_id: testProjectId, title: 'Updated Title' });

            expect(res.status).toBe(200);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // INVITE
    // ═══════════════════════════════════════════════════════════════
    describe('POST /api/issues/:id/invite', () => {
        it('should invite a contributor-level member as watcher', async () => {
            const res = await request(testApp)
                .post(`/api/issues/${testIssueId}/invite`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    friendship_code: testFriendshipCode,
                    org_id:          testOrgId,
                    site_id:         testSiteId,
                    project_id:      testProjectId,
                    role:            'watcher',
                });

            expect(res.status).toBe(201);
        });

        it('should return 400 when friendship_code is missing', async () => {
            const res = await request(testApp)
                .post(`/api/issues/${testIssueId}/invite`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    org_id:     testOrgId,
                    site_id:    testSiteId,
                    project_id: testProjectId,
                    role:       'watcher',
                });

            expect(res.status).toBe(400);
        });

        it('should return 403 when viewer tries to assign non-watcher role', async () => {
            const res = await request(testApp)
                .post(`/api/issues/${testIssueId}/invite`)
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({
                    friendship_code: testFriendshipCode,
                    org_id:          testOrgId,
                    site_id:         testSiteId,
                    project_id:      testProjectId,
                    role:            'contributor',
                });

            expect(res.status).toBe(403);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // DELETE & RESTORE
    // ═══════════════════════════════════════════════════════════════
    describe('DELETE & POST Restore Operations', () => {
        it('should return 403 when viewer tries to delete issue', async () => {
            const res = await request(testApp)
                .delete(`/api/issues/${testIssueId}`)
                .set('Authorization', `Bearer ${viewerToken}`)
                .query({ project_id: testProjectId });

            expect(res.status).toBe(403);
        });

        it('should allow project_admin to soft-delete issue', async () => {
            const res = await request(testApp)
                .delete(`/api/issues/${testIssueId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ project_id: testProjectId });

            expect(res.status).toBe(200);
        });

        it('should allow project_admin to restore soft-deleted issue', async () => {
            const res = await request(testApp)
                .post(`/api/issues/${testIssueId}/restore`)
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ project_id: testProjectId });

            expect(res.status).toBe(200);
        });
    });
});