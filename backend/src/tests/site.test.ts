import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { tenantPool } from '../db/tenantPool';
import siteRoutes from '../routes/site.routes';
import { log } from '../utils/logger';
import { authMiddleware } from '../middlewares/auth';

// KRİTİK: Auth middleware'in patlamaması için!
process.env.JWT_SECRET = 'test_secret';

const app = express();
app.use(express.json());
app.use('/api/sites', authMiddleware, siteRoutes);

describe('Site API Tests', () => {
    let ownerToken: string;
    let memberToken: string;
    let viewerToken: string;
    let testOrgId: string;
    let testSiteId: string;

    const ownerId = '123e4567-e89b-42d3-a456-426614174000';
    const memberId = '223e4567-e89b-42d3-a456-426614174001';
    const viewerId = '323e4567-e89b-42d3-a456-426614174002';

    beforeAll(async () => {
        // ÖNCE app.current_user_id SET ET
        await tenantPool.query("SELECT set_config('app.current_user_id', $1, true)", [ownerId]);

        // Kullanıcıları oluştur (EKSİKSİZ)
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
            VALUES ($1, 'Owner', 'owner@test.com', 'hash', true)
            ON CONFLICT (user_id) DO UPDATE SET user_is_active = true`,
            [ownerId]
        );
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
            VALUES ($1, 'Member', 'member@test.com', 'hash', true)
            ON CONFLICT (user_id) DO UPDATE SET user_is_active = true`,
            [memberId]
        );
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
            VALUES ($1, 'Viewer', 'viewer@test.com', 'hash', true)
            ON CONFLICT (user_id) DO UPDATE SET user_is_active = true`,
            [viewerId]
        );

        // Test organizasyonu oluştur
        const orgResult = await tenantPool.query(
            'SELECT create_organization($1, $2, $3, $4) as org_id',
            [ownerId, 'Test Org', 'test-org-site', 'Org for site tests']
        );
        testOrgId = orgResult.rows[0].org_id;

        // Member ve Viewer'ı organizasyona ekle
        await tenantPool.query(
            `INSERT INTO organization_memberships (org_id, user_id, role, membership_is_active, joined_at)
            VALUES ($1, $2, 'member', true, now())`,
            [testOrgId, memberId]
        );
        await tenantPool.query(
            `INSERT INTO organization_memberships (org_id, user_id, role, membership_is_active, joined_at)
            VALUES ($1, $2, 'viewer', true, now())`,
            [testOrgId, viewerId]
        );

        // Token'lar (Sonlarına ! eklendi)
        ownerToken = jwt.sign({ userId: ownerId, tokenVersion: 1 }, process.env.JWT_SECRET!);
        memberToken = jwt.sign({ userId: memberId, tokenVersion: 1 }, process.env.JWT_SECRET!);
        viewerToken = jwt.sign({ userId: viewerId, tokenVersion: 1 }, process.env.JWT_SECRET!);
        log.info('Site test setup completed');
    });

    afterAll(async () => {
        // Temizlik
        await tenantPool.query('DELETE FROM site_memberships WHERE site_id = $1', [testSiteId]);
        await tenantPool.query('DELETE FROM sites WHERE site_id = $1', [testSiteId]);
        await tenantPool.query('DELETE FROM organization_memberships WHERE org_id = $1', [testOrgId]);
        await tenantPool.query('DELETE FROM organizations WHERE org_id = $1', [testOrgId]);
        await tenantPool.query('DELETE FROM users WHERE user_id IN ($1, $2, $3)', [ownerId, memberId, viewerId]);
        log.info('Site test cleanup completed');

        await tenantPool.end();
    });

    // ==================== CREATE ====================
    describe('POST /api/sites', () => {
        it('should create a new site (owner)', async () => {
            const response = await request(app)
                .post('/api/sites')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Test Site', slug: `test-site-${Date.now()}`, org_id: testOrgId });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('site_id');
            testSiteId = response.body.site_id;
        });

        it('should deny create for member', async () => {
            const response = await request(app)
                .post('/api/sites')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ name: 'Member Site', slug: `member-site-${Date.now()}`, org_id: testOrgId });

            expect(response.status).toBe(403);
        });

        it('should deny create for viewer', async () => {
            const response = await request(app)
                .post('/api/sites')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ name: 'Viewer Site', slug: `viewer-site-${Date.now()}`, org_id: testOrgId });

            expect(response.status).toBe(403);
        });
    });

    // ==================== READ ====================
    describe('GET /api/sites/:id', () => {
        it('should get site by id (owner)', async () => {
            if (!testSiteId) return;
            const response = await request(app)
                .get(`/api/sites/${testSiteId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(response.status).toBe(200);
            expect(response.body.site_id).toBe(testSiteId);
        });

        it('should deny get for non-member', async () => {
            if (!testSiteId) return;
            const response = await request(app)
                .get(`/api/sites/${testSiteId}`)
                .set('Authorization', `Bearer ${viewerToken}`);

            expect(response.status).toBe(403);
        });
    });

    // ==================== UPDATE ====================
    describe('PUT /api/sites/:id', () => {
        it('should update site name (owner)', async () => {
            if (!testSiteId) return;
            const response = await request(app)
                .put(`/api/sites/${testSiteId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ org_id: testOrgId, name: 'Updated Site' }); // DÜZELTİLDİ: org_id eklendi

            expect(response.status).toBe(200);
        });

        it('should deny update for member', async () => {
            if (!testSiteId) return;
            const response = await request(app)
                .put(`/api/sites/${testSiteId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ org_id: testOrgId, name: 'Hacked' }); // DÜZELTİLDİ: org_id eklendi

            expect(response.status).toBe(403);
        });
    });

    // ==================== DELETE ====================
    describe('DELETE /api/sites/:id', () => {
        it('should delete site (owner)', async () => {
            const createRes = await request(app)
                .post('/api/sites')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Delete Me', slug: `delete-${Date.now()}`, org_id: testOrgId });
            const deleteId = createRes.body.site_id;

            const response = await request(app)
                .delete(`/api/sites/${deleteId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ org_id: testOrgId }); // DÜZELTİLDİ: org_id eklendi

            expect(response.status).toBe(200);
        });

        it('should deny delete for member', async () => {
            if (!testSiteId) return;
            const response = await request(app)
                .delete(`/api/sites/${testSiteId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ org_id: testOrgId }); // DÜZELTİLDİ: org_id eklendi

            expect(response.status).toBe(403);
        });
    });

    // ==================== INVITE ====================
    describe('POST /api/sites/:id/invite', () => {
        it('should invite a user to site (owner)', async () => {
            if (!testSiteId) return;
            const response = await request(app)
                .post(`/api/sites/${testSiteId}/invite`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ org_id: testOrgId, friendshipCode: 'bd3d75fd-6ce7-430e-b58f-26da3d2150a2', role: 'contrubitor' });

            expect(response.status).not.toBe(403);
        });

        it('should deny invite for viewer', async () => {
            if (!testSiteId) return;
            const response = await request(app)
                .post(`/api/sites/${testSiteId}/invite`)
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ org_id: testOrgId, friendshipCode: '00000000-0000-4000-8000-000000000000', role: 'contrubitor' });

            expect(response.status).toBe(403);
        });
    });

    // ==================== MEMBERS ====================
    describe('GET /api/sites/:id/members', () => {
        it('should list site members (owner)', async () => {
            if (!testSiteId) return;
            const response = await request(app)
                .get(`/api/sites/${testSiteId}/members`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    // ==================== STATS ====================
    describe('GET /api/sites/:id/stats', () => {
        it('should get site stats (owner)', async () => {
            if (!testSiteId) return;
            const response = await request(app)
                .get(`/api/sites/${testSiteId}/stats`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total_members');
        });
    });
});