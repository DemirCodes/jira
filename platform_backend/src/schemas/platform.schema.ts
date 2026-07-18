// src/schemas/platform.schema.ts
import { z } from 'zod';

export const registerPlatformUserSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .max(100, 'Şifre en fazla 100 karakter olabilir')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/,
      'Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir'
    ),
  role: z.enum(['super_admin', 'support_admin', 'billing_admin'])
});

export const loginPlatformUserSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(1, 'Şifre gereklidir'),
});
