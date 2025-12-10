import { Controller, Get, Query } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { join } from 'path';

@Controller('i18n-debug')
export class I18nDebugController {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Test completo de I18nService
   * curl "http://localhost:3000/api/i18n-debug/full?lang=es"
   */
  @Get('full')
  async fullDebug(@Query('lang') lang: string = 'es') {
    console.log('\n════════════════════════════════════');
    console.log('🔍 DEBUG COMPLETO DE I18N');
    console.log('════════════════════════════════════');
    console.log('Idioma solicitado:', lang);
    console.log('I18nContext.current():', I18nContext.current()?.lang);
    console.log('__dirname:', __dirname);
    console.log('join(__dirname, "/i18n/"):', join(__dirname, '/i18n/'));
    console.log('');

    // Test 1: Traducir claves específicas
    console.log('📝 TEST 1: Traducción de claves');
    const keys = [
      'user.list',
      'user.created',
      'common.welcome',
      'common.success',
      'auth.login.success',
    ];

    const translations = {};
    for (const key of keys) {
      try {
        const result = await this.i18n.translate(key, { lang });
        const worked = result !== key;
        console.log(`  ${worked ? '✅' : '❌'} ${key} => "${result}"`);
        translations[key] = { result, worked };
      } catch (error) {
        console.log(`  ❌ ${key} => ERROR: ${error.message}`);
        translations[key] = { error: error.message };
      }
    }

    // Test 2: Probar con método alternativo
    console.log('');
    console.log('📝 TEST 2: Método alternativo (t)');
    try {
      const altResult = this.i18n.t('user.list', { lang });
      console.log(`  user.list => "${altResult}"`);
    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
    }

    // Test 3: Verificar todos los idiomas
    console.log('');
    console.log('📝 TEST 3: Todos los idiomas');
    const allLangs = {};
    for (const testLang of ['en', 'es', 'pt']) {
      try {
        const result = await this.i18n.translate('user.list', { lang: testLang });
        console.log(`  [${testLang}] user.list => "${result}"`);
        allLangs[testLang] = result;
      } catch (error) {
        console.log(`  [${testLang}] ERROR: ${error.message}`);
        allLangs[testLang] = { error: error.message };
      }
    }

    // Test 4: Verificar archivos físicos
    console.log('');
    console.log('📝 TEST 4: Verificación de archivos');
    const fs = require('fs');
    const i18nPath = join(__dirname, '/i18n/');
    console.log(`  Ruta i18n: ${i18nPath}`);
    console.log(`  Existe? ${fs.existsSync(i18nPath)}`);
    
    if (fs.existsSync(i18nPath)) {
      const esFile = join(i18nPath, 'es', 'translation.json');
      console.log(`  Archivo ES: ${esFile}`);
      console.log(`  Existe? ${fs.existsSync(esFile)}`);
      
      if (fs.existsSync(esFile)) {
        try {
          const content = JSON.parse(fs.readFileSync(esFile, 'utf-8'));
          console.log(`  user.list en archivo: "${content.user?.list}"`);
        } catch (error) {
          console.log(`  Error al leer: ${error.message}`);
        }
      }
    }

    console.log('');
    console.log('════════════════════════════════════');
    console.log('');

    // Diagnóstico
    const anyWorked = Object.values(translations).some((t: any) => t.worked === true);
    
    return {
      success: anyWorked,
      lang,
      translations,
      allLangs,
      diagnosis: anyWorked 
        ? '✅ I18n funciona correctamente'
        : '❌ I18n NO está traduciendo - Revisa la configuración del módulo',
      instructions: !anyWorked ? [
        '1. Verifica que I18nModule.forRootAsync use: path: join(__dirname, "/i18n/")',
        '2. Asegúrate que nest-cli.json copie los JSON a dist/',
        '3. Reinicia el servidor completamente',
        '4. Comprueba que no haya errores en la consola al iniciar',
      ] : null,
    };
  }

  /**
   * Test rápido de una sola clave
   * curl "http://localhost:3000/api/i18n-debug/quick?key=user.list&lang=es"
   */
  @Get('quick')
  async quickTest(
    @Query('key') key: string = 'user.list',
    @Query('lang') lang: string = 'es',
  ) {
    console.log(`\n🔍 Quick test: "${key}" [${lang}]`);
    
    const result = await this.i18n.translate(key, { lang });
    const worked = result !== key;
    
    console.log(`  Resultado: "${result}"`);
    console.log(`  Funcionó? ${worked ? '✅ SÍ' : '❌ NO'}\n`);

    return {
      input: { key, lang },
      output: result,
      worked,
      message: worked 
        ? 'I18n funciona correctamente' 
        : 'I18n NO está traduciendo la clave',
    };
  }
}