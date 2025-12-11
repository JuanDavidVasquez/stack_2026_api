import { z } from 'zod';

export const envSchema = z
  .object({
    // ==================== DATABASE TOGGLES ====================
    ENABLE_POSTGRES: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .default(true),

    ENABLE_MONGODB: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .default(false),

    ENABLE_REDIS: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .default(true),

    // ==================== APPLICATION ====================
    NODE_ENV: z.enum(['local', 'staging', 'production']).default('local'),

    PORT: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1000).max(65535))
      .default(3000),

    // ==================== I18N ====================
    I18N_FALLBACK_LANGUAGE: z
      .enum(['en', 'es', 'pt'])
      .default('en'),

    I18N_PATH: z
      .string()
      .default('src/i18n/'),

    // ==================== CRIPTOGRAFÍA ====================
    CRYPTO_SECRET_KEY: z
      .string()
      .min(32, 'CRYPTO_SECRET_KEY debe tener al menos 32 caracteres')
      .regex(
        /^[A-Za-z0-9+/=]+$/,
        'CRYPTO_SECRET_KEY debe ser base64 válido'
      ),

    CRYPTO_ALGORITHM: z
      .enum(['aes-256-gcm', 'aes-256-cbc'])
      .default('aes-256-gcm'),

    BCRYPT_ROUNDS: z
      .string()
      .transform(Number)
      .pipe(z.number().min(10).max(15))
      .default(12),

    // ==================== DATABASE (PostgreSQL/MySQL) ====================
    DB_TYPE: z.enum(['postgres', 'mysql', 'mariadb']).optional(),

    DB_HOST: z.string().optional(),

    DB_PORT: z
      .string()
      .transform(Number)
      .pipe(z.number().positive())
      .optional(),

    DB_USERNAME: z.string().optional(),

    DB_PASSWORD: z.string().optional(),

    DB_DATABASE: z.string().optional(),

    DB_SSL: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .default(false),

    DB_SYNCHRONIZE: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .default(false),

    DB_LOGGING: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .default(false),

    // ==================== MONGODB ====================
    MONGODB_URI: z
      .string()
      .url('MONGODB_URI debe ser una URL válida')
      .refine(
        (uri) =>
          uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
        {
          message:
            'MONGODB_URI debe comenzar con mongodb:// o mongodb+srv://',
        },
      )
      .optional(),

    MONGODB_DATABASE: z.string().optional(),

    MONGODB_USE_NEW_URL_PARSER: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .default(true),

    MONGODB_USE_UNIFIED_TOPOLOGY: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .default(true),

    // ==================== REDIS ====================
    REDIS_HOST: z.string().optional(),

    REDIS_PORT: z
      .string()
      .transform(Number)
      .pipe(z.number().positive())
      .default(6379),

    REDIS_PASSWORD: z.string().optional().default(''),

    REDIS_DB: z
      .string()
      .transform(Number)
      .pipe(z.number().min(0).max(15))
      .default(0),

    REDIS_TTL: z
      .string()
      .transform(Number)
      .pipe(z.number().positive())
      .default(3600),

    // ==================== JWT ====================
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET debe tener al menos 32 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
          message:
            'JWT_SECRET debe contener mayúsculas, minúsculas, números y caracteres especiales',
        },
      ),

    JWT_EXPIRES_IN: z
      .string()
      .regex(/^\d+[smhd]$/, {
        message: 'JWT_EXPIRES_IN debe tener formato: 15m, 1h, 7d, etc.',
      })
      .default('1h'),

    JWT_REFRESH_SECRET: z
      .string()
      .min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
          message:
            'JWT_REFRESH_SECRET debe contener mayúsculas, minúsculas, números y caracteres especiales',
        },
      ),

    JWT_REFRESH_EXPIRES_IN: z
      .string()
      .regex(/^\d+[smhd]$/, {
        message:
          'JWT_REFRESH_EXPIRES_IN debe tener formato: 15m, 1h, 7d, etc.',
      })
      .default('7d'),

    // ==================== CORS ====================
    ALLOWED_ORIGINS: z
      .string()
      .transform((str) => str.split(',').map((s) => s.trim()))
      .pipe(z.array(z.string().url()))
      .default(['http://localhost:3000']),

    // ==================== RATE LIMITING ====================
    RATE_LIMIT_TTL: z
      .string()
      .transform(Number)
      .pipe(z.number().positive())
      .default(60),

    RATE_LIMIT_MAX: z
      .string()
      .transform(Number)
      .pipe(z.number().positive())
      .default(10),

    // ==================== FILE UPLOAD ====================
    MAX_FILE_SIZE: z
      .string()
      .transform(Number)
      .pipe(z.number().positive())
      .default(5242880),

    // ==================== LOGGING ====================
    LOG_LEVEL: z
      .enum(['error', 'warn', 'info', 'debug', 'verbose'])
      .default('info'),

    // ==================== EMAIL ====================
    SMTP_HOST: z.string().optional(),

    SMTP_PORT: z
      .string()
      .transform(Number)
      .pipe(z.number().positive())
      .optional(),

    SMTP_USER: z.string().optional(),

    SMTP_PASSWORD: z.string().optional(),

    SMTP_FROM: z.string().email().optional(),
  })
  // ==================== VALIDACIONES CROSS-FIELD ====================
  .refine(
    (data) => {
      // Al menos una base de datos debe estar habilitada
      if (!data.ENABLE_POSTGRES && !data.ENABLE_MONGODB) {
        return false;
      }
      return true;
    },
    {
      message:
        'Debes habilitar al menos una base de datos (ENABLE_POSTGRES o ENABLE_MONGODB)',
      path: ['ENABLE_POSTGRES'],
    },
  )
  .refine(
    (data) => {
      // Si PostgreSQL está habilitado, sus campos son requeridos
      if (data.ENABLE_POSTGRES) {
        return !!(
          data.DB_TYPE &&
          data.DB_HOST &&
          data.DB_PORT &&
          data.DB_USERNAME &&
          data.DB_PASSWORD &&
          data.DB_DATABASE
        );
      }
      return true;
    },
    {
      message:
        'Si ENABLE_POSTGRES=true, debes configurar DB_TYPE, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD y DB_DATABASE',
      path: ['DB_HOST'],
    },
  )
  .refine(
    (data) => {
      // Si MongoDB está habilitado, su URI es requerida
      if (data.ENABLE_MONGODB) {
        return !!data.MONGODB_URI;
      }
      return true;
    },
    {
      message: 'Si ENABLE_MONGODB=true, debes configurar MONGODB_URI',
      path: ['MONGODB_URI'],
    },
  )
  .refine(
    (data) => {
      // Si Redis está habilitado, su host es requerido
      if (data.ENABLE_REDIS) {
        return !!data.REDIS_HOST;
      }
      return true;
    },
    {
      message: 'Si ENABLE_REDIS=true, debes configurar REDIS_HOST',
      path: ['REDIS_HOST'],
    },
  )
  .refine(
    (data) => {
      // En producción, SSL debe estar habilitado si PostgreSQL está activo
      if (
        data.NODE_ENV === 'production' &&
        data.ENABLE_POSTGRES &&
        !data.DB_SSL
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'DB_SSL debe estar habilitado en producción',
      path: ['DB_SSL'],
    },
  )
  .refine(
    (data) => {
      // En producción, synchronize debe estar deshabilitado
      if (
        data.NODE_ENV === 'production' &&
        data.ENABLE_POSTGRES &&
        data.DB_SYNCHRONIZE
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        'DB_SYNCHRONIZE debe estar deshabilitado en producción (usar migraciones)',
      path: ['DB_SYNCHRONIZE'],
    },
  )
  .refine(
    (data) => {
      // JWT secrets deben ser diferentes
      if (data.JWT_SECRET === data.JWT_REFRESH_SECRET) {
        return false;
      }
      return true;
    },
    {
      message: 'JWT_SECRET y JWT_REFRESH_SECRET deben ser diferentes',
      path: ['JWT_REFRESH_SECRET'],
    },
  )
  .refine(
    (data) => {
      // Si hay config SMTP, todos los campos deben estar presentes
      const smtpFields = [
        data.SMTP_HOST,
        data.SMTP_PORT,
        data.SMTP_USER,
        data.SMTP_PASSWORD,
      ];
      const definedFields = smtpFields.filter((field) => field !== undefined);

      if (definedFields.length > 0 && definedFields.length < 4) {
        return false;
      }
      return true;
    },
    {
      message:
        'Si configuras SMTP, debes proporcionar HOST, PORT, USER y PASSWORD',
      path: ['SMTP_HOST'],
    },
  );

// Exportar el tipo inferido automáticamente
export type Env = z.infer<typeof envSchema>;