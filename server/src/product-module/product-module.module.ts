import { Module } from '@nestjs/common';
import { ProductModuleService } from './product-module.service';
import { ProductModuleController } from './product-module.controller';
import { ProductModuleRepository } from './product-module.repository';
import { AiServiceModule } from '../ai-service/ai-service.module';

@Module({
  imports: [AiServiceModule],
  controllers: [ProductModuleController],
  providers: [ProductModuleService, ProductModuleRepository],
  exports: [ProductModuleService],
})
export class ProductModuleModule {}
