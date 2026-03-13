import { Module } from '@nestjs/common';
import { AiService } from './ai-service.service';
import { AiController } from './ai-service.controller';

@Module({
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiServiceModule {}
