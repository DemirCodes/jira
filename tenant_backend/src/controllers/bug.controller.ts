import { Request, Response, NextFunction } from 'express';
import { bugService } from '../services/bug.service';
import { log } from '../utils/logger';
import { AppError, ErrorCodes, isAppError } from '../utils/errorCodes';
import { prisma } from '../db/prisma';

export const reportBug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userRole = req.tenantUser?.role; 
        
        if (userRole !== 'owner' && userRole !== 'admin') {
            throw new AppError(ErrorCodes.BUG_ADMIN_REQUIRED);
        }

        // org_id'yi body'den ÇIKARTTIK. İstemciye güvenmiyoruz.
        const { title, description, project_id, priority } = req.body;
        const userId = req.tenantUser!.id; 
        
        // ZORUNLU KILDIK: İşlem sadece adamın token'ındaki organizasyona yapılabilir!
        const finalOrgId = req.tenantUser?.org_id; 

        if (!finalOrgId) {
            throw new AppError(ErrorCodes.ORG_NOT_FOUND);
        }

        // GÜVENLİK KONTROLÜ: Eğer bir project_id gönderildiyse, bu proje adamın firmasına mı ait?
        if (project_id) {
            const projectExists = await prisma.projects.findFirst({
                where: { 
                    project_id: project_id, 
                    // Prisma Relational Query (Prisma'nın önerdiği gibi 'sites' yaptık)
                    sites: {
                        org_id: finalOrgId
                    }
                }
            });

            if (!projectExists) {
                throw new AppError(ErrorCodes.PROJECT_NOT_FOUND); 
            }
        }

        const newBug = await bugService.createBug({
            userId,
            title,
            description,
            org_id: finalOrgId,
            project_id,
            priority
        });

        log.info('New application bug reported', { bugId: newBug.bug_id, reportedBy: userId });
        res.status(201).json({ message: 'Bug / Talep başarıyla raporlandı.', bug_id: newBug.bug_id });

    } catch (error: any) {
        if (isAppError(error)) return next(error);
        
        log.error('Error creating application bug', { error: error.message });
        next(new AppError(ErrorCodes.BUG_CREATE_FAILED));
    }
};

export const getBugs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const orgId = req.tenantUser?.org_id;
        
        if (!orgId) {
            throw new AppError(ErrorCodes.ORG_NOT_FOUND);
        }

        const bugs = await bugService.getBugsByOrg(orgId);
        res.status(200).json(bugs);

    } catch (error: any) {
        if (isAppError(error)) return next(error);
        
        log.error('Error fetching application bugs', { error: error.message });
        next(new AppError(ErrorCodes.INTERNAL_SERVER_ERROR));
    }
};

export const getBugDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const orgId = req.tenantUser?.org_id;
        const { id } = req.params;

        if (!orgId) {
            throw new AppError(ErrorCodes.ORG_NOT_FOUND);
        }

        const bug = await bugService.getBugById(id, orgId);

        if (!bug) {
            throw new AppError(ErrorCodes.BUG_NOT_FOUND);
        }

        res.status(200).json(bug);

    } catch (error: any) {
        if (isAppError(error)) return next(error);
        
        log.error('Error fetching bug details', { error: error.message });
        next(new AppError(ErrorCodes.INTERNAL_SERVER_ERROR));
    }
};

export const deleteBug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const orgId = req.tenantUser?.org_id;
        const userId = req.tenantUser!.id;
        const { id } = req.params;

        const userRole = req.tenantUser?.role;
        if (userRole !== 'owner' && userRole !== 'admin') {
            throw new AppError(ErrorCodes.BUG_ADMIN_REQUIRED);
        }          

        const isDeleted = await bugService.deleteBug(id, orgId!, userId);

        if (!isDeleted) {
            throw new AppError(ErrorCodes.BUG_NOT_FOUND);
        }

        log.info('Bug soft deleted', { bugId: id, deletedBy: userId });
        res.status(200).json({ message: 'Talep başarıyla iptal edildi / silindi.' });

    } catch (error: any) {
        if (isAppError(error)) return next(error);
        
        log.error('Error deleting bug', { error: error.message });
        next(new AppError(ErrorCodes.BUG_DELETE_FAILED));
    }
};