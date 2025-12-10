import { Global, Module } from '@nestjs/common';
import { CryptoService } from './services/crypto.service';
import { TranslationService } from './services/translation.service';

@Global()
@Module({
  providers: [CryptoService,TranslationService],
  exports: [CryptoService,TranslationService],
})
export class CommonModule {}