import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool; // ✅ Giữ ref để đóng đúng cách

  constructor(private configService: ConfigService) {
    const pool = new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
      max: 20,                    // ✅ 10–20 là đủ cho NestJS
      idleTimeoutMillis: 30000,   // ✅ 30s thay vì 10s
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: false,     // ✅ Không tự tắt pool
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],      // ✅ Tắt query log ở production
    });

    this.pool = pool; // ✅ Lưu lại ref
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end(); // ✅ Đóng pg pool riêng — quan trọng!
  }
}