import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findCC() {
  const cc = await prisma.costCenter.findFirst({
    where: { code: 'CC_IT_OPS' }
  });
  console.log('Cost Center:', cc);

  const org = await prisma.organization.findFirst({
    where: { id: cc?.orgId }
  });
  console.log('Org:', org);

  const budgetPeriods = await prisma.budgetPeriod.findMany({
    where: { orgId: org?.id }
  });
  console.log('Budget Periods:', budgetPeriods);
}

findCC()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
