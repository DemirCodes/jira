import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { tenantPool } from '../db/tenantPool';
import organizationRoutes from '../routes/organization.routes';
import { log } from '../utils/logger';

const app = express();
app.use(express.json());
app.use('/api/organizations', organizationRoutes);

describe('Organization API Tests', () => {
    let authToken: string;
    let testUserId: string;
    let testEmail: string;

    beforeAll(async () => {
        testEmail = `test-${Date.now()}@example.com`;
        testUserId = '123e4567-e89b-42d3-a456-426614174000';
        
        // Önce var olan verileri temizle
        await tenantPool.query(`DELETE FROM organization_memberships WHERE user_id = $1`, [testUserId]);
        await tenantPool.query(`DELETE FROM organizations WHERE created_by = $1`, [testUserId]);
        await tenantPool.query(`DELETE FROM users WHERE user_id = $1`, [testUserId]);
        
        // Kullanıcı oluştur (token_version olmadan)
        await tenantPool.query(
            `INSERT INTO users (user_id, user_name, user_email, user_password, user_is_active) 
             VALUES ($1, $2, $3, $4, $5)`,
            [testUserId, 'Test User', testEmail, 'hashed_password', true]
        );
        
        // Token oluştur (tokenVersion ile birlikte)
        authToken = jwt.sign(
            { 
                userId: testUserId,
                tokenVersion: 1,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600
            },
            process.env.JWT_SECRET || 'test_secret_key_32_chars_long_for_jwt'
        );
        
        log.info('Test setup completed', { userId: testUserId });
    });

    afterAll(async () => {
        await tenantPool.query(`DELETE FROM organization_memberships WHERE user_id = $1`, [testUserId]);
        await tenantPool.query(`DELETE FROM organizations WHERE created_by = $1`, [testUserId]);
        await tenantPool.query(`DELETE FROM users WHERE user_id = $1`, [testUserId]);
        await tenantPool.end();
        log.info('Test cleanup completed');
    });

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
        });

        it('should return 400 if name is missing', async () => {
            const response = await request(app)
                .post('/api/organizations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    slug: 'test-org'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('name and slug are required');
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .post('/api/organizations')
                .send({
                    name: 'Test',
                    slug: 'test'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/organizations', () => {
        it('should list organizations', async () => {
        const response = await request(app)
            .get('/api/organizations')
            .set('Authorization', `Bearer ${authToken}`);

        console.log('Response body:', response.body);  // 🔴 HATAYI GÖR
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/organizations');

            expect(response.status).toBe(401);
        });
    });
});