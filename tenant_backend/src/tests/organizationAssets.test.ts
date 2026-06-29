import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { tenantPool } from '../db/tenantPool';
import orgRoutes from '../routes/organization.routes'; 
import { log } from '../utils/logger';
import { authMiddleware } from '../middlewares/auth';
import { ErrorCodes } from '../utils/errorCodes';

const app = express();
app.use(express.json());
app.use('/api/organizations', authMiddleware, orgRoutes);

describe('Organization Assets API Tests', () => {
    let adminToken: string;
    let memberToken: string;
    let viewerToken: string;
    
    let adminUserId: string;
    let memberUserId: string;
    let viewerUserId: string;

    let testOrgId: string;
    let testAssetId: string;

    beforeAll(async () => {
        const ts = Date.now();
        adminUserId = crypto.randomUUID();
        memberUserId = crypto.randomUUID();
        viewerUserId = crypto.randomUUID();
        testOrgId = crypto.randomUUID();

        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active, user_friendship_code) 
             VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $4, $5, $10), ($11, $12, $13, $4, $5, $14)`,
            [
                adminUserId, 'Org Admin User', `admin-${ts}@test.com`, 'hashed_password', true, crypto.randomUUID(),
                memberUserId, 'Org Member User', `member-${ts}@test.com`, crypto.randomUUID(),
                viewerUserId, 'Org Viewer User', `viewer-${ts}@test.com`, crypto.randomUUID()
            ]
        );

        await tenantPool.query(
            `INSERT INTO organizations (org_id, org_check_id, org_name, slug) 
             VALUES ($1, $2, $3, $4)`,
            [testOrgId, `ochk-${ts}`, 'Asset Test Org', `asset-org-${ts}`]
        );

        await tenantPool.query(
            `INSERT INTO organization_memberships (org_id, user_id, role, membership_is_active) 
             VALUES ($1, $2, 'admin', true), ($1, $3, 'member', true), ($1, $4, 'viewer', true)`,
            [testOrgId, adminUserId, memberUserId, viewerUserId]
        );

        const secret = process.env.JWT_SECRET || 'test_secret_key_32_chars_long_for_jwt';
        adminToken = jwt.sign({ userId: adminUserId, tokenVersion: 1 }, secret);
        memberToken = jwt.sign({ userId: memberUserId, tokenVersion: 1 }, secret);
        viewerToken = jwt.sign({ userId: viewerUserId, tokenVersion: 1 }, secret);

        log.info('Org Asset Test Setup Completed');
    });

    afterAll(async () => {
        try {
            await tenantPool.query('DELETE FROM organizations WHERE org_id = $1', [testOrgId]);
            await tenantPool.query('DELETE FROM users WHERE user_id IN ($1, $2, $3)', [adminUserId, memberUserId, viewerUserId]);
        } catch (e) {
            log.error('Org Asset Cleanup failed', { e });
        }
        await tenantPool.end();
        log.info('Org Asset Test Cleanup Completed');
    });

    describe('POST /api/organizations/:id/assets', () => {
        it('should allow Admin to upload a valid asset (Happy Path)', async () => {
            const validPngBuffer = Buffer.from('89504e470000000d49484452000000010000000108060000001f15c489', 'hex');

            const response = await request(app)
                .post(`/api/organizations/${testOrgId}/assets`)
                .set('Authorization', `Bearer ${adminToken}`)
                .field('asset_type', 'organization_logo') 
                .attach('file', validPngBuffer, 'company_logo.png');

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('org_asset_id');
            testAssetId = response.body.org_asset_id; 
        });

        it('should block asset upload if a hacker tries MIME Spoofing (422)', async () => {
            const fakePngBuffer = Buffer.from('console.log("hacked")', 'utf8');

            const response = await request(app)
                .post(`/api/organizations/${testOrgId}/assets`)
                .set('Authorization', `Bearer ${adminToken}`)
                .field('asset_type', 'organization_logo') 
                .attach('file', fakePngBuffer, 'malicious.png');

            expect(response.status).toBe(422);
            expect(response.body.code).toBe(ErrorCodes.VALIDATION_FAILED);
        });

        it('should deny asset upload for Member role (403)', async () => {
            const validPngBuffer = Buffer.from('89504e470000000d49484452', 'hex');

            const response = await request(app)
                .post(`/api/organizations/${testOrgId}/assets`)
                .set('Authorization', `Bearer ${memberToken}`) 
                .field('asset_type', 'organization_logo') 
                .attach('file', validPngBuffer, 'document.png');

            expect(response.status).toBe(403);
            expect(response.body.code).toBe(ErrorCodes.PROJECT_PERMISSION_DENIED);
        });
    });

    describe('GET /api/organizations/:id/assets', () => {
        it('should allow active members (including Viewer) to list assets', async () => {
            const response = await request(app)
                .get(`/api/organizations/${testOrgId}/assets`)
                .set('Authorization', `Bearer ${viewerToken}`); 

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });

    describe('DELETE /api/organizations/:id/assets/:assetId', () => {
        it('should deny Member from deleting the organization asset (403)', async () => {
            const response = await request(app)
                .delete(`/api/organizations/${testOrgId}/assets/${testAssetId}`)
                .set('Authorization', `Bearer ${memberToken}`); 

            expect(response.status).toBe(403);
            expect(response.body.code).toBe(ErrorCodes.PROJECT_PERMISSION_DENIED);
        });

        it('should allow Admin to soft-delete the organization asset', async () => {
            const response = await request(app)
                .delete(`/api/organizations/${testOrgId}/assets/${testAssetId}`)
                .set('Authorization', `Bearer ${adminToken}`); 

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('successfully');
        });
    });
});