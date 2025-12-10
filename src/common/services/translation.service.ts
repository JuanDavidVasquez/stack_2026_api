import { Injectable } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
export class TranslationService {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Traduce una clave con argumentos opcionales
   */
  translate(key: string, args?: Record<string, any>, lang?: string): string {
    const language = lang || I18nContext.current()?.lang || 'en';
    return this.i18n.translate(key, { lang: language, args });
  }

  /**
   * Traduce múltiples claves a la vez
   */
  translateMultiple(keys: string[], args?: Record<string, any>, lang?: string): Record<string, string> {
    const language = lang || I18nContext.current()?.lang || 'en';
    const translations: Record<string, string> = {};

    keys.forEach(key => {
      translations[key] = this.i18n.translate(key, { lang: language, args });
    });

    return translations;
  }

  /**
   * Obtiene el idioma actual del contexto
   */
  getCurrentLanguage(): string {
    return I18nContext.current()?.lang || 'en';
  }

  /**
   * Verifica si un idioma está disponible
   */
  isLanguageAvailable(lang: string): boolean {
    const availableLanguages = ['en', 'es', 'pt'];
    return availableLanguages.includes(lang);
  }

  /**
   * Traduce errores de validación con contexto
   */
  translateValidationError(
    constraint: string,
    property: string,
    args?: Record<string, any>,
    lang?: string,
  ): string {
    const key = `validation.${constraint}`;
    const translationArgs = { field: property, ...args };
    return this.translate(key, translationArgs, lang);
  }

  /**
   * Obtiene todas las traducciones de una sección
   */
  async getSection(section: string, lang?: string): Promise<any> {
    const language = lang || this.getCurrentLanguage();
    return this.i18n.translate(section, { lang: language });
  }

  /**
   * Formatea mensajes con parámetros dinámicos
   */
  format(key: string, params: Record<string, string | number>, lang?: string): string {
    return this.translate(key, params, lang);
  }
}