import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Email debe ser válido')
    .min(1, 'Email es requerido'),
  
  password: z
    .string()
    .min(1, 'Password es requerido'),
});

export type LoginDto = z.infer<typeof loginSchema>;