import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            // Tenant standartlarına uygun validasyon hatası
            throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Email and password are required');
        }

        // Audit tablomuz (login_attempts) için IP adresi
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

        const result = await authService.platformLogin(email, password, ipAddress);

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new AppError(ErrorCodes.AUTH_NO_TOKEN, 'No token provided');
        }

        const token = authHeader.split(' ')[1];
        
        // Veritabanında (ve Redis'te) session'ı revoke et
        await authService.platformLogout(token);

        res.status(200).json({ 
            status: 'success',
            message: 'Successfully logged out from Platform' 
        });
    } catch (error) {
        next(error);
    }
};