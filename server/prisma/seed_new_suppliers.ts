import { PrismaClient, CompanyType, SupplierTier } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding new suppliers...');

  const suppliers = [
    {
      code: 'SUP-001',
      name: 'Synnex FPT',
      industry: 'IT Equipment',
      email: 'sales@fpt.com.vn',
      website: 'https://synnexfpt.com',
      supplierTier: SupplierTier.STRATEGIC,
      trustScore: 95.0,
    },
    {
      code: 'SUP-002',
      name: 'SLA Vietnam',
      industry: 'IT Hardware & Networking',
      email: 'info@sla.vn',
      website: 'https://sla.vn',
      supplierTier: SupplierTier.PREFERRED,
      trustScore: 92.5,
    },
    {
      code: 'SUP-003',
      name: 'VPP Hồng Hà',
      industry: 'Stationery',
      email: 'sales@hongha.vn',
      website: 'https://vpphongha.com.vn',
      supplierTier: SupplierTier.STRATEGIC,
      trustScore: 98.0,
    },
    {
      code: 'SUP-004',
      name: 'An Loc Viet',
      industry: 'Office Supplies',
      email: 'sales@anlocviet.vn',
      website: 'https://anlocviet.vn',
      supplierTier: SupplierTier.PREFERRED,
      trustScore: 90.0,
    },
    {
      code: 'SUP-005',
      name: 'Sang Ha',
      industry: 'Office Supplies',
      email: 'sales@sangha.vn',
      website: 'https://sangha.vn',
      supplierTier: SupplierTier.APPROVED,
      trustScore: 88.0,
    },
  ];

  for (const supplier of suppliers) {
    await prisma.organization.upsert({
      where: { code: supplier.code },
      update: {},
      create: {
        ...supplier,
        companyType: CompanyType.SUPPLIER,
      },
    });
    console.log(`Upserted supplier: ${supplier.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
