import { PrismaClient, CurrencyCode } from '@prisma/client';
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
  const orgId = 'ec9ff575-e291-471c-b334-e8716f97cf07';
  const fiscalYear = 2026;
  const totalBudget = 5000000000; // 5 tỷ VND

  // 1. Cập nhật OrgBudget
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const orgBudget = await prisma.orgBudget.upsert({
    where: {
      orgId_fiscalYear: { orgId, fiscalYear },
    },
    update: { totalAmount: totalBudget },
    create: {
      orgId,
      fiscalYear,
      totalAmount: totalBudget,
      currency: CurrencyCode.VND,
    },
  });
  console.log('Đã cập nhật OrgBudget:', orgBudget.totalAmount.toString());

  // 2. Tìm Cost Centers
  const costCenters = await prisma.costCenter.findMany({ where: { orgId } });

  // 3. Giả lập chia đều ngân sách cho 3 Cost Center (ví dụ: mỗi cái 1.66 tỷ)
  const allocationAmount = totalBudget / costCenters.length;

  // 4. Tạo/Cập nhật BudgetPeriod (Quý 1 - 2026)
  const period = await prisma.budgetPeriod.upsert({
    where: {
      orgId_fiscalYear_periodType_periodNumber: {
        orgId,
        fiscalYear,
        periodType: 'QUARTER',
        periodNumber: 1,
      },
    },
    update: {},
    create: {
      orgId,
      fiscalYear,
      periodType: 'QUARTER',
      periodNumber: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
    },
  });

  // 5. Phân bổ ngân sách
  for (const cc of costCenters) {
    const allocation = await prisma.budgetAllocation.upsert({
      where: {
        budgetPeriodId_costCenterId: {
          budgetPeriodId: period.id,
          costCenterId: cc.id,
        },
      },
      update: { allocatedAmount: allocationAmount },
      create: {
        budgetPeriodId: period.id,
        costCenterId: cc.id,
        orgId,
        allocatedAmount: allocationAmount,
        currency: CurrencyCode.VND,
        notes: `Phân bổ tự động từ OrgBudget (5 tỷ) cho Quý 1/2026`,
      },
    });
    console.log(
      `- Đã phân bổ ${allocation.allocatedAmount.toString()} cho Cost Center: ${cc.name}`,
    );
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
