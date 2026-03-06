import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModuleModule } from './auth-module/auth-module.module';
import { UserModuleModule } from './user-module/user-module.module';
import { PrmoduleModule } from './prmodule/prmodule.module';
import { RfqmoduleModule } from './rfqmodule/rfqmodule.module';
import { PomoduleModule } from './pomodule/pomodule.module';
import { GrnmoduleModule } from './grnmodule/grnmodule.module';
import { InvoiceModuleModule } from './invoice-module/invoice-module.module';
import { PaymentModuleModule } from './payment-module/payment-module.module';
import { SupplierKpimoduleModule } from './supplier-kpimodule/supplier-kpimodule.module';
import { ReviewModuleModule } from './review-module/review-module.module';
import { DisputeModuleModule } from './dispute-module/dispute-module.module';
import { NotificationModuleModule } from './notification-module/notification-module.module';
import { ApprovalModuleModule } from './approval-module/approval-module.module';
import { AdminModuleModule } from './admin-module/admin-module.module';
import { ReportModuleModule } from './report-module/report-module.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModuleModule, UserModuleModule, PrmoduleModule, RfqmoduleModule, PomoduleModule, GrnmoduleModule, InvoiceModuleModule, PaymentModuleModule, SupplierKpimoduleModule, ReviewModuleModule, DisputeModuleModule, NotificationModuleModule, ApprovalModuleModule, AdminModuleModule, ReportModuleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
