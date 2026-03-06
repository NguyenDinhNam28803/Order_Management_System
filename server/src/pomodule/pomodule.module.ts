import { Module } from '@nestjs/common';
import { PomoduleService } from './pomodule.service';
import { PomoduleController } from './pomodule.controller';

@Module({
  controllers: [PomoduleController],
  providers: [PomoduleService],
})
export class PomoduleModule {}
