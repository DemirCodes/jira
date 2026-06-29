"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tenantPool_1 = require("../db/tenantPool");
const site_routes_1 = __importDefault(require("../routes/site.routes"));
const logger_1 = require("../utils/logger");
const auth_1 = require("../middlewares/auth");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/sites', auth_1.authMiddleware, site_routes_1.default);
describe('Site API Tests', () => {
    let ownerToken;
    let memberToken;
    let viewerToken;
    let testOrgId;
    let testSiteId;
    const ownerId = '123e4567-e89b-42d3-a456-426614174000';
    const memberId = '223e4567-e89b-42d3-a456-426614174001';
    const viewerId = '323e4567-e89b-42d3-a456-426614174002';
    beforeAll(async () => {
        // ÖNCE app.current_user_id SET ET
        await tenantPool_1.tenantPool.query("SELECT set_config('app.current_user_id', $1, true)", [ownerId]);
        // Kullanıcıları oluştur
        await tenantPool_1.tenantPool.query(`INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
            VALUES ($1, 'Owner', 'owner@test.com', 'hash', true)
            ON CONFLICT (user_id) DO UPDATE SET user_is_active = true`, [ownerId]);
        await tenantPool_1.tenantPool.query(`INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
            VALUES ($1, 'Member', 'member@test.com', 'hash', true)
            ON CONFLICT (user_id) DO UPDATE SET user_is_active = true`, [memberId]);
        await tenantPool_1.tenantPool.query(`INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
            VALUES ($1, 'Viewer', 'viewer@test.com', 'hash', true)
            ON CONFLICT (user_id) DO UPDATE SET user_is_active = true`, [viewerId]);
        // Test organizasyonu oluştur (artık auth_current_user_id() çalışacak)
        const orgResult = await tenantPool_1.tenantPool.query('SELECT create_organization($1, $2, $3, $4) as org_id', [ownerId, 'Test Org', 'test-org-site', 'Org for site tests']);
        testOrgId = orgResult.rows[0].org_id;
        // Member ve Viewer'ı organizasyona ekle
        await tenantPool_1.tenantPool.query(`INSERT INTO organization_memberships (org_id, user_id, role, membership_is_active, joined_at)
            VALUES ($1, $2, 'member', true, now())`, [testOrgId, memberId]);
        await tenantPool_1.tenantPool.query(`INSERT INTO organization_memberships (org_id, user_id, role, membership_is_active, joined_at)
            VALUES ($1, $2, 'viewer', true, now())`, [testOrgId, viewerId]);
        // Token'lar
        ownerToken = jsonwebtoken_1.default.sign({ userId: ownerId, tokenVersion: 1 }, process.env.JWT_SECRET || 'test_secret');
        memberToken = jsonwebtoken_1.default.sign({ userId: memberId, tokenVersion: 1 }, process.env.JWT_SECRET || 'test_secret');
        viewerToken = jsonwebtoken_1.default.sign({ userId: viewerId, tokenVersion: 1 }, process.env.JWT_SECRET || 'test_secret');
        logger_1.log.info('Site test setup completed');
    });
    afterAll(async () => {
        // Temizlik
        await tenantPool_1.tenantPool.query('DELETE FROM site_memberships WHERE site_id = $1', [testSiteId]);
        await tenantPool_1.tenantPool.query('DELETE FROM sites WHERE site_id = $1', [testSiteId]);
        await tenantPool_1.tenantPool.query('DELETE FROM organization_memberships WHERE org_id = $1', [testOrgId]);
        await tenantPool_1.tenantPool.query('DELETE FROM organizations WHERE org_id = $1', [testOrgId]);
        await tenantPool_1.tenantPool.query('DELETE FROM users WHERE user_id IN ($1, $2, $3)', [ownerId, memberId, viewerId]);
        logger_1.log.info('Site test cleanup completed');
    });
    // ==================== CREATE ====================
    describe('POST /api/sites', () => {
        it('should create a new site (owner)', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/sites')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Test Site', slug: `test-site-${Date.now()}`, org_id: testOrgId });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('site_id');
            testSiteId = response.body.site_id;
        });
        it('should deny create for member', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/sites')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ name: 'Member Site', slug: `member-site-${Date.now()}`, org_id: testOrgId });
            expect(response.status).toBe(403);
        });
        it('should deny create for viewer', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/sites')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ name: 'Viewer Site', slug: `viewer-site-${Date.now()}`, org_id: testOrgId });
            expect(response.status).toBe(403);
        });
    });
    // ==================== READ ====================
    describe('GET /api/sites/:id', () => {
        it('should get site by id (owner)', async () => {
            if (!testSiteId)
                return;
            const response = await (0, supertest_1.default)(app)
                .get(`/api/sites/${testSiteId}`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(response.status).toBe(200);
            expect(response.body.site_id).toBe(testSiteId);
        });
        it('should deny get for non-member', async () => {
            // Viewer is member of org but not site yet, so should be denied by requireSiteMember
            if (!testSiteId)
                return;
            const response = await (0, supertest_1.default)(app)
                .get(`/api/sites/${testSiteId}`)
                .set('Authorization', `Bearer ${viewerToken}`);
            expect(response.status).toBe(403);
        });
    });
    // ==================== UPDATE ====================
    describe('PUT /api/sites/:id', () => {
        it('should update site name (owner)', async () => {
            if (!testSiteId)
                return;
            const response = await (0, supertest_1.default)(app)
                .put(`/api/sites/${testSiteId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Updated Site' });
            expect(response.status).toBe(200);
        });
        it('should deny update for member', async () => {
            if (!testSiteId)
                return;
            const response = await (0, supertest_1.default)(app)
                .put(`/api/sites/${testSiteId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ name: 'Hacked' });
            expect(response.status).toBe(403);
        });
    });
    // ==================== DELETE ====================
    describe('DELETE /api/sites/:id', () => {
        it('should delete site (owner)', async () => {
            // Create a new site to delete
            const createRes = await (0, supertest_1.default)(app)
                .post('/api/sites')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Delete Me', slug: `delete-${Date.now()}`, org_id: testOrgId });
            const deleteId = createRes.body.site_id;
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/sites/${deleteId}`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(response.status).toBe(200);
        });
        it('should deny delete for member', async () => {
            if (!testSiteId)
                return;
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/sites/${testSiteId}`)
                .set('Authorization', `Bearer ${memberToken}`);
            expect(response.status).toBe(403);
        });
    });
    // ==================== INVITE ====================
    describe('POST /api/sites/:id/invite', () => {
        it('should invite a user to site (owner)', async () => {
            if (!testSiteId)
                return;
            const response = await (0, supertest_1.default)(app)
                .post(`/api/sites/${testSiteId}/invite`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ org_id: testOrgId, friendshipCode: 'bd3d75fd-6ce7-430e-b58f-26da3d2150a2', role: 'contrubitor' });
            // It might succeed or return 201 (depending on if that user exists), but not 403
            expect(response.status).not.toBe(403);
        });
        it('should deny invite for viewer', async () => {
            if (!testSiteId)
                return;
            const response = await (0, supertest_1.default)(app)
                .post(`/api/sites/${testSiteId}/invite`)
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ org_id: testOrgId, friendshipCode: '00000000-0000-4000-8000-000000000000', role: 'contrubitor' });
            expect(response.status).toBe(403);
        });
    });
    // ==================== MEMBERS ====================
    describe('GET /api/sites/:id/members', () => {
        it('should list site members (owner)', async () => {
            if (!testSiteId)
                return;
            const response = await (0, supertest_1.default)(app)
                .get(`/api/sites/${testSiteId}/members`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
    // ==================== STATS ====================
    describe('GET /api/sites/:id/stats', () => {
        it('should get site stats (owner)', async () => {
            if (!testSiteId)
                return;
            const response = await (0, supertest_1.default)(app)
                .get(`/api/sites/${testSiteId}/stats`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total_members');
        });
    });
});
//# sourceMappingURL=site.test.js.map