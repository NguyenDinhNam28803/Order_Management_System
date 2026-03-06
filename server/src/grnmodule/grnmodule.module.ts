import { Module } from '@nestjs/common';
import { GrnmoduleService } from './grnmodule.service';
import { GrnmoduleController } from './grnmodule.controller';

@Module({
  controllers: [GrnmoduleController],
  providers: [GrnmoduleService],
})
export class GrnmoduleModule {}
