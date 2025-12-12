import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
  from?: string;
}

@Injectable()
export class MailQueue {
  private readonly logger = new Logger(MailQueue.name);
  private readonly queue: Queue;

  constructor(private readonly config: ConfigService) {
    this.queue = new Queue('email_queue', {
      connection: {
        host: this.config.get('redis.host'),
        port: this.config.get('redis.port'),
        password: this.config.get('redis.password'),
        db: this.config.get('redis.db'),
      },
    });
  }

  async enqueueEmail(data: EmailJobData, options?: { priority?: number; delay?: number; attempts?: number }) {
    try {
      await this.queue.add('send_email', data, {
        attempts: options?.attempts || 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
        priority: options?.priority || 0,
        delay: options?.delay || 0,
      });

      this.logger.log(`📨 Job añadido a la cola → ${data.to}`);
    } catch (error) {
      this.logger.error('Error al encolar email:', error);
      throw error;
    }
  }

  async enqueueBulkEmails(emails: EmailJobData[], options?: { priority?: number; attempts?: number }) {
    try {
      const jobs = emails.map((data) => ({
        name: 'send_email',
        data,
        opts: {
          attempts: options?.attempts || 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false,
          priority: options?.priority || 0,
        },
      }));

      await this.queue.addBulk(jobs);

      this.logger.log(`📨 ${emails.length} emails encolados en bulk`);
    } catch (error) {
      this.logger.error('Error al encolar emails en bulk:', error);
      throw error;
    }
  }
}