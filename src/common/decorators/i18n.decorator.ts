import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

/**
 * Decorador para obtener el idioma actual de la petición
 * 
 * @example
 * @Get()
 * async getUsers(@Lang() lang: string) {
 *   // lang contendrá el idioma actual (ej: 'es', 'en', 'pt')
 * }
 */
export const Lang = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const i18n = I18nContext.current(ctx);
    const lang = i18n?.lang || 'en';
    
    // ✅ Limpieza del idioma
    const cleanLang = lang
      .split(',')[0]      
      .split('-')[0]    
      .trim()           
      .toLowerCase();  
    
    return cleanLang;
  },
);

/**
 * Decorador para obtener el contexto completo de i18n
 * 
 * @example
 * @Get()
 * async getUsers(@I18n() i18n: I18nContext) {
 *   const translation = i18n.translate('common.welcome');
 * }
 */
export const I18n = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): I18nContext => {
    const i18n = I18nContext.current(ctx);
    if (!i18n) {
      throw new Error('I18nContext is not available in the current context');
    }
    return i18n;
  },
);