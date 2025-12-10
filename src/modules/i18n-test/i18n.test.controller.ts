import { Controller, Get, Query } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { Lang } from '../../common/decorators/i18n.decorator';

@Controller('i18n-test')
export class I18nTestController {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Endpoint de diagnóstico completo
   * GET /api/i18n-test/diagnostic?lang=es
   */
  @Get('diagnostic')
  async diagnostic(@Lang() lang: string, @Query('lang') queryLang?: string) {
    const i18nContext = I18nContext.current();
    
    // Intentar traducir varias claves
    const translations = {
      'common.welcome': this.i18n.t('common.welcome', { lang }),
      'common.success': this.i18n.t('common.success', { lang }),
      'user.created': this.i18n.t('user.created', { lang }),
      'auth.login.success': this.i18n.t('auth.login.success', { lang }),
    };

    return {
      success: true,
      diagnostic: {
        detectedLanguage: lang,
        queryParamLang: queryLang,
        i18nContextLang: i18nContext?.lang,
        availableLanguages: ['en', 'es', 'pt'],
        translations,
        raw: {
          message: 'common.welcome', // Sin traducir (para comparar)
        },
      },
      instructions: {
        testUrls: [
          'GET /api/i18n-test/diagnostic?lang=es',
          'GET /api/i18n-test/diagnostic?lang=en',
          'GET /api/i18n-test/diagnostic (with header: x-lang: es)',
        ],
      },
    };
  }

  /**
   * Test simple que DEBE retornar traducción automática
   * GET /api/i18n-test/simple?lang=es
   */
  @Get('simple')
  async simple(@Lang() lang: string) {
    console.log('🌍 Detected language:', lang);
    
    // Esta clave debería traducirse automáticamente por el interceptor
    return {
      message: 'common.welcome',
      data: {
        language: lang,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Test de traducción manual
   * GET /api/i18n-test/manual?lang=es
   */
  @Get('manual')
  async manual(@Lang() lang: string) {
    const welcomeMessage = this.i18n.t('common.welcome', { lang });
    const successMessage = this.i18n.t('common.success', { lang });
    
    console.log('🔤 Translated welcome:', welcomeMessage);
    console.log('🔤 Translated success:', successMessage);
    
    return {
      message: welcomeMessage,
      data: {
        welcome: welcomeMessage,
        success: successMessage,
        original: 'common.welcome',
        language: lang,
      },
    };
  }

  /**
   * Test de traducción con parámetros
   * GET /api/i18n-test/params?lang=es&name=Juan
   */
  @Get('params')
  async withParams(@Lang() lang: string, @Query('name') name: string = 'Usuario') {
    const message = this.i18n.t('email.templates.welcome.body', {
      lang,
      args: { name },
    });

    return {
      message,
      data: {
        translatedWith: { name },
        language: lang,
      },
    };
  }

  /**
   * Test de todos los idiomas disponibles
   * GET /api/i18n-test/all-languages
   */
  @Get('all-languages')
  async allLanguages() {
    const languages = ['en', 'es', 'pt'];
    const key = 'common.welcome';
    
    const translations = {};
    for (const lang of languages) {
      translations[lang] = this.i18n.t(key, { lang });
    }

    return {
      message: 'Translations for: common.welcome',
      data: translations,
      test: {
        expected: {
          en: 'Welcome',
          es: 'Bienvenido',
          pt: 'Bem-vindo',
        },
        actual: translations,
        match: {
          en: translations['en'] === 'Welcome',
          es: translations['es'] === 'Bienvenido',
          pt: translations['pt'] === 'Bem-vindo',
        },
      },
    };
  }

  /**
   * Verifica si los archivos de traducción están cargados
   * GET /api/i18n-test/files-check
   */
  @Get('files-check')
  async filesCheck() {
    const fs = require('fs');
    const path = require('path');
    
    const i18nPath = path.join(process.cwd(), 'src', 'i18n');
    const languages = ['en', 'es', 'pt'];
    
    const filesStatus = {};
    
    for (const lang of languages) {
      const filePath = path.join(i18nPath, lang, 'translation.json');
      try {
        const exists = fs.existsSync(filePath);
        filesStatus[lang] = {
          path: filePath,
          exists,
          content: exists ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : null,
        };
      } catch (error) {
        filesStatus[lang] = {
          path: filePath,
          exists: false,
          error: error.message,
        };
      }
    }

    return {
      message: 'Translation files check',
      i18nBasePath: i18nPath,
      files: filesStatus,
      recommendation: Object.values(filesStatus).some((f: any) => !f.exists)
        ? '⚠️ Some translation files are missing! Create them as per the guide.'
        : '✅ All translation files found!',
    };
  }
}