import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { upload } from '../middlewares/multer.middleware'; // Yeni oluşturduğumuz multer ayarı
import { validateUploadedFiles } from '../middlewares/fileValidator.middleware'; // Yeni validator middleware
import {
    createOrganizationSchema,
    updateOrganizationSchema,
    inviteToOrganizationSchema,
    updateMemberRoleSchema
} from '../schemas/organization.schema';
import * as orgController from '../controllers/organization.controller';
import { inviteLimiter, memberManagementLimiter } from '../middlewares/rateLimit';

const router = Router();

// Temel Rotalar
router.post('/', validate(createOrganizationSchema), orgController.create);
router.get('/', orgController.list);
router.get('/:id', orgController.getById);
router.patch('/:id', validate(updateOrganizationSchema), orgController.update);
router.delete('/:id', orgController.remove);

// =========================================================
// ORGANİZASYON ASSETS (DOSYA/EK) YÜKLEME KAPISI
// =========================================================
// Kullanıcı organizasyona bir evrak, logo veya ek döküman yüklediğinde burası tetiklenir
router.post('/:id/assets', 
    upload.single('file'),      // 1. Multer dosyayı RAM'e (buffer) alır
    validateUploadedFiles,      // 2. Bizim katman Magic Bytes ve Script taraması yapar
    orgController.uploadAsset   // 3. Temizse asset tablosuna yazılması için controller'a geçer
);


// Asset Yönetim Rotaları
router.post('/:id/assets', upload.single('file'), validateUploadedFiles, orgController.uploadAsset);
router.get('/:id/assets', orgController.listAssets);
// asset silerken hangi org altında olduğunu da parametre alıyoruz ki yetkiyi kontrol edebilelim kral
router.delete('/:id/assets/:assetId', orgController.removeAsset); // Bunun controller karşılığına direkt orgAssetService.deleteAsset bağlarsın

// Members
router.get('/:id/members', orgController.listMembers);
router.patch('/:id/members/:memberId', validate(updateMemberRoleSchema), orgController.updateMemberRole);
router.delete('/:id/members/:memberId', orgController.removeMember);

// Invitations
router.post('/:id/invite', inviteLimiter, validate(inviteToOrganizationSchema), orgController.invite);
router.put('/:id/members/:memberId/role', memberManagementLimiter, validate(updateMemberRoleSchema), orgController.updateMemberRole);
router.delete('/:id/members/:memberId', memberManagementLimiter, orgController.removeMember);

// Stats & Leave
router.get('/:id/stats', orgController.getStats);
router.post('/:id/leave', orgController.leave);

export default router;