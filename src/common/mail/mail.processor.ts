import { Injectable, Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Injectable()
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);
  private readonly worker: Worker;

  constructor(
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {
    this.worker = new Worker(
      'email_queue',
      async job => {
        this.logger.log(`▶ Procesando email a: ${job.data.to}`);

        await this.mailService.sendEmail(job.data);

        this.logger.log(`✔ Email enviado → ${job.data.to}`);
      },
      {
        connection: {
          host: this.config.get('redis.host'),
          port: this.config.get('redis.port'),
          password: this.config.get('redis.password'),
          db: this.config.get('redis.db'),
        },
        concurrency: 1, // UNO a la vez = orden garantizado
        limiter: {
          max: 1,        // SOLO 1 job
          duration: 1000 // cada 1 segundo
        },
      }
    );

    this.worker.on('failed', (job, err) => {
      const jobId = job?.id ?? 'unknown';
      this.logger.error(`❌ Job ${jobId} falló → ${err.message}`);
    });

    this.worker.on('completed', job => {
      this.logger.log(`🏁 Job completado → ${job.id}`);
    });
  }
}
