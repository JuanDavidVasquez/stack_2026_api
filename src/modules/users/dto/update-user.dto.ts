import { z } from 'zod';
import { createUserSchema } from './create-user.dto';


/**
 * Para update, hacemos todos los campos opcionales excepto validaciones específicas
 */
export const updateUserSchema = createUserSchema.partial().extend({
  // Si se envía password, debe cumplir las mismas reglas
  password: z
    .string()
    .min(8, 'validation.minLength')
    .max(100, 'validation.maxLength')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'validation.passwordStrength',
    )
    .optional(),

  isActive: z.boolean().optional(),
  avatar: z.string().url('validation.isUrl').optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;