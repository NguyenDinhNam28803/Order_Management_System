import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
// import * as redisStore from 'cache-manager-ioredis-yet';
import { JwtModule } from '@nestjs/jwt';
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
import { HashPasswordService } from './hash-password/hash-password.service';
import { ContractModuleModule } from './contract-module/contract-module.module';
import { BudgetModuleModule } from './budget-module/budget-module.module';
import { AuditModuleModule } from './audit-module/audit-module.module';
import { SystemConfigModuleModule } from './system-config-module/system-config-module.module';
import { AiServiceModule } from './ai-service/ai-service.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CostCenterModuleModule } from './cost-center-module/cost-center-module.module';
import { OrganizationModuleModule } from './organization-module/organization-module.module';
import { AutomationModule } from './common/automation/automation.module';
import { RagModule } from './rag/rag.module';
import { EmailProcessorModule } from './email-processor/email-processor.module';
import { SupplierDiscoveryModule } from './supplier-discovery/supplier-discovery.module';
import { SupplierVettingModule } from './supplier-vetting-module/supplier-vetting-module.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 600,
      max: 1000,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '15m';
        if (!secret) throw new Error('JWT_SECRET is not defined');
        return {
          secret: secret,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          signOptions: { expiresIn: expiresIn as any },
        };
      },
    }),
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
    ContractModuleModule,
    BudgetModuleModule,
    AuditModuleModule,
    SystemConfigModuleModule,
    AiServiceModule,
    CostCenterModuleModule,
    OrganizationModuleModule,
    AutomationModule,
    RagModule,
    EmailProcessorModule,
    SupplierDiscoveryModule,
    SupplierVettingModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HashPasswordService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
