import { Module } from '@nestjs/common';
import { GrnmoduleService } from './grnmodule.service';
import { GrnmoduleController } from './grnmodule.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GrnRepository } from './grn.repository';

@Module({
  imports: [PrismaModule],
  controllers: [GrnmoduleController],
  providers: [GrnmoduleService, GrnRepository],
  exports: [GrnmoduleService, GrnRepository],
})
export class GrnmoduleModule {}
