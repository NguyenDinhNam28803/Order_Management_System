import { Module } from '@nestjs/common';
import { RfqmoduleService } from './rfqmodule.service';
import { RfqmoduleController } from './rfqmodule.controller';
import { RfqRepository } from './rfq.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AiServiceModule } from 'src/ai-service/ai-service.module';

@Module({
  imports: [PrismaModule, AiServiceModule],
  controllers: [RfqmoduleController],
  providers: [RfqmoduleService, RfqRepository],
  exports: [RfqmoduleService],
})
export class RfqmoduleModule {}
