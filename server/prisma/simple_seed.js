const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- STARTING SEED Q1 2026 WITH ADAPTER ---');
  
  const org = await prisma.organization.findFirst();
  const ccs = await prisma.costCenter.findMany();
  
  // Use CC_IT_OPS if found, or first CC
  const cc = ccs.find(c => c.code === 'CC_IT_OPS') || ccs[0];

  if (!org || !cc) {
    console.log('Org or CC not found.');
    return;
  }

  console.log(`Using Org: ${org.id}, CC: ${cc.id} (${cc.code})`);

  // 1. Budget Period
  const period = await prisma.budgetPeriod.upsert({
    where: {
      orgId_fiscalYear_periodType_periodNumber: {
        orgId: org.id,
        fiscalYear: 2026,
        periodType: 'QUARTERLY',
        periodNumber: 1
      }
    },
    update: { isActive: true },
    create: {
      orgId: org.id,
      fiscalYear: 2026,
      periodType: 'QUARTERLY',
      periodNumber: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      isActive: true
    }
  });

  console.log(`Period ID: ${period.id}`);

  // 2. Allocation
  const alloc = await prisma.budgetAllocation.upsert({
    where: {
      budgetPeriodId_costCenterId: {
        budgetPeriodId: period.id,
        costCenterId: cc.id
      }
    },
    update: { allocatedAmount: 1000000000 },
    create: {
      orgId: org.id,
      budgetPeriodId: period.id,
      costCenterId: cc.id,
      allocatedAmount: 1000000000,
      currency: 'VND',
      notes: 'Auto-seeded for testing Q1 Budget'
    }
  });

  console.log(`Allocation ID: ${alloc.id}`);
  console.log('--- SUCCESS: 1,000,000,000 VND allocated for Q1 2026 ---');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
