import { PrismaClient } from '@prisma/client';
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
  // 1. Lấy một CostCenter bất kỳ
  const costCenter = await prisma.costCenter.findFirst();
  if (!costCenter) {
    console.log('Không tìm thấy CostCenter nào trong database.');
    return;
  }

  // 2. Tạo một BudgetPeriod cho Quý 1 năm 2026
  const period = await prisma.budgetPeriod.create({
    data: {
      orgId: costCenter.orgId,
      fiscalYear: 2026,
      periodType: 'QUARTER',
      periodNumber: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    },
  });

  // 3. Phân bổ ngân sách vào CostCenter đó
  const allocation = await prisma.budgetAllocation.create({
    data: {
      budgetPeriodId: period.id,
      costCenterId: costCenter.id,
      orgId: costCenter.orgId,
      allocatedAmount: 500000000, // 500 triệu VND
      committedAmount: 50000000, // 50 triệu đã cam kết
      spentAmount: 200000000, // 200 triệu đã chi
      currency: 'VND',
      notes: 'Seed data cho Quý 1/2026',
    },
  });

  console.log('Đã tạo xong dữ liệu mẫu:');
  console.log('Cost Center:', costCenter.name);
  console.log('Budget Allocation:', allocation);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
