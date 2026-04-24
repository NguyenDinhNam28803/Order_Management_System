import { Module } from '@nestjs/common';
import { SupplierVettingController } from './supplier-vetting-module.controller';
import { SupplierVettingService } from './supplier-vetting-module.service';
import { ApprovalModuleModule } from '../approval-module/approval-module.module';

@Module({
  imports: [ApprovalModuleModule],
  controllers: [SupplierVettingController],
  providers: [SupplierVettingService],
  exports: [SupplierVettingService],
})
export class SupplierVettingModule {}
