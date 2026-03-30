import 'dotenv/config';
import { PrismaClient, BudgetPeriodType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  const orgId = '58d0a759-0651-4b2b-b8f9-d58d3a3001af';
  const fiscalYear = 2026;

  const quarters = [
    { q: 1, start: '01-01', end: '03-31' },
    { q: 2, start: '04-01', end: '06-30' },
    { q: 3, start: '07-01', end: '09-30' },
    { q: 4, start: '10-01', end: '12-31' },
  ];

  console.log(`🚀 Seeding Budget Periods and Allocations for ${fiscalYear}...`);

  for (const item of quarters) {
    // 1. Upsert Budget Period
    await prisma.budgetPeriod.upsert({
      where: {
        orgId_fiscalYear_periodType_periodNumber: {
          orgId,
          fiscalYear,
          periodType: BudgetPeriodType.QUARTERLY,
          periodNumber: item.q,
        },
      },
      update: {
        startDate: new Date(`${fiscalYear}-${item.start}`),
        endDate: new Date(`${fiscalYear}-${item.end}`),
      },
      create: {
        orgId,
        fiscalYear,
        periodType: BudgetPeriodType.QUARTERLY,
        periodNumber: item.q,
        startDate: new Date(`${fiscalYear}-${item.start}`),
        endDate: new Date(`${fiscalYear}-${item.end}`),
      },
    });

    console.log(`✅ Finished seeding Q${item.q}`);
  }
}

seed()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('✨ All quarters seeded successfully!');
  });
