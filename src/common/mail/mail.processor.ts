import { Injectable, Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailJobData } from './mail.queue';

@Injectable()
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);
  private readonly worker: Worker;
  private readonly isSmtpConfigured: boolean;

  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {
    this.isSmtpConfigured = !!this.config.get<string>('smtp.host');

    this.worker = new Worker(
      'email_queue',
      async (job) => {
        this.logger.log(`▶ Procesando email a: ${job.data.to}`);

        const { to, subject, template, context, cc, bcc, attachments, from } = job.data as EmailJobData;

        if (!this.isSmtpConfigured) {
          this.simulateEmail(job.data);
          return { success: true, simulated: true };
        }

        const result = await this.mailerService.sendMail({
          to,
          subject,
          template,
          context,
          cc,
          bcc,
          attachments,
          from: from || this.config.get<string>('smtp.from'),
        });

        this.logger.log(`✔ Email enviado → ${to}`);

        return {
          success: true,
          messageId: result.messageId,
          to,
          timestamp: new Date().toISOString(),
        };
      },
      {
        connection: {
          host: this.config.get('redis.host'),
          port: this.config.get('redis.port'),
          password: this.config.get('redis.password'),
          db: this.config.get('redis.db'),
        },
        concurrency: 1,
        limiter: {
          max: 1,
          duration: 1000,
        },
      },
    );

    this.worker.on('failed', (job, err) => {
      const jobId = job?.id ?? 'unknown';
      this.logger.error(`❌ Job ${jobId} falló → ${err.message}`);
    });

    this.worker.on('completed', (job) => {
      this.logger.log(`🏁 Job completado → ${job.id}`);
    });
  }

  private simulateEmail(data: EmailJobData): void {
    this.logger.log('📧 [SIMULATED EMAIL]');
    this.logger.log(`   To: ${data.to}`);
    this.logger.log(`   Subject: ${data.subject}`);
    this.logger.log(`   Template: ${data.template}`);
  }
}