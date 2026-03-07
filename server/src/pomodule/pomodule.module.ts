import { Module } from '@nestjs/common';
import { PomoduleService } from './pomodule.service';
import { PomoduleController } from './pomodule.controller';
import { PoRepository } from './po.repository';

@Module({
  controllers: [PomoduleController],
  providers: [PomoduleService, PoRepository],
  exports: [PomoduleService],
})
export class PomoduleModule {}
