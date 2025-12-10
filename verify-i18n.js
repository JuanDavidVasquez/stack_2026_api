const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de nest-cli.json\n');

const nestCliPath = path.join(process.cwd(), 'nest-cli.json');

if (!fs.existsSync(nestCliPath)) {
  console.log('❌ nest-cli.json NO EXISTE en la raíz del proyecto');
  console.log('   Esto significa que Nest CLI usa configuración por defecto');
  console.log('   que NO copia archivos JSON.\n');
  console.log('✅ SOLUCIÓN: Copia el archivo nest-cli-fixed.json a la raíz');
  console.log('   y renómbralo a nest-cli.json\n');
  process.exit(0);
}

console.log('📄 nest-cli.json encontrado\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const content = fs.readFileSync(nestCliPath, 'utf-8');
let config;

try {
  config = JSON.parse(content);
  console.log('✅ Archivo JSON válido\n');
  console.log('📋 Contenido actual:\n');
  console.log(JSON.stringify(config, null, 2));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
} catch (error) {
  console.log('❌ nest-cli.json tiene sintaxis inválida');
  console.log('   Error:', error.message);
  process.exit(1);
}

// Verificar configuración de assets
console.log('🔍 DIAGNÓSTICO:\n');

if (!config.compilerOptions) {
  console.log('❌ Falta "compilerOptions"');
  console.log('   Los archivos JSON NO se copiarán a dist/\n');
} else {
  console.log('✅ "compilerOptions" existe');
  
  if (!config.compilerOptions.assets) {
    console.log('❌ Falta "compilerOptions.assets"');
    console.log('   Los archivos JSON NO se copiarán a dist/\n');
  } else {
    console.log('✅ "compilerOptions.assets" existe');
    console.log('   Configuración actual:\n');
    console.log(JSON.stringify(config.compilerOptions.assets, null, 2));
    console.log('');
    
    // Verificar si incluye i18n
    const assetsStr = JSON.stringify(config.compilerOptions.assets);
    const hasI18n = assetsStr.includes('i18n');
    
    if (hasI18n) {
      console.log('✅ Configuración incluye i18n');
    } else {
      console.log('❌ Configuración NO incluye i18n');
      console.log('   Los archivos de i18n NO se copiarán\n');
    }
  }
  
  if (config.compilerOptions.deleteOutDir) {
    console.log('ℹ️  "deleteOutDir": true');
    console.log('   dist/ se borrará en cada compilación\n');
  }
  
  if (config.compilerOptions.watchAssets !== undefined) {
    console.log(`ℹ️  "watchAssets": ${config.compilerOptions.watchAssets}`);
    console.log('   Los assets se', config.compilerOptions.watchAssets ? 'SÍ' : 'NO', 'recargarán en desarrollo\n');
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📝 RECOMENDACIÓN:\n');

const hasProblems = 
  !config.compilerOptions || 
  !config.compilerOptions.assets || 
  !JSON.stringify(config.compilerOptions.assets).includes('i18n');

if (hasProblems) {
  console.log('❌ Tu configuración NO copiará los archivos i18n correctamente\n');
  console.log('✅ SOLUCIÓN:\n');
  console.log('1. Reemplaza tu nest-cli.json con el contenido de nest-cli-fixed.json\n');
  console.log('2. O actualiza manualmente para que tenga:\n');
  console.log('   {');
  console.log('     "compilerOptions": {');
  console.log('       "assets": [');
  console.log('         {');
  console.log('           "include": "i18n/**/*",');
  console.log('           "outDir": "dist"');
  console.log('         }');
  console.log('       ],');
  console.log('       "watchAssets": true');
  console.log('     }');
  console.log('   }\n');
  console.log('3. Luego ejecuta:');
  console.log('   rmdir /s /q dist');
  console.log('   npm run start:dev\n');
} else {
  console.log('✅ Tu configuración parece correcta');
  console.log('   Si los archivos siguen vacíos, el problema puede estar');
  console.log('   en los archivos fuente en src/i18n/\n');
  console.log('   Verifica con: node find-json-error.js\n');
}