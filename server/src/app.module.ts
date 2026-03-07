import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
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
import { ProductModuleModule } from './product-module/product-module.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { HashPasswordService } from './hash-password/hash-password.service';
import { ContractModuleModule } from './contract-module/contract-module.module';
import { BudgetModuleModule } from './budget-module/budget-module.module';
import { AuditModuleModule } from './audit-module/audit-module.module';
import { SystemConfigModuleModule } from './system-config-module/system-config-module.module';

@Module({
  imports: [
    PrismaModule,
    AuthModuleModule,
    UserModuleModule,
    ProductModuleModule,
    PrmoduleModule,
    RfqmoduleModule,
    PomoduleModule,
    GrnmoduleModule,
    InvoiceModuleModule,
    PaymentModuleModule,
    SupplierKpimoduleModule,
    ReviewModuleModule,
    DisputeModuleModule,
    NotificationModuleModule,
    ApprovalModuleModule,
    AdminModuleModule,
    ReportModuleModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: redisStore,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      }),
    }),
    ContractModuleModule,
    BudgetModuleModule,
    AuditModuleModule,
    SystemConfigModuleModule,
  ],
  controllers: [AppController],
  providers: [AppService, HashPasswordService],
})
export class AppModule {}
