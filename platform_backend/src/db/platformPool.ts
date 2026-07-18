
import { PrismaClient } from '@prisma/client';
import { log } from '../utils/logger';

export const platformPool = new PrismaClient();

export const connectPlatformDB = async () => {
    try {
        await platformPool.$connect();
        log.info('Platform Database (5433) connection successful');
    } catch (error) {
        log.error('Platform Database connection failed', { error });
        process.exit(1);
    }
};