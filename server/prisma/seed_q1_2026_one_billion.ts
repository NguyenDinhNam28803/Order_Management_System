import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedQ1Budget() {
  console.log('Seeding 1 Billion VND for Q1 2026 for first CostCenter found...');

  const fiscalYear = 2026;
  const quarter = 1;
  const amount = 1000000000; // 1 Billion VND

  // 1. Find a CostCenter to use
  let costCenter = await prisma.costCenter.findFirst({
    where: { code: 'CC_IT_OPS' }
  });

  if (!costCenter) {
    costCenter = await prisma.costCenter.findFirst();
  }

  if (!costCenter) {
    console.error('No CostCenter found in database. Seed aborted.');
    return;
  }

  const { orgId, deptId, id: costCenterId, code, name } = costCenter;
  console.log(`Targeting CC: ${name} (${code}) [ID: ${costCenterId}]`);

  // 2. Ensure BudgetPeriod exists for Q1 2026
  const period = await prisma.budgetPeriod.upsert({
    where: {
      orgId_fiscalYear_periodType_periodNumber: {
        orgId,
        fiscalYear,
        periodType: 'QUARTERLY',
        periodNumber: quarter,
      },
    },
    update: { isActive: true },
    create: {
      orgId,
      fiscalYear,
      periodType: 'QUARTERLY',
      periodNumber: quarter,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      isActive: true,
    },
  });

  console.log(`Using BudgetPeriod Q1 2026 [ID: ${period.id}]`);

  // 3. Create/Update Allocation
  const existingAlloc = await prisma.budgetAllocation.findFirst({
    where: {
      budgetPeriodId: period.id,
      costCenterId,
      categoryId: null,
    },
  });

  if (existingAlloc) {
    await prisma.budgetAllocation.update({
      where: { id: existingAlloc.id },
      data: { allocatedAmount: amount },
    });
  } else {
    await prisma.budgetAllocation.create({
      data: {
        orgId,
        deptId,
        budgetPeriodId: period.id,
        costCenterId,
        allocatedAmount: amount,
        currency: 'VND',
        notes: 'Test budget for Q1 2026 created by AntiGravity',
        categoryId: null,
      },
    });
  }

  console.log(`SUCCESS: Allocated ${amount.toLocaleString()} VND to CC: ${name} for Q1 2026.`);
}

seedQ1Budget()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
