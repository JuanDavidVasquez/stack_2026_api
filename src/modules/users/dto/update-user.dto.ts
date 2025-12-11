import { z } from 'zod';
import { createUserSchema } from './create-user.dto';
import { UserStatus } from 'src/models/enums';


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

export const updateStatusSchema = z.object({
  status: z.enum(Object.values(UserStatus) as [string, ...string[]]).superRefine((val, ctx) => {
    if (!Object.values(UserStatus).includes(val as UserStatus)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.invalidEnumValue',
      });
    }
  }),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;