import { Module } from '@nestjs/common';
import { ProductModuleService } from './product-module.service';
import { ProductModuleController } from './product-module.controller';
import { ProductModuleRepository } from './product-module.repository';

@Module({
  controllers: [ProductModuleController],
  providers: [ProductModuleService, ProductModuleRepository],
  exports: [ProductModuleService],
})
export class ProductModuleModule {}
