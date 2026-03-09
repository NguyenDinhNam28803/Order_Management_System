import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { HashPasswordService } from './hash-password/hash-password.service';
import { ContractModuleModule } from './contract-module/contract-module.module';
import { BudgetModuleModule } from './budget-module/budget-module.module';
import { AuditModuleModule } from './audit-module/audit-module.module';
import { SystemConfigModuleModule } from './system-config-module/system-config-module.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '15m'; // Lấy từ env hoặc mặc định 15m

        if (!secret) {
          throw new Error('JWT_SECRET is not defined in .env file');
        }

        return {
          secret: secret,
          signOptions: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            expiresIn: expiresIn as any, // Dùng 'as any' hoặc đảm bảo nó là string/number hợp lệ
          },
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
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD'),
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
