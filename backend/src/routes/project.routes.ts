import { Router } from 'express';
import { validate } from '../middlewares/validate';
import {
    createProjectSchema,
    updateProjectSchema,
    updateProjectStatusSchema,
    inviteToProjectSchema
} from '../schemas/project.schema';
import * as projectController from '../controllers/project.controller';
import { inviteLimiter } from '../middlewares/rateLimit'; // memberManagementLimiter kullanılmıyorsa silebilirsin

const router = Router();

// ==================== CRUD ====================
// CREATE: Yeni proje oluştur
router.post('/', validate(createProjectSchema), projectController.create);

// READ: Sitedeki projeleri listele. 
// NOT: Controller'da req.query.site_id üzerinden aradığımız için ':siteId' parametresini kaldırdık
router.get('/', projectController.list); 

// READ: Proje detayını getir (?site_id=... gerekli)
router.get('/:id', projectController.getById);

// UPDATE: Proje detaylarını güncelle
router.put('/:id', validate(updateProjectSchema), projectController.update);

// UPDATE: Proje durumunu güncelle
router.patch('/:id/status', validate(updateProjectStatusSchema), projectController.updateStatus);

// DELETE: Projeyi sil (?site_id=... gerekli)
router.delete('/:id', projectController.remove);

// RESTORE: Silinen projeyi geri getir (body'de site_id gerekli)
router.post('/:id/restore', projectController.restore);

// ==================== MEMBERS & INVITES ====================
// INVITE: Projeye kullanıcı davet et
router.post('/:id/invite', inviteLimiter, validate(inviteToProjectSchema), projectController.invite);

// MEMBERS: Proje üyelerini listele (?site_id=... gerekli)
router.get('/:id/members', projectController.listMembers);

export default router;