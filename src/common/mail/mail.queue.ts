import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';

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

  async enqueueEmail(data: any) {
    try {
      await this.queue.add('send_email', data, {
        attempts: 3,
        backoff: { type: 'fixed', delay: 5000 }, // 5s retry
        removeOnComplete: true,
        removeOnFail: false,
      });

      this.logger.log(`📨 Job añadido a la cola → ${data.to}`);
    } catch (error) {
      this.logger.error('Error al encolar email:', error);
      throw error;
    }
  }
}
