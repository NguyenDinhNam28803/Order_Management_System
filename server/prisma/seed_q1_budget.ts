import 'dotenv/config'; // Nạp biến môi trường trước khi khởi tạo Prisma
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Lấy DIRECT_URL từ môi trường (tránh dùng connection pooler của supabase nếu xác thực bị lỗi)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DIRECT_URL is not defined in environment variables');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  const orgId = 'ec9ff575-e291-471c-b334-e8716f97cf07';
  const deptId = '083f55be-1c7c-4fad-96cc-14c92ab2f429';
  const costCenterId = '7c45efe0-2c83-454a-99a0-ec0541d614aa';
  const fiscalYear = new Date().getFullYear();

  console.log('Seeding Budget Data for Q1...');

  // 1. Tạo Budget Period cho Q1
  const period = await prisma.budgetPeriod.upsert({
    where: {
      orgId_fiscalYear_periodType_periodNumber: {
        orgId,
        fiscalYear,
        periodType: 'QUARTERLY',
        periodNumber: 1,
      },
    },
    update: {},
    create: {
      orgId,
      fiscalYear,
      periodType: 'QUARTERLY',
      periodNumber: 1,
      startDate: new Date(`${fiscalYear}-01-01`),
      endDate: new Date(`${fiscalYear}-03-31`),
    },
  });

  // 2. Phân bổ ngân sách cho Cost Center trong kỳ Q1
  const allocation = await prisma.budgetAllocation.upsert({
    where: {
      budgetPeriodId_costCenterId: {
        budgetPeriodId: period.id,
        costCenterId,
      },
    },
    update: {
      allocatedAmount: 500000000, // 500 triệu VND
    },
    create: {
      budgetPeriodId: period.id,
      costCenterId,
      orgId,
      deptId,
      allocatedAmount: 500000000,
      currency: 'VND',
      notes: 'Seed Q1 Budget Allocation',
    },
  });

  console.log('Budget seeded successfully:', allocation);
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
