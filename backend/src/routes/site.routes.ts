import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { upload } from '../middlewares/multer.middleware'; // Bizim RAM-tabanlı multer katmanı
import { validateUploadedFiles } from '../middlewares/fileValidator.middleware'; // Paralel tarayıcı süzgecimiz
import {
    createSiteSchema,
    updateSiteSchema,
    inviteToSiteSchema,
    updateSiteMemberRoleSchema
} from '../schemas/site.schema';
import * as siteController from '../controllers/site.controller';
import { inviteLimiter, memberManagementLimiter } from '../middlewares/rateLimit';

const router = Router();

// =========================================================
// 1. CORE SITE CRUD ROTASI (ZOD CONFIG GÜNCELLEMESİ YAPILDI)
// =========================================================
router.post('/', validate({ source: 'body', schema: createSiteSchema }), siteController.create);
router.get('/org/:orgId', siteController.listByOrg);
router.get('/:id', siteController.getById);
router.put('/:id', validate({ source: 'body', schema: updateSiteSchema }), siteController.update);
router.patch('/:id/status', siteController.updateStatus);
router.delete('/:id', siteController.remove);

// =========================================================
// 2. SITE ASSETS (DOSYA/LOGO/BANNER) GÜVENLİK KAPISI
// =========================================================
// KURAL: Org owner/admin gelse bile burası sadece 'site_admin' yetkisine bakar, diğerleri sadece listeler!
router.post('/:id/assets', 
    upload.single('file'),          // 1. Dosyayı havada RAM'e yakala
    validateUploadedFiles,          // 2. ReDoS ve XSS korumalı paralel süzgeçten geçir, checksum bas
    siteController.uploadSiteAsset  // 3. Yetkiler okeyse DB'ye yazdır kanka
);

router.get('/:id/assets', siteController.listSiteAssets);
router.delete('/:id/assets/:assetId', siteController.removeSiteAsset);

// =========================================================
// 3. INVITE & MEMBERSHIP YÖNETİMİ (ZOD CONFIG GÜNCELLENDİ & TEMİZLENDİ)
// =========================================================
router.post('/:id/invite', inviteLimiter, validate({ source: 'body', schema: inviteToSiteSchema }), siteController.invite);

// Üye Rol Güncelleme (Rate Limiter korumalı ve tekil hale getirildi)
router.put('/:id/members/:memberId/role', memberManagementLimiter, validate({ source: 'body', schema: updateSiteMemberRoleSchema }), siteController.updateMemberRole);

// Üye Silme (Rate Limiter korumalı ve tekil hale getirildi)
router.delete('/:id/members/:memberId', memberManagementLimiter, siteController.removeMember);

// Üyeleri Listeleme
router.get('/:id/members', siteController.listMembers);

// =========================================================
// 4. STATS
// =========================================================
router.get('/:id/stats', siteController.getStats);

export default router;