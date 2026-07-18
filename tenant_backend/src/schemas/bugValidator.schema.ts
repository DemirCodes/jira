import { z } from 'zod';

export const createBugSchema = z.object({
    title: z.string().min(5, 'Başlık en az 5 karakter olmalıdır.').max(200),
    description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır.'),
    org_id: z.string().uuid('Geçersiz Organization ID').optional(),
    project_id: z.string().uuid('Geçersiz Project ID').optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(), // Enum değerlerini kendi priorty_level'ına göre ayarla
});