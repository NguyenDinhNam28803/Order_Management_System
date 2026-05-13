import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Models that have a deleted_at column for soft-delete
const SOFT_DELETE_MODELS: Prisma.ModelName[] = [
  'PurchaseRequisition',
  'PurchaseOrder',
  'GoodsReceipt',
  'SupplierInvoice',
  'RfqRequest',
];

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
    this.registerSoftDeleteMiddleware();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Automatically filters out soft-deleted records for all read operations.
  // To intentionally include deleted records, pass { where: { deletedAt: { not: null } } }
  // or use $queryRaw for admin/audit purposes.
  private registerSoftDeleteMiddleware() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).$use(
      async (
        params: Prisma.MiddlewareParams,
        next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
      ) => {
        if (
          params.model &&
          SOFT_DELETE_MODELS.includes(params.model as Prisma.ModelName)
        ) {
          const readOps = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'findUniqueOrThrow', 'findFirstOrThrow'];
          if (readOps.includes(params.action)) {
            params.args = params.args ?? {};
            params.args.where = params.args.where ?? {};
            // Only inject if caller has not explicitly filtered deletedAt
            if (params.args.where.deletedAt === undefined) {
              params.args.where.deletedAt = null;
            }
          }

          // Intercept delete → convert to soft delete
          if (params.action === 'delete') {
            params.action = 'update';
            params.args.data = { deletedAt: new Date() };
          }
          if (params.action === 'deleteMany') {
            params.action = 'updateMany';
            params.args.data = params.args.data ?? {};
            (params.args.data as Record<string, unknown>).deletedAt = new Date();
          }
        }
        return next(params);
      },
    );
  }
}
