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
  constructor(private configService: ConfigService) {
    // 1. Khởi tạo Connection Pool từ thư viện 'pg'
    const pool = new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
      max: 20, // Tăng giới hạn lên 20 kết nối để đủ cho 11 API gọi song song
    });

    // 2. Khởi tạo Adapter cho Prisma 7.0
    const adapter = new PrismaPg(pool);

    // 3. Truyền adapter vào constructor của PrismaClient
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
