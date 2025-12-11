import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { I18nService } from 'nestjs-i18n';
import { MailQueue } from './mail.queue';

/**
 * Opciones de envío genérico
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
  from?: string;
}

/**
 * Respuesta del envío
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isDevelopment: boolean;
  private readonly isSmtpConfigured: boolean;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly mailQueue: MailQueue,
  ) {
    this.isDevelopment =
      this.configService.get<string>('environment') === 'local';

    this.isSmtpConfigured = !!this.configService.get<string>('smtp.host');

    if (!this.isSmtpConfigured) {
      this.logger.warn('⚠️ SMTP NO configurado—los correos se simularán en logs.');
    }
  }

  // ============================================================
  // QUEUE — ENCOLAR EMAILS (siempre se usa desde fuera)
  // ============================================================
  async queueEmail(options: SendEmailOptions) {
    await this.mailQueue.enqueueEmail(options);
    return { queued: true };
  }

  // ============================================================
  // MÉTODO INTERNO → Worker llama a esto
  // ============================================================
  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
      // Simulación si no hay SMTP
      if (!this.isSmtpConfigured) {
        return this.simulateEmail(options);
      }

      const result = await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
        from: options.from || this.configService.get<string>('smtp.from'),
      });

      this.logger.log(`✉️ Email enviado: ${options.to}`);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error enviando email a ${options.to}: ${error.message}`,
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================================
  // SIMULACIÓN EN DESARROLLO
  // ============================================================
  private simulateEmail(options: SendEmailOptions): EmailResult {
    this.logger.log('📧 [SIMULATED EMAIL]');
    this.logger.log(`To: ${options.to}`);
    this.logger.log(`Subject: ${options.subject}`);
    this.logger.log(`Template: ${options.template}`);
    this.logger.log(
      `Context: ${JSON.stringify(options.context, null, 2)}`,
    );

    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  // ============================================================
  // EMAILS ESPECÍFICOS
  // ============================================================

  async sendVerificationEmail(
    email: string,
    userName: string,
    token: string,
    lang = 'en',
  ) {
    const subject = this.i18n.translate(
      'email.templates.verification.subject',
      { lang },
    ) as string;

    const verificationUrl = `${this.configService.get(
      'app.frontendUrl',
    )}/verify-email?token=${token}`;

    return this.queueEmail({
      to: email,
      subject,
      template: `verification/verification.${lang}`,
      context: {
        appName: this.configService.get('app.name'),
        verificationUrl,
        name: userName,
        expiresIn: '24 hours',
      },
    });
  }

  async sendWelcomeEmail(email: string, userName: string, lang = 'en') {
    const subject = this.i18n.translate(
      'email.templates.welcome.subject',
      { lang, args: { userName } },
    ) as string;

    return this.queueEmail({
      to: email,
      subject,
      template: `welcome/welcome.${lang}`,
      context: {
        appName: this.configService.get('app.name'),
        userName,
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    userName: string,
    token: string,
    lang = 'en',
  ) {
    const subject = this.i18n.translate(
      'email.templates.resetPassword.subject',
      { lang },
    ) as string;

    const resetUrl = `${this.configService.get(
      'app.frontendUrl',
    )}/reset-password?token=${token}`;

    return this.queueEmail({
      to: email,
      subject,
      template: `password-reset/password-reset.${lang}`,
      context: {
        name: userName,
        resetUrl,
        expiresIn: '1 hour',
      },
    });
  }

  // ============================================================
  // ENVÍO MASIVO — SIEMPRE usando QUEUE
  // ============================================================
  async sendBulkEmail(
    recipients: string[],
    subject: string,
    template: string,
    context: Record<string, any>,
    lang = 'en',
  ) {
    const results: { queued: boolean }[] = [];

    for (const email of recipients) {
      results.push(
        await this.queueEmail({
          to: email,
          subject,
          template,
          context,
        }),
      );
    }

    return results;
  }

  // ============================================================
  // VALIDACIÓN
  // ============================================================
  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
