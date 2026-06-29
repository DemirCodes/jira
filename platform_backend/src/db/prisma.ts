import { PrismaClient } from '@prisma/client';

// Tüm platform katmanında kullanılacak tekil Prisma instance'ı
export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});