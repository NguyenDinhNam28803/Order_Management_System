import { Module } from '@nestjs/common';
import { PrmoduleService } from './prmodule.service';
import { PrmoduleController } from './prmodule.controller';

@Module({
  controllers: [PrmoduleController],
  providers: [PrmoduleService],
})
export class PrmoduleModule {}
