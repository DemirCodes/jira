import { Router } from 'express';
import * as issueController from '../controllers/issue.controller';
import { validate } from '../middlewares/validate';
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

// Create: Body validasyonu
router.post('/', validate({ source: 'body', schema: createIssueSchema }), issueController.create);

// List: Query validasyonu
router.get('/', validate({ source: 'query', schema: listIssuesSchema }), issueController.list);

// Get Detail: Params (id) ve Query (project_id) validasyonu
// Not: Genelde ID params'den, diğer filtreler query'den gelir.
router.get('/:id', 
    validate({ source: 'params', schema: getIssueSchema }), // ID kontrolü
    issueController.getById
);

// Update: Body validasyonu
router.put('/:id', 
    validate({ source: 'body', schema: updateIssueSchema }), 
    issueController.update
);

// Soft Delete: Query validasyonu (project_id kontrolü için)
router.delete('/:id', 
    validate({ source: 'query', schema: deleteOrRestoreIssueSchema }), 
    issueController.remove
);

// Restore: Query validasyonu
router.post('/:id/restore', 
    validate({ source: 'query', schema: deleteOrRestoreIssueSchema }), 
    issueController.restore
);

// Invite Member: Body validasyonu
router.post('/:id/invite', inviteLimiter, 
    validate({ source: 'body', schema: inviteIssueSchema }), 
    issueController.invite
);

export default router;
