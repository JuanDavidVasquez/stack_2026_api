import { z } from 'zod';

/**
 * IMPORTANTE: Los esquemas Zod NO contienen mensajes traducidos directamente.
 * Los mensajes de error se traducen automáticamente usando las claves de i18n.
 * 
 * El sistema de validación:
 * 1. Zod valida los datos según las reglas del schema
 * 2. Si hay errores, el ZodValidationPipe los captura
 * 3. El pipe traduce los errores usando las claves en i18n/validation
 */

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'validation.minLength')
    .max(50, 'validation.maxLength')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'validation.usernameFormat'),
  email: z
    .string()
    .min(1, 'validation.isNotEmpty')
    .email('validation.isEmail'),

  password: z
    .string()
    .min(8, 'validation.minLength')
    .max(100, 'validation.maxLength')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'validation.passwordStrength',
    ),

  firstName: z
    .string()
    .min(2, 'validation.minLength')
    .max(50, 'validation.maxLength'),

  lastName: z
    .string()
    .min(2, 'validation.minLength')
    .max(50, 'validation.maxLength'),

  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'validation.isPhoneNumber')
    .optional(),

  role: z
    .enum(['user', 'admin'])
    .default('user'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;