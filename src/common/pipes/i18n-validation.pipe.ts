import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { I18nContext } from 'nestjs-i18n';

/**
 * Pipe de validación que traduce automáticamente los mensajes de error
 */
@Injectable()
export class I18nValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const i18n = I18nContext.current();
      const translatedErrors = this.formatErrors(errors, i18n);
      throw new BadRequestException({
        statusCode: 400,
        message: translatedErrors,
        error: 'Validation Error',
      });
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(
    errors: ValidationError[],
    i18n: I18nContext | undefined,
  ): string[] {
    const messages: string[] = [];

    errors.forEach(error => {
      if (error.constraints) {
        Object.keys(error.constraints).forEach(key => {
          const translationKey = `validation.${key}`;
          const args = {
            field: error.property,
            ...error.constraints,
          };

          // Intentar traducir el mensaje
          if (i18n) {
            try {
              const translated = i18n.translate(translationKey, { args }) as string;
              messages.push(translated !== translationKey ? translated : error.constraints![key]);
            } catch {
              messages.push(error.constraints![key]);
            }
          } else {
            if (error.constraints) {
              messages.push(error.constraints[key]);
            }
          }
        });
      }

      // Errores anidados
      if (error.children && error.children.length > 0) {
        messages.push(...this.formatErrors(error.children, i18n));
      }
    });

    return messages;
  }
}