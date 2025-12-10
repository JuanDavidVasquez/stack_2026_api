import { z } from 'zod';

/**
 * DTO para filtros y paginación en las consultas
 */
export const queryUserSchema = z.object({
  // Paginación
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1))
    .default(1),

  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .default(10),

  // Ordenamiento
  sortBy: z
    .enum(['createdAt', 'email', 'firstName', 'lastName'])
    .default('createdAt'),

  sortOrder: z
    .enum(['ASC', 'DESC'])
    .default('DESC'),

  // Filtros
  search: z.string().optional(),
  
  role: z
    .enum(['user', 'admin'])
    .optional(),

  isActive: z
    .string()
    .transform(val => val === 'true')
    .pipe(z.boolean())
    .optional(),
});

export type QueryUserDto = z.infer<typeof queryUserSchema>;