import { registerAs } from '@nestjs/config';

export default registerAs('i18n', () => ({
  fallbackLanguage: process.env.I18N_FALLBACK_LANGUAGE || 'es',
  loaderOptions: {
    path: process.env.I18N_PATH || 'src/i18n/',
    watch: process.env.NODE_ENV === 'local',
  },
}));