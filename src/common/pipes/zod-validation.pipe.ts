// src/common/pipes/zod-validation.pipe.ts

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { I18nContext } from 'nestjs-i18n';

/**
 * Pipe para validar DTOs con Zod y traducir errores automáticamente
 * 
 * Uso:
 * @Post()
 * create(@Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserDto) {}
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const i18n = I18nContext.current();
        const translatedErrors = this.formatZodErrors(error, i18n);
        
        throw new BadRequestException({
          statusCode: 400,
          message: translatedErrors,
          error: 'Validation Error',
          timestamp: new Date().toISOString(),
          language: i18n?.lang || 'en',
        });
      }
      throw error;
    }
  }

  private formatZodErrors(error: ZodError, i18n: I18nContext | undefined): string[] {
    return error.issues.map((err): string => {
      const field = err.path.join('.');
      const translationKey = err.message;

      // Si el mensaje es una clave de traducción (contiene puntos)
      if (translationKey.includes('.') && i18n) {
        try {
          // Extraer argumentos adicionales del error
          const args: Record<string, any> = {
            field,
            ...err,
          };

          // Agregar parámetros específicos según el tipo de error
          if ('minimum' in err) args.min = err.minimum;
          if ('maximum' in err) args.max = err.maximum;
          if ('exact' in err) args.exact = err.exact;

          const translated = i18n.translate(translationKey, { args }) as string;
          
          // Si la traducción es diferente a la clave, usar la traducción
          return translated !== translationKey ? translated : `${field}: ${err.message}`;
        } catch {
          return `${field}: ${err.message}`;
        }
      }

      // Si no es una clave de traducción, retornar el mensaje original
      return `${field}: ${err.message}`;
    });
  }
}