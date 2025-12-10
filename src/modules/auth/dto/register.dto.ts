import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .email('Email debe ser válido')
    .min(1, 'Email es requerido'),
  
  password: z
    .string()
    .min(8, 'Password debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password debe contener mayúsculas, minúsculas y números'
    ),
  
  username: z
    .string()
    .min(3, 'Username debe tener al menos 3 caracteres')
    .max(50, 'Username no puede exceder 50 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Username solo puede contener letras minúsculas, números y guiones bajos')
    .optional(),
  
  firstName: z
    .string()
    .min(1, 'Nombre es requerido')
    .max(100, 'Nombre no puede exceder 100 caracteres')
    .optional(),
  
  lastName: z
    .string()
    .min(1, 'Apellido es requerido')
    .max(100, 'Apellido no puede exceder 100 caracteres')
    .optional(),
  
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Teléfono debe ser válido')
    .optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;