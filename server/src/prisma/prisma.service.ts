import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static pool: Pool | null = null;
  private static logger = new Logger('PrismaService');

  constructor(configService: ConfigService) {
    if (!PrismaService.pool) {
      PrismaService.logger.log('Initializing shared database connection pool.');
      PrismaService.pool = new Pool({
        connectionString: configService.get<string>('DATABASE_URL'),
        max: 5,
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 10000,
        allowExitOnIdle: false,
      });
    }

    const adapter = new PrismaPg(PrismaService.pool);

    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
