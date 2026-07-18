import { Request, Response, NextFunction } from 'express';
import * as tenantService from '../services/tenant.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';

export const createTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { companyName, domain, adminEmail, adminPassword } = req.body;

        // Temel Validasyon
        if (!companyName || !domain || !adminEmail || !adminPassword) {
            throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Company name, domain, admin email, and admin password are required.');
        }

        // Middleware'den gelen işlemi yapan Platform yetkilisinin ID'si
        const platformUserId = req.platformUser?.id;

        if (!platformUserId) {
            throw new AppError(ErrorCodes.AUTH_FORBIDDEN, 'Platform user context missing.');
        }

        const provisionResult = await tenantService.provisionNewTenant({
            companyName,
            domain,
            adminEmail,
            adminPasswordPlain: adminPassword,
            platformUserId
        });

        res.status(201).json({
            status: 'success',
            message: 'Tenant has been successfully provisioned and is ready for use.',
            data: provisionResult
        });
    } catch (error) {
        next(error);
    }
};

