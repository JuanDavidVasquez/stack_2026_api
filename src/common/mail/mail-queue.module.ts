import { Module } from '@nestjs/common';
import { MailQueue } from './mail.queue';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [MailQueue, MailProcessor, MailService, ConfigService],
  exports: [MailQueue],
})
export class MailQueueModule {}
