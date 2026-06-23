import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { upload } from '../middlewares/multer.middleware';
import { validateUploadedFiles } from '../middlewares/fileValidator.middleware';
import {
    createProjectSchema,
    updateProjectSchema,
    updateProjectStatusSchema,
    inviteToProjectSchema
} from '../schemas/project.schema';
import * as projectController from '../controllers/project.controller';
import { inviteLimiter } from '../middlewares/rateLimit';

const router = Router();

// ==================== CRUD ====================
// CREATE: Yeni proje oluştur
router.post('/', validate({ source: 'body', schema: createProjectSchema }), projectController.create);

// READ: Sitedeki projeleri listele. 
router.get('/', projectController.list); 

// READ: Proje detayını getir (?site_id=... gerekli)
router.get('/:id', projectController.getById);

// UPDATE: Proje detaylarını güncelle
router.put('/:id', validate({ source: 'body', schema: updateProjectSchema }), projectController.update);

// UPDATE: Proje durumunu güncelle
router.patch('/:id/status', validate({ source: 'body', schema: updateProjectStatusSchema }), projectController.updateStatus);

// DELETE: Projeyi sil (?site_id=... gerekli)
router.delete('/:id', projectController.remove);

// RESTORE: Silinen projeyi geri getir (body'de site_id gerekli)
router.post('/:id/restore', projectController.restore);

// =========================================================
// ASSETS (DOSYA/RESİM) GÜVENLİK KAPISI
// =========================================================
// KURAL: Sadece project_admin ve contributor yazar/siler. Diğerleri (viewer) sadece listeler.
router.post('/:id/assets', 
    upload.single('file'),               
    validateUploadedFiles,               
    projectController.uploadProjectAsset 
);

router.get('/:id/assets', projectController.listProjectAssets);
router.delete('/:id/assets/:assetId', projectController.removeProjectAsset);

// ==================== MEMBERS & INVITES ====================
// INVITE: Projeye kullanıcı davet et
router.post('/:id/invite', inviteLimiter, validate({ source: 'body', schema: inviteToProjectSchema }), projectController.invite);

// MEMBERS: Proje üyelerini listele (?site_id=... gerekli)
router.get('/:id/members', projectController.listMembers);

export default router;