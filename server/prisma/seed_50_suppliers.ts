import 'dotenv/config';
import {
  PrismaClient,
  CompanyType,
  UserRole,
  SupplierTier,
} from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DIRECT_URL is not defined in environment variables');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('Starting to seed 50 suppliers...');

  const suppliers = Array.from({ length: 50 }).map((_, i) => ({
    code: `SUPP-${1000 + i}`,
    name: `Nhà cung cấp số ${i + 1}`,
    taxCode: `TAX-${10000000 + i}`,
    companyType: CompanyType.SUPPLIER,
    supplierTier: SupplierTier.APPROVED,
    trustScore: 80,
  }));

  for (const supplierData of suppliers) {
    try {
      // 1. Tạo Organization
      const org = await prisma.organization.create({
        data: {
          code: supplierData.code,
          name: supplierData.name,
          taxCode: supplierData.taxCode,
          companyType: supplierData.companyType,
          supplierTier: supplierData.supplierTier,
          trustScore: supplierData.trustScore,
        },
      });

      // 2. Tạo User mặc định cho Supplier
      await prisma.user.create({
        data: {
          orgId: org.id,
          email: `contact_${supplierData.code.toLowerCase()}@example.com`,
          fullName: `Đại diện ${supplierData.name}`,
          role: UserRole.SUPPLIER,
          isActive: true,
        },
      });
      console.log(`Created supplier: ${supplierData.name}`);
    } catch (error) {
      console.error(`Failed to create ${supplierData.name}:`, error.message);
    }
  }

  console.log('Seeding 50 suppliers completed.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
