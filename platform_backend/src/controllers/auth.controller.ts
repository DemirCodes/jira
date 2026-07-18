import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { loginPlatformUserSchema, registerPlatformUserSchema } from '../schemas/platform.schema';
import { sendSuccess, sendError } from '../utils/response';

// Dönüş tipi: Promise<void> (Hiçbir şey döndürmez, sadece işlem yapar)
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Zod Validasyonu
        const validationResult = loginPlatformUserSchema.safeParse(req.body);
        if (!validationResult.success) {
            // Helper'ı çağır ama return etme! res objesi üzerinden yanıt verildi.
            sendError(res, validationResult.error.issues[0].message, '422');
            return; // İşlemi sonlandır
        }

        const { email, password } = validationResult.data;
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        
        const result = await authService.platformLogin(email, password, ipAddress);
        
        // Helper'ı çağır
        sendSuccess(res, result, 200, 'Giriş başarılı');
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
        await authService.platformLogout(token);

        sendSuccess(res, { message: 'Successfully logged out' }, 200);
    } catch (error) {
        next(error);
    }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Zod Validasyonu
        const validationResult = registerPlatformUserSchema.safeParse(req.body);
        if (!validationResult.success) {
            sendError(res, validationResult.error.issues[0].message, '422');
            return;
        }

        const { email, password, role } = validationResult.data;

        const result = await authService.platformRegister(email, password, role);

        sendSuccess(res, result, 201, 'Kayıt başarılı');
    } catch (error) {
        next(error);
    }
};
