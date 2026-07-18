import { Request, Response } from 'express';
import { tenantDb } from '../db/prisma';
import { log } from '../utils/logger';
import { platform_role } from '@prisma/client';

const checkPermissions = (req: Request, allowedRoles: string[]) => {
    if (!req.platformUser) throw new Error('Yetkisiz erişim');

    // 1. Rol Kontrolü
    if (!allowedRoles.includes(req.platformUser.role)) {
        throw new Error('Yetersiz yetki: Bu işlem için yetkiniz yok.');
    }
    
    // 2. Tenant İzolasyonu (Güvenlik): 
    // Platform kullanıcısı sadece yetkili olduğu tenant'ları görebilir mi?
    // (Eğer senin sisteminde platform user'ın tenant yetkisi varsa buraya ekleyebilirsin)
};


export const getTenantBugs = async (req: Request, res: Response): Promise<void> => {
    try {
        // Controller içinde yetki kontrolü
        checkPermissions(req, ['super_admin', 'support_admin']);

        const { tenant_id, status, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const offset = (pageNum - 1) * limitNum;

        const where: any = {};
        if (tenant_id) where.tenant_id = tenant_id;
        if (status) where.status = status;

        const [bugs, total] = await Promise.all([
            tenantDb.application_bugs.findMany({ where, orderBy: { created_at: 'desc' }, skip: offset, take: limitNum }),
            tenantDb.application_bugs.count({ where })
        ]);

        res.json({ success: true, data: bugs, pagination: { total, page: pageNum, limit: limitNum } });
    } catch (error: any) {
        res.status(403).json({ success: false, message: error.message || 'Hata oluştu' });
    }
};

export const updateBug = async (req: Request, res: Response): Promise<void> => {
    try {
        // Güncelleme için daha sıkı kontrol gerekebilir
        checkPermissions(req, ['super_admin', 'support_admin']);
        
        const { id } = req.params;
        const { status, priority, assigned_to } = req.body;

        // Opsiyonel: Sadece kendi tenant'ındaki bug'ları güncelleyebilir miyiz?
        // const userTenantId = req.platformUser.tenant_id; 
        // if (!userTenantId) throw new Error('Tenant yetkisi bulunamadı');

        // any kullanarak TypeScript hatasını bypass et
        const updatedBug = await tenantDb.application_bugs.update({
            where: { bug_id: id },
            data: { 
                status, 
                priority, 
                assigned_to, 
                updated_at: new Date() 
            } as any // Geçici çözüm: TypeScript kontrolünü atla
        });

        res.json({ success: true, data: updatedBug });
    } catch (error: any) {
        res.status(403).json({ success: false, message: error.message || 'Güncelleme başarısız' });
    }
};



export const getBugById = async (req: Request, res: Response): Promise<void> => {
    try {
        checkPermissions(req, ['super_admin', 'support_admin']);

        const { id } = req.params;

        // ⚠️ ÖNEMLİ: TypeScript hatası tenant.schema.prisma dosyasındaki 
        // primary key alanının 'id' olmadığını gösteriyor.
        // Eğer alan adı 'issue_id' veya 'bug_id' ise where bloğunu ona göre düzeltin.
        const bug = await tenantDb.application_bugs.findUnique({
            where: { bug_id: id as string } 
        });

        if (!bug) {
            res.status(404).json({ success: false, message: 'Bug bulunamadı.' });
            return;
        }

        res.json({ success: true, data: bug });
    } catch (error: any) {
        res.status(403).json({ success: false, message: error.message || 'Bug getirilemedi.' });
    }
};



export const deleteBug = async (req: Request, res: Response): Promise<void> => {
    try {
        // Silme işlemi için sadece super_admin yetkisi
        checkPermissions(req, ['super_admin']);

        const { id } = req.params;

        await tenantDb.application_bugs.delete({
            where: { bug_id: id as string }
        });

        res.json({ success: true, message: 'Bug başarıyla silindi.' });
    } catch (error: any) {
        res.status(403).json({ success: false, message: error.message || 'Silme işlemi başarısız' });
    }
};