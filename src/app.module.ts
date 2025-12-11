import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@nestjs-modules/ioredis';
import { APP_FILTER, APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import {
  AcceptLanguageResolver,
  CookieResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';

// Configs
import { validate } from './config/env.validation';
import configuration from './config/configuration';
import i18nConfig from './config/i18n.config';

// Models - Importar array de entidades
import { ENTITIES } from './models';

// Modules
import { UsersModule } from './modules/users/users.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';

// Filters, Pipes & Interceptors
import { I18nExceptionFilter } from './common/filters/i18n-exception.filter';
import { I18nValidationPipe } from './common/pipes/i18n-validation.pipe';
import { LanguageInterceptor } from './common/interceptors/language.interceptor'; // ← NUEVO
import { I18nTestModule } from './modules/i18n-test/i18n.test.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { logger } from 'handlebars';

@Module({
  imports: [
    // ==================== CONFIG MODULE ====================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `env/.env.${process.env.NODE_ENV || 'local'}`,
      load: [configuration, i18nConfig],
      validate,
      cache: true,
    }),

// ==================== I18N MODULE ====================
I18nModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    fallbackLanguage: configService.get<string>('i18n.fallbackLanguage', 'en'),
    loaderOptions: {
      path: join(__dirname, '/i18n/'), // ← CRÍTICO: Ruta relativa a __dirname (/dist)
      watch: configService.get<string>('environment') === 'local',
    },
  }),
    resolvers: [
      { use: QueryResolver, options: ['lang'] },    
      new HeaderResolver(['x-lang']),      
      new CookieResolver(['lang', 'i18nLang']),
      AcceptLanguageResolver,   
    ],
  inject: [ConfigService],
}),

    // ==================== TYPEORM (PostgreSQL/MySQL) ====================
    // Solo se importa si ENABLE_POSTGRES=true
    ...(process.env.ENABLE_POSTGRES === 'true'
      ? [
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              type: configService.get<'postgres' | 'mysql' | 'mariadb'>(
                'database.type',
              ),
              host: configService.get<string>('database.host'),
              port: configService.get<number>('database.port'),
              username: configService.get<string>('database.username'),
              password: configService.get<string>('database.password'),
              database: configService.get<string>('database.database'),

              // ==================== ENTITIES ====================
              entities: ENTITIES,
              autoLoadEntities: true,

              // ==================== MIGRATIONS ====================
              migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
              migrationsTableName: 'migrations',

              // ==================== SSL ====================
              ssl: configService.get<boolean>('database.ssl')
                ? {
                    rejectUnauthorized: false,
                  }
                : false,

              // ==================== SYNC & LOGGING ====================
              synchronize: configService.get<boolean>('database.synchronize'),
              logging: configService.get<boolean>('database.logging'),
              logger: 'advanced-console',

              // ==================== CONNECTION POOL ====================
              extra: {
                max: 10,
                min: 2,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
              },
            }),
          }),
        ]
      : []),

    // ==================== MONGOOSE (MongoDB) ====================
    // Solo se importa si ENABLE_MONGODB=true
    ...(process.env.ENABLE_MONGODB === 'true'
      ? [
          MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              uri: configService.get<string>('mongodb.uri'),
              dbName: configService.get<string>('mongodb.database'),
            }),
          }),
        ]
      : []),
// ==================== REDIS ====================
...(process.env.ENABLE_REDIS === 'true'
  ? [
      RedisModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const host = configService.get<string>('redis.host');
          const port = configService.get<number>('redis.port');
          const password = configService.get<string>('redis.password');
          const db = configService.get<number>('redis.db');

          console.log('🔌 Redis config:', { host, port, password, db });

          return {
            type: 'single',
            options: {
              host,
              port,
              password,
              db,

              // 🔁 Reconexión automática si Redis se cae
              retryStrategy: (times) => {
                console.log(`⚠️ Redis retry #${times}`);
                return Math.min(times * 500, 2000); // intervalo creciente
              },

              // 🚨 Manejo de errores
              reconnectOnError(err) {
                console.error('❌ Redis error:', err);
                return true;
              },
            },
          };
        },
      }),
    ]
  : []),


    // ==================== APP MODULES ====================
    CommonModule,
    UsersModule,
    AuthModule,
    I18nTestModule,
    OnboardingModule, 
  ],
  providers: [
    // Global i18n exception filter
    {
      provide: APP_FILTER,
      useClass: I18nExceptionFilter,
    },
    // Global i18n validation pipe
    {
      provide: APP_PIPE,
      useClass: I18nValidationPipe,
    },
    // ← NUEVO: Global language interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LanguageInterceptor,
    },
  ],
})
export class AppModule {}