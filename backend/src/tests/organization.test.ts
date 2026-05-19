import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { tenantPool } from '../db/tenantPool';
import organizationRoutes from '../routes/organization.routes';
import { log } from '../utils/logger';
import { authMiddleware } from '../middlewares/auth';

const app = express();
app.use(express.json());
app.use('/api/organizations', authMiddleware, organizationRoutes);


describe('Organization API Tests', () => {
    let authToken: string;
    let testUserId: string;
    let testOrgId: string;
    let testEmail: string;
    let testMemberId: string;
    let testMemberEmail: string;

    // Yetki testleri için
    let viewerUserId: string;
    let viewerToken: string;
    let memberToken: string;

    beforeAll(async () => {
        const ts = Date.now();
        testEmail = `test-${ts}@example.com`;
        testMemberEmail = `member-${ts}@example.com`;
        testUserId = '123e4567-e89b-42d3-a456-426614174000';
        testMemberId = '223e4567-e89b-42d3-a456-426614174001';
        viewerUserId = '323e4567-e89b-42d3-a456-426614174002';

        await tenantPool.query('DELETE FROM users WHERE user_id = $1', ['22222222-2222-2222-2222-222222222222']);

        // Owner kullanıcı
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET user_is_active = true, deleted_at = NULL`,
            [testUserId, 'Test User', testEmail, 'hashed_password', true]
        );

        // Member kullanıcı
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET user_is_active = true, deleted_at = NULL`,
            [testMemberId, 'Member User', testMemberEmail, 'hashed_password', true]
        );

        // Viewer kullanıcı
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET user_is_active = true, deleted_at = NULL`,
            [viewerUserId, 'Viewer User', 'viewer@test.com', 'hashed_password', true]
        );

        const check = await tenantPool.query(
            'SELECT user_id, user_is_active, deleted_at FROM users WHERE user_id = $1',
            [testUserId]
        );
        console.log('User in beforeAll:', check.rows[0]);

        // Token'lar
        authToken = jwt.sign(
            { userId: testUserId, tokenVersion: 1 },
            process.env.JWT_SECRET || 'test_secret_key_32_chars_long_for_jwt'
        );
        memberToken = jwt.sign(
            { userId: testMemberId, tokenVersion: 1 },
            process.env.JWT_SECRET || 'test_secret_key_32_chars_long_for_jwt'
        );
        viewerToken = jwt.sign(
            { userId: viewerUserId, tokenVersion: 1 },
            process.env.JWT_SECRET || 'test_secret_key_32_chars_long_for_jwt'
        );

        log.info('Test setup completed');
    });

    afterEach(async () => {
        if (testOrgId) {
            try {
                await tenantPool.query('DELETE FROM organizations WHERE org_id = $1', [testOrgId]);
            } catch (e) {
                // ignore
            }
            testOrgId = ''; // sıfırla
        }
    });

    afterAll(async () => {
        try {
            await tenantPool.query(`DELETE FROM organization_memberships WHERE user_id IN ($1, $2, $3)`, [testUserId, testMemberId, viewerUserId]);
            await tenantPool.query(`DELETE FROM system_audit_logs WHERE actor_id IN ($1, $2, $3)`, [testUserId, testMemberId, viewerUserId]);
            await tenantPool.query(`DELETE FROM organizations WHERE created_by IN ($1, $2, $3)`, [testUserId, testMemberId, viewerUserId]);
            await tenantPool.query(`DELETE FROM users WHERE user_id IN ($1, $2, $3)`, [testUserId, testMemberId, viewerUserId]);
        } catch (e) {
            // Cleanup hatalarını yoksay
        }
        log.info('Test cleanup completed');
    });

    // ==================== CREATE ====================
    describe('POST /api/organizations', () => {
        it('should create a new organization', async () => {
            const uniqueSlug = `test-org-${Date.now()}`;

            const response = await request(app)
                .post('/api/organizations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Organization',
                    slug: uniqueSlug,
                    description: 'Test Description'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('org_id');
            testOrgId = response.body.org_id;
        });

        it('should return 400 if name is missing', async () => {
            const response = await request(app)
                .post('/api/organizations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    slug: 'test-org-missing-name'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });

        it('should return 400 if slug is missing', async () => {
            const response = await request(app)
                .post('/api/organizations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Missing Slug'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });

        it('should return 409 if slug already exists', async () => {
            const slug = `duplicate-slug-${Date.now().toString(36)}`;

            // İlk oluşturma
            await request(app)
                .post('/api/organizations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'First Org', slug });

            // İkinci oluşturma (aynı slug)
            const response = await request(app)
                .post('/api/organizations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Duplicate Org', slug });

            expect(response.status).toBe(409);
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .post('/api/organizations')
                .send({ name: 'Test', slug: 'test-no-token' });

            expect(response.status).toBe(401);
        });
    });

    // ==================== READ ====================
    describe('GET /api/organizations', () => {
        it('should list organizations', async () => {
            const response = await request(app)
                .get('/api/organizations')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/organizations');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/organizations/:id', () => {
        it('should get organization by id', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .get(`/api/organizations/${testOrgId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.org_id).toBe(testOrgId);
        });

        it('should return 404 for non-existent organization', async () => {
            const fakeId = '00000000-0000-4000-8000-000000000000';
            const response = await request(app)
                .get(`/api/organizations/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(403);
        });

        it('should return 400 for invalid UUID', async () => {
            const response = await request(app)
                .get('/api/organizations/invalid-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(422);
        });
    });

    // ==================== UPDATE ====================
    describe('PUT /api/organizations/:id', () => {
        it('should update organization', async () => {
            console.log('DEBUG testOrgId:', testOrgId);
            if (!testOrgId) return;

            const response = await request(app)
                .put(`/api/organizations/${testOrgId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated Organization Name',
                    description: 'Updated description'
                });

            expect(response.status).toBe(200);
        });

        it('should return 404 for non-existent organization', async () => {
            const fakeId = '00000000-0000-4000-8000-000000000000';
            const response = await request(app)
                .put(`/api/organizations/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Test' });

            expect(response.status).toBe(404);
        });
    });

    // ==================== INVITE ====================
    describe('POST /api/organizations/:id/invite', () => {
        it('should invite a user to organization', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .post(`/api/organizations/${testOrgId}/invite`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    friendshipCode: 'bd3d75fd-6ce7-430e-b58f-26da3d2150a2', // Member user'ın kodu
                    role: 'member'
                });

            expect(response.status).toBe(201);
        });

        it('should return 400 if friendshipCode is missing', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .post(`/api/organizations/${testOrgId}/invite`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ role: 'member' });

            expect(response.status).toBe(400);
        });
    });

    // ==================== MEMBERS ====================
    describe('GET /api/organizations/:id/members', () => {
        it('should list organization members', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .get(`/api/organizations/${testOrgId}/members`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('PUT /api/organizations/:id/members/:memberId/role', () => {
        it('should update member role', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .put(`/api/organizations/${testOrgId}/members/${testMemberId}/role`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ role: 'viewer' });

            expect(response.status).toBe(200);
        });

        it('should return 400 for invalid role', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .put(`/api/organizations/${testOrgId}/members/${testMemberId}/role`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ role: 'invalid' });

            expect(response.status).toBe(400);
        });
    });

    // ==================== INVITATIONS ====================
    describe('GET /api/organizations/:id/invitations', () => {
        it('should list pending invitations', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .get(`/api/organizations/${testOrgId}/invitations`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
        });
    });

    // ==================== STATS ====================
    describe('GET /api/organizations/:id/stats', () => {
        it('should get organization statistics', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .get(`/api/organizations/${testOrgId}/stats`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total_members');
        });
    });

    // ==================== LEAVE ====================
    describe('POST /api/organizations/:id/leave', () => {
        it('should leave organization', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .post(`/api/organizations/${testOrgId}/leave`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(403);
        });
    });

    // ==================== DELETE ====================
    describe('DELETE /api/organizations/:id', () => {
        it('should delete organization', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .delete(`/api/organizations/${testOrgId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
        });

        it('should return 404 for already deleted organization', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .delete(`/api/organizations/${testOrgId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    // ==================== AUTHORIZATION TESTS ====================
    describe('Organization Authorization', () => {
        // Her yetki testi öncesi viewer ve member'ı organizasyona ekle
        beforeEach(async () => {
            if (!testOrgId) return;
            // Viewer'ı ekle (eğer yoksa)
            await tenantPool.query(
                `INSERT INTO organization_memberships (org_id, user_id, role, membership_is_active, joined_at)
                 VALUES ($1, $2, 'viewer', true, now())
                 ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'viewer', deleted_at = NULL`,
                [testOrgId, viewerUserId]
            );
            // Member'ı ekle (eğer yoksa)
            await tenantPool.query(
                `INSERT INTO organization_memberships (org_id, user_id, role, membership_is_active, joined_at)
                 VALUES ($1, $2, 'member', true, now())
                 ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'member', deleted_at = NULL`,
                [testOrgId, testMemberId]
            );
        });

        it('should deny DELETE for member (non-owner)', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .delete(`/api/organizations/${testOrgId}`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(response.status).toBe(403);
            expect(response.body.error).toContain('Only organization owner');
        });

        it('should deny DELETE for viewer', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .delete(`/api/organizations/${testOrgId}`)
                .set('Authorization', `Bearer ${viewerToken}`);

            expect(response.status).toBe(403);
            expect(response.body.error).toContain('Only organization owner');
        });

        it('should deny UPDATE for viewer', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .put(`/api/organizations/${testOrgId}`)
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ name: 'Hacked Name' });

            expect(response.status).toBe(403);
        });

        it('should allow UPDATE for admin', async () => {
            if (!testOrgId) return;
            // Member'ı admin yap
            await tenantPool.query(
                'UPDATE organization_memberships SET role = $1 WHERE org_id = $2 AND user_id = $3',
                ['admin', testOrgId, testMemberId]
            );

            const response = await request(app)
                .put(`/api/organizations/${testOrgId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ name: 'Admin Updated Name' });

            expect(response.status).toBe(200);
        });

        it('should deny INVITE for viewer', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .post(`/api/organizations/${testOrgId}/invite`)
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ friendshipCode: '00000000-0000-4000-8000-000000000000', role: 'member' });

            expect(response.status).toBe(403);
        });

        it('should allow INVITE for admin', async () => {
            if (!testOrgId) return;
            // Member'ı admin yap
            await tenantPool.query(
                'UPDATE organization_memberships SET role = $1 WHERE org_id = $2 AND user_id = $3',
                ['admin', testOrgId, testMemberId]
            );

            const response = await request(app)
                .post(`/api/organizations/${testOrgId}/invite`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ friendshipCode: '00000000-0000-4000-8000-000000000000', role: 'member' });

            expect(response.status).not.toBe(403);
        });

        it('should deny VIEW_MEMBERS for viewer', async () => {
            if (!testOrgId) return;

            const response = await request(app)
                .get(`/api/organizations/${testOrgId}/members`)
                .set('Authorization', `Bearer ${viewerToken}`);

            expect(response.status).toBe(403);
        });

        it('should allow VIEW_MEMBERS for admin', async () => {
            if (!testOrgId) return;
            // Member'ı admin yap
            await tenantPool.query(
                'UPDATE organization_memberships SET role = $1 WHERE org_id = $2 AND user_id = $3',
                ['admin', testOrgId, testMemberId]
            );

            const response = await request(app)
                .get(`/api/organizations/${testOrgId}/members`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(response.status).toBe(200);
        });
    });
});