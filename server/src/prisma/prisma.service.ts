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

const READ_OPS = new Set([
  'findUnique',
  'findFirst',
  'findMany',
  'count',
  'aggregate',
  'findUniqueOrThrow',
  'findFirstOrThrow',
]);

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
        max: 20,
        idleTimeoutMillis: 30000,
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
    this.applySoftDeleteExtension();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Automatically filters out soft-deleted records for all read operations.
  // To intentionally include deleted records, use $queryRaw for admin/audit purposes.
  // Converts delete/deleteMany → soft delete (sets deletedAt) for protected models.
  private applySoftDeleteExtension(): void {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
    const self = this as any;

    const extended = self.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }: any) {
            if (!(SOFT_DELETE_MODELS as string[]).includes(model)) {
              return query(args);
            }

            // Inject deletedAt: null filter for all read operations
            if (READ_OPS.has(operation)) {
              const where = { ...(args.where ?? {}) };
              if (where.deletedAt === undefined) {
                where.deletedAt = null;
              }
              return query({ ...args, where });
            }

            // Convert delete → soft delete
            if (operation === 'delete') {
              const key: string = model[0].toLowerCase() + model.slice(1);
              return self[key].update({
                where: args.where,
                data: { deletedAt: new Date() },
              });
            }

            // Convert deleteMany → soft deleteMany
            if (operation === 'deleteMany') {
              const key: string = model[0].toLowerCase() + model.slice(1);
              return self[key].updateMany({
                where: args.where,
                data: { ...(args.data ?? {}), deletedAt: new Date() },
              });
            }

            return query(args);
          },
        },
      },
    });

    // Overlay the extended model delegates onto this instance.
    // Extended delegates are own-enumerable properties on the client, so Object.assign copies them.
    Object.assign(this, extended);
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/require-await */
  }
}
