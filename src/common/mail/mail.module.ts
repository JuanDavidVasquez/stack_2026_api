import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';
import { MailQueueModule } from './mail-queue.module';

@Module({
  imports: [
    // Configuración del MailerModule
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const environment = configService.get<string>('environment');
        const smtpHost = configService.get<string>('smtp.host');

        // Configuración base
        const config: any = {
          // ==================== TRANSPORT ====================
          transport: {
            host: smtpHost || 'localhost',
            port: configService.get<number>('smtp.port') || 587,
            secure: configService.get<number>('smtp.port') === 465, // true para 465, false para otros
            auth: smtpHost
              ? {
                  user: configService.get<string>('smtp.user'),
                  pass: configService.get<string>('smtp.password'),
                }
              : undefined,
            // Configuración adicional para mejor deliverability
            pool: true, // Usar pool de conexiones
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000, // 1 segundo
            rateLimit: 5, // 5 emails por segundo
          },

          // ==================== DEFAULTS ====================
          defaults: {
            from: configService.get<string>('smtp.from') || '"No Reply" <noreply@example.com>',
          },

          // ==================== PREVIEW (Solo desarrollo) ====================
          preview: environment === 'dev',

          // ==================== TEMPLATES ====================
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter({
              // Helpers personalizados de Handlebars
              eq: (a: any, b: any) => a === b,
              ne: (a: any, b: any) => a !== b,
              lt: (a: number, b: number) => a < b,
              gt: (a: number, b: number) => a > b,
              lte: (a: number, b: number) => a <= b,
              gte: (a: number, b: number) => a >= b,
              and: (a: any, b: any) => a && b,
              or: (a: any, b: any) => a || b,
              not: (a: any) => !a,
              
              // Helper para formatear fechas
              formatDate: (date: Date | string, locale: string = 'en-US') => {
                const d = typeof date === 'string' ? new Date(date) : date;
                return d.toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
              },

              // Helper para formatear hora
              formatTime: (date: Date | string, locale: string = 'en-US') => {
                const d = typeof date === 'string' ? new Date(date) : date;
                return d.toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              },

              // Helper para capitalizar texto
              capitalize: (str: string) => {
                if (!str) return '';
                return str.charAt(0).toUpperCase() + str.slice(1);
              },

              // Helper para uppercase
              uppercase: (str: string) => str?.toUpperCase() || '',

              // Helper para lowercase
              lowercase: (str: string) => str?.toLowerCase() || '',

              // Helper para truncar texto
              truncate: (str: string, length: number) => {
                if (!str) return '';
                return str.length > length ? str.substring(0, length) + '...' : str;
              },

              // Helper para URLs
              urlEncode: (str: string) => encodeURIComponent(str),

              // Helper condicional if_eq
              if_eq: function (this: any, a: any, b: any, opts: any) {
                if (a === b) {
                  return opts.fn(this);
                } else {
                  return opts.inverse(this);
                }
              },

              // Helper condicional if_ne
              if_ne: function (this: any, a: any, b: any, opts: any) {
                if (a !== b) {
                  return opts.fn(this);
                } else {
                  return opts.inverse(this);
                }
              },

              // Helper para iterar con índice
              eachWithIndex: function (this: any, array: any[], opts: any) {
                if (!array || array.length === 0) {
                  return opts.inverse(this);
                }
                let result = '';
                for (let i = 0; i < array.length; i++) {
                  result += opts.fn({ ...array[i], index: i, first: i === 0, last: i === array.length - 1 });
                }
                return result;
              },

              // Helper para JSON stringify (debugging)
              json: (obj: any) => JSON.stringify(obj, null, 2),

              // Helper para año actual
              currentYear: () => new Date().getFullYear(),
            }),
            options: {
              strict: true,
              partials: {
                dir: join(__dirname, 'templates/partials'),
                options: {
                  // Configuración de partials
                },
              },
            },
          },
        };

        // ==================== MODO DESARROLLO SIN SMTP ====================
        if (environment === 'local' && !smtpHost) {
          console.log('⚠️  SMTP no configurado. Usando transport de desarrollo (ethereal).');
          
          // En desarrollo sin SMTP, usar ethereal (opcional)
          // O simplemente usar un transport "falso"
          config.transport = {
            jsonTransport: true, // Simula el envío
          };
        }

        return config;
      },
    }),
    MailQueueModule,
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}