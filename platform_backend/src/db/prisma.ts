import { PrismaClient as PlatformClient } from '@prisma/client';
import { PrismaClient as TenantClient } from '../../prisma/generated/tenant-client';

// 1. Platform Veritabanı (Kendi ana tablolarımız)
export const prisma = new PlatformClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 2. Tenant Veritabanı (Kiracıların tablolarına uzanan köprü)
export const tenantDb = new TenantClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});