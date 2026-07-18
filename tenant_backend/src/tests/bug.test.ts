import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// 1. IMPORT YOLLARINI DÜZELTTİK (../src kısmını sildik)
import bugRoutes from '../routes/bug.routes'; 
import { bugService } from '../services/bug.service';
import { prisma } from '../db/prisma';

// ==========================================
// 1. MOCK (SAHTE) KATMANLARIN KURULUMU
// ==========================================

// 2. MOCK YOLLARINI DA DÜZELTTİK
jest.mock('../services/bug.service');

jest.mock('../db/prisma', () => ({
    prisma: {
        projects: { findFirst: jest.fn() }
    }
}));

jest.mock('../middlewares/auth', () => ({
    tenantAuth: (req: any, res: any, next: any) => {
        req.tenantUser = { 
            id: 'mock-user-uuid', 
            org_id: 'mock-org-uuid', 
            role: 'owner' 
        };
        next();
    }
}));

// ==========================================
// 2. İZOLE EXPRESS UYGULAMASI (TEST İÇİN)
// ==========================================
const app = express();
app.use(express.json());
app.use('/api/bugs', bugRoutes);

// Senin o meşhur ErrorHandler mimarini simüle eden global hata yakalayıcı
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.statusCode || 500).json({ 
        error: err.errorCode, 
        message: err.message 
    });
});

// ==========================================
// 3. JEST TEST SENARYOLARI (TEST SUITE)
// ==========================================
describe('Bug (Talep) Modülü API Testleri', () => {

    beforeEach(() => {
        // Her testten önce mock'ları temizle
        jest.clearAllMocks();
    });

    describe('POST /api/bugs - Bug Oluşturma', () => {
        it('Geçerli verilerle başarıyla bug oluşturmalı (201)', async () => {
            // Service'in döneceği sahte sonucu ayarlıyoruz
            (bugService.createBug as jest.Mock).mockResolvedValue({ bug_id: 'new-bug-123' });
            
            // Geçerli bir UUID ile mock'luyoruz
            const validUUID = '123e4567-e89b-12d3-a456-426614174000';
            (prisma.projects.findFirst as jest.Mock).mockResolvedValue({ project_id: validUUID });

            const payload = {
                title: "Login ekranında hata",
                description: "Buton kayıyor ve tıklanamıyor, acil düzeltilmeli.",
                project_id: validUUID, 
                priority: "high"
            };

            const response = await request(app)
                .post('/api/bugs')
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Bug / Talep başarıyla raporlandı.');
            expect(response.body.bug_id).toBe('new-bug-123');
            
            expect(bugService.createBug).toHaveBeenCalledWith(expect.objectContaining({
                title: payload.title,
                org_id: 'mock-org-uuid' 
            }));
        });

        it('Başka bir organizasyonun projesi girilirse reddetmeli (404)', async () => {
            (prisma.projects.findFirst as jest.Mock).mockResolvedValue(null);
            
            const foreignUUID = '987fcdeb-51a2-43d7-9012-345678901234';

            const response = await request(app)
                .post('/api/bugs')
                .send({
                    title: "Geçerli başlık",
                    description: "Geçerli açıklama metni",
                    project_id: foreignUUID // <-- DÜZ METİN YERİNE UUID KOYDUK
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('400-001-001'); // PROJECT_NOT_FOUND kodu
        });
    });

    describe('GET /api/bugs - Bug Listeleme', () => {
        it('Organizasyona ait bug listesini getirmeli (200)', async () => {
            const mockBugs = [
                { bug_id: 'bug-1', title: 'Hata 1', status: 'open' },
                { bug_id: 'bug-2', title: 'Hata 2', status: 'resolved' }
            ];
            (bugService.getBugsByOrg as jest.Mock).mockResolvedValue(mockBugs);

            const response = await request(app).get('/api/bugs');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].title).toBe('Hata 1');
            expect(bugService.getBugsByOrg).toHaveBeenCalledWith('mock-org-uuid');
        });
    });

    describe('GET /api/bugs/:id - Bug Detayı', () => {
        it('Geçerli bir bug ID ile detayları getirmeli (200)', async () => {
            const mockBugDetail = { bug_id: 'bug-1', title: 'Hata 1', description: 'Detaylar...' };
            (bugService.getBugById as jest.Mock).mockResolvedValue(mockBugDetail);

            const response = await request(app).get('/api/bugs/bug-1');

            expect(response.status).toBe(200);
            expect(response.body.description).toBe('Detaylar...');
        });

        it('Bug bulunamazsa 404 dönmeli', async () => {
            (bugService.getBugById as jest.Mock).mockResolvedValue(null);

            const response = await request(app).get('/api/bugs/hatali-id');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('900-001-001'); // BUG_NOT_FOUND kodu
        });
    });

    describe('DELETE /api/bugs/:id - Bug Silme (Soft Delete)', () => {
        it('Owner yetkisiyle bug başarıyla silinmeli (200)', async () => {
            (bugService.deleteBug as jest.Mock).mockResolvedValue(true);

            const response = await request(app).delete('/api/bugs/bug-1');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Talep başarıyla iptal edildi / silindi.');
            expect(bugService.deleteBug).toHaveBeenCalledWith('bug-1', 'mock-org-uuid', 'mock-user-uuid');
        });

        it('Silinmek istenen bug bulunamazsa 404 dönmeli', async () => {
            (bugService.deleteBug as jest.Mock).mockResolvedValue(false);

            const response = await request(app).delete('/api/bugs/bug-1');

            expect(response.status).toBe(404);
        });
    });
});