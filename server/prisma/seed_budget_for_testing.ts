import 'dotenv/config';
import { PrismaClient, BudgetPeriodType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedBudgetForTesting() {
  console.log('Seeding Budget Data for Testing...');

  const fiscalYear = 2026;

  // 1. Find the target cost center (CC_IT_OPS as seen in screenshots)
  const costCenter = await prisma.costCenter.findFirst({
    where: { code: 'CC_IT_OPS' },
  });

  if (!costCenter) {
    console.error('Cost Center CC_IT_OPS not found. Please create it first.');
    return;
  }

  const { orgId, deptId } = costCenter;
  console.log(
    `Found Cost Center: ${costCenter.name} (ID: ${costCenter.id}) for Org: ${orgId}`,
  );

  // 2. Create/Update OrgBudget for the fiscal year
  await prisma.orgBudget.upsert({
    where: { orgId_fiscalYear: { orgId, fiscalYear } },
    update: { totalAmount: 10000000000 }, // 10 Billion VND
    create: {
      orgId,
      fiscalYear,
      totalAmount: 10000000000,
      currency: 'VND',
    },
  });

  // 3. Define Periods to create
  const periods = [
    {
      type: 'ANNUAL',
      num: 1,
      start: `${fiscalYear}-01-01`,
      end: `${fiscalYear}-12-31`,
    },
    {
      type: 'QUARTERLY',
      num: 1,
      start: `${fiscalYear}-01-01`,
      end: `${fiscalYear}-03-31`,
    },
    {
      type: 'QUARTERLY',
      num: 2,
      start: `${fiscalYear}-04-01`,
      end: `${fiscalYear}-06-30`,
    },
    {
      type: 'QUARTERLY',
      num: 3,
      start: `${fiscalYear}-07-01`,
      end: `${fiscalYear}-09-30`,
    },
    {
      type: 'QUARTERLY',
      num: 4,
      start: `${fiscalYear}-10-01`,
      end: `${fiscalYear}-12-31`,
    },
  ];

  for (const p of periods) {
    const period = await prisma.budgetPeriod.upsert({
      where: {
        orgId_fiscalYear_periodType_periodNumber: {
          orgId,
          fiscalYear,
          periodType: BudgetPeriodType.QUARTERLY,
          periodNumber: p.num,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        orgId,
        fiscalYear,
        periodType: BudgetPeriodType.QUARTERLY,
        periodNumber: p.num,
        startDate: new Date(p.start),
        endDate: new Date(p.end),
        isActive: true,
      },
    });

    // 4. Allocate Budget for CC_IT_OPS in this period
    // Assume 2 Billion VND for Annual, and 500 Million VND per Quarter
    const amount = p.type === 'ANNUAL' ? 2000000000 : 500000000;

    await prisma.budgetAllocation.upsert({
      where: {
        budgetPeriodId_costCenterId: {
          budgetPeriodId: period.id,
          costCenterId: costCenter.id,
        },
      },
      update: {
        allocatedAmount: amount,
      },
      create: {
        orgId,
        deptId,
        budgetPeriodId: period.id,
        costCenterId: costCenter.id,
        allocatedAmount: amount,
        currency: 'VND',
        notes: `Seed ${p.type} ${p.num} for testing`,
        committedAmount: 0,
        spentAmount: 0,
      },
    });

    console.log(
      `Successfully seeded ${p.type} ${p.num} with ${amount.toLocaleString()} VND`,
    );
  }

  console.log('Seeding completed successfully!');
}

seedBudgetForTesting()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
