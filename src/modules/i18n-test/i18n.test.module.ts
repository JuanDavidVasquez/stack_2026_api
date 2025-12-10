import { Module } from '@nestjs/common';
import { I18nTestController } from './i18n.test.controller';
import { I18nDebugController } from './i18n-debug.controller';


@Module({
  controllers: [I18nTestController,I18nDebugController],
})
export class I18nTestModule {}