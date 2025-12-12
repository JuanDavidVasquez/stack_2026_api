import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { MailQueue, EmailJobData } from './mail.queue';
import { EMAIL_TEMPLATES, EmailTemplateParams } from './mail.config.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailQueue: MailQueue,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  private getBaseContext(lang = 'en'): Record<string, any> {
    const origins = this.configService.get<string[]>('cors.allowedOrigins') || [];
    return {
      appName: this.i18n.translate('email.appName', { lang }) as string,
      frontendUrl: origins[0] || 'http://localhost:3000',
      supportEmail: this.configService.get<string>('smtp.from') || 'support@example.com',
      currentYear: new Date().getFullYear(),
      lang,
    };
  }

  async sendEmail(
    options: EmailJobData,
    queueOptions?: { priority?: number; delay?: number; attempts?: number },
  ): Promise<void> {
    await this.mailQueue.enqueueEmail(options, queueOptions);
  }

  async sendTemplatedEmail<T extends keyof typeof EMAIL_TEMPLATES>(
    to: string,
    templateKey: T,
    params: EmailTemplateParams<T>,
    lang = 'en',
    options?: {
      cc?: string | string[];
      bcc?: string | string[];
      attachments?: any[];
      priority?: number;
      delay?: number;
      attempts?: number;
    },
  ): Promise<void> {
    const config = EMAIL_TEMPLATES[templateKey];

    if (!config) {
      throw new Error(`Template no encontrado: ${templateKey as string}`);
    }

    const baseContext = this.getBaseContext(lang);
    const fullContext = config.buildContext(params, baseContext);

    const subject = this.i18n.translate(config.subjectKey, {
      lang,
      args: params,
    }) as string;

    const templatePath = `${config.templateName}.${lang}.hbs`;

    await this.sendEmail(
      {
        to,
        subject,
        template: templatePath,
        context: fullContext,
        cc: options?.cc,
        bcc: options?.bcc,
        attachments: options?.attachments,
      },
      {
        priority: options?.priority,
        delay: options?.delay,
        attempts: options?.attempts,
      },
    );
  }

  async sendBulkEmail(
    recipients: string[],
    subject: string,
    template: string,
    context: Record<string, any>,
    options?: { priority?: number; attempts?: number },
  ): Promise<void> {
    const emails: EmailJobData[] = recipients.map((email) => ({
      to: email,
      subject,
      template,
      context,
    }));

    await this.mailQueue.enqueueBulkEmails(emails, options);
  }

  async sendBulkTemplatedEmail<T extends keyof typeof EMAIL_TEMPLATES>(
    recipients: string[],
    templateKey: T,
    params: EmailTemplateParams<T>,
    lang = 'en',
    options?: { priority?: number; attempts?: number },
  ): Promise<void> {
    const config = EMAIL_TEMPLATES[templateKey];

    if (!config) {
      throw new Error(`Template no encontrado: ${templateKey as string}`);
    }

    const baseContext = this.getBaseContext(lang);
    const fullContext = config.buildContext(params, baseContext);

    const subject = this.i18n.translate(config.subjectKey, {
      lang,
      args: params,
    }) as string;

    const templatePath = `${config.templateName}.${lang}.hbs`;

    await this.sendBulkEmail(recipients, subject, templatePath, fullContext, options);
  }
}