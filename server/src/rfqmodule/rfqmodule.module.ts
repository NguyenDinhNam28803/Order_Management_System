import { Module } from '@nestjs/common';
import { RfqmoduleService } from './rfqmodule.service';
import { RfqmoduleController } from './rfqmodule.controller';

@Module({
  controllers: [RfqmoduleController],
  providers: [RfqmoduleService],
})
export class RfqmoduleModule {}
