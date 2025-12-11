import { Global, Module } from '@nestjs/common';
import { CryptoService } from './services/crypto.service';
import { TranslationService } from './services/translation.service';
import { MailModule } from './mail/mail.module';

@Global()
@Module({
  imports: [MailModule],
  providers: [CryptoService,TranslationService],
  exports: [CryptoService,TranslationService,MailModule],
})
export class CommonModule {}