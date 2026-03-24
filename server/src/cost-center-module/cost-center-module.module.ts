import { Module } from '@nestjs/common';
import { CostCenterModuleService } from './cost-center-module.service';
import { CostCenterModuleController } from './cost-center-module.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CostCenterModuleController],
  providers: [CostCenterModuleService],
  exports: [CostCenterModuleService],
})
export class CostCenterModuleModule {}
