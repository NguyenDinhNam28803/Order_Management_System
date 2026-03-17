import { Module } from '@nestjs/common';
import { PomoduleService } from './pomodule.service';
import { PomoduleController } from './pomodule.controller';
import { PoRepository } from './po.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ApprovalModuleModule } from 'src/approval-module/approval-module.module';

@Module({
  imports: [PrismaModule, ApprovalModuleModule],
  controllers: [PomoduleController],
  providers: [PomoduleService, PoRepository],
  exports: [PomoduleService],
})
export class PomoduleModule {}
