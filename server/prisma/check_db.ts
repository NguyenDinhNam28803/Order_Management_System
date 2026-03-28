import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const orgs = await prisma.organization.findMany();
  console.log('Orgs:', JSON.stringify(orgs.map(o => ({ id: o.id, name: o.name, code: o.code })), null, 2));

  const depts = await prisma.department.findMany();
  console.log('Depts:', JSON.stringify(depts.map(d => ({ id: d.id, name: d.name, code: d.code })), null, 2));

  const costCenters = await prisma.costCenter.findMany();
  console.log('Cost Centers:', JSON.stringify(costCenters.map(cc => ({ id: cc.id, name: cc.name, code: cc.code })), null, 2));

  const budgetPeriods = await prisma.budgetPeriod.findMany();
  console.log('Budget Periods:', JSON.stringify(budgetPeriods.map(bp => ({ id: bp.id, fiscalYear: bp.fiscalYear, periodType: bp.periodType, periodNumber: bp.periodNumber })), null, 2));
}

check()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
