import { Module } from '@nestjs/common';
import { ReviewModuleService } from './review-module.service';
import { ReviewModuleController } from './review-module.controller';

@Module({
  controllers: [ReviewModuleController],
  providers: [ReviewModuleService],
})
export class ReviewModuleModule {}
