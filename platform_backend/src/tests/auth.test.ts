import request from 'supertest';
import { app } from '../index'; // Canlı sunucuya değil, Express app'ine bağlanıyoruz
import { prisma } from '../db/prisma';
import { getRedisClient } from '../cache/redis';

// Test öncesi temizlik (Opsiyonel ama temizlik için iyi)
beforeAll(async () => {
    // Eğer test DB'si kullanıyorsan burada connect edebilirsin
});

afterAll(async () => {
    await prisma.$disconnect();
    const redisClient = getRedisClient();
    if (redisClient) await redisClient.quit();
});

describe('Platform Auth Flow Tests', () => {
    const testUser = {
        email: `admin_${Date.now()}@elbistan.local`,
        password: 'TestPassword123!',
        role: 'super_admin' as const // TypeScript tipini korumak için
    };

    let authToken = '';

    it('1. POST /register -> Yeni bir super_admin kaydetmeli', async () => {
        // Artık .send({ body: ... }) değil, direkt .send(...) kullanıyoruz
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send(testUser); 
        
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.email).toBe(testUser.email);
    });

    it('2. POST /login -> Kaydedilen kullanıcı ile giriş yapıp token almalı', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        
        authToken = response.body.data.token;
    });

    it('3. POST /logout -> Alınan token ile başarılı şekilde çıkış yapmalı', async () => {
        const response = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${authToken}`)
            .send();

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
