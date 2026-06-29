import { Router } from 'express';
import * as issueController from '../controllers/issue.controller';
import { validate } from '../middlewares/validate';
import { upload } from '../middlewares/multer.middleware';
import { validateUploadedFiles } from '../middlewares/fileValidator.middleware';
import { 
    createIssueSchema, 
    updateIssueSchema, 
    listIssuesSchema, 
    getIssueSchema, 
    deleteOrRestoreIssueSchema, 
    inviteIssueSchema 
} from '../schemas/issue.schema';
import { inviteLimiter } from '../middlewares/rateLimit';

const router = Router();

// ==========================================
// CORE ISSUE ENDPOINTS
// ==========================================

router.post('/', validate({ source: 'body', schema: createIssueSchema }), issueController.create);
router.get('/', validate({ source: 'query', schema: listIssuesSchema }), issueController.list);
router.get('/:id', validate({ source: 'params', schema: getIssueSchema }), issueController.getById);
router.put('/:id', validate({ source: 'body', schema: updateIssueSchema }), issueController.update);
router.delete('/:id', validate({ source: 'query', schema: deleteOrRestoreIssueSchema }), issueController.remove);
router.post('/:id/restore', validate({ source: 'query', schema: deleteOrRestoreIssueSchema }), issueController.restore);
router.post('/:id/invite', inviteLimiter, validate({ source: 'body', schema: inviteIssueSchema }), issueController.invite);

// ==========================================
// ISSUE ASSET ENDPOINTS
// ==========================================
// KURAL: Sadece contributor ve reviewer yazar/siler. Watcher sadece listeler.
router.post('/:id/assets',
    upload.single('file'),               // Multer ile dosyayı RAM'e al
    validateUploadedFiles,               // Magic bytes + virus + checksum tara
    issueController.uploadIssueAsset     // Kaydet
);

router.get('/:id/assets', issueController.listIssueAssets);
router.delete('/:id/assets/:assetId', issueController.removeIssueAsset);

export default router;