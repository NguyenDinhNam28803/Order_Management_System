import { Module } from '@nestjs/common';
import { RfqmoduleService } from './rfqmodule.service';
import { RfqmoduleController } from './rfqmodule.controller';
import { RfqRepository } from './rfq.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RfqmoduleController],
  providers: [RfqmoduleService, RfqRepository],
  exports: [RfqmoduleService],
})
export class RfqmoduleModule {}
