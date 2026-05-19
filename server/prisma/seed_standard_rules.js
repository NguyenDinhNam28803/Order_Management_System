const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- SEEDING APPROVAL RULES ---');
  
  const org = await prisma.organization.findFirst();
  if (!org) return;

  const rules = [
    {
      level: 1,
      approverRole: 'DEPT_APPROVER',
      minTotalAmount: 0,
    },
    {
      level: 2,
      approverRole: 'DIRECTOR',
      minTotalAmount: 30000000,
    },
    {
      level: 3,
      approverRole: 'CEO',
      minTotalAmount: 100000000,
    }
  ];

  for (const r of rules) {
    await prisma.approvalMatrixRule.upsert({
      where: {
        orgId_documentType_level: {
          orgId: org.id,
          documentType: 'PURCHASE_REQUISITION',
          level: r.level
        }
      },
      update: {
        approverRole: r.approverRole,
        minTotalAmount: r.minTotalAmount,
        isActive: true
      },
      create: {
        orgId: org.id,
        documentType: 'PURCHASE_REQUISITION',
        level: r.level,
        approverRole: r.approverRole,
        minTotalAmount: r.minTotalAmount,
        currency: 'VND',
        isActive: true
      }
    });
    console.log(`Upserted Level ${r.level} rule: ${r.approverRole}`);
  }

  // Đảm bảo có người đóng vai trò Director và CEO để test
  const director = await prisma.user.findFirst({ where: { role: 'DIRECTOR' } });
  if (!director) {
    const anyUser = await prisma.user.findFirst({ where: { orgId: org.id } });
    if (anyUser) {
        await prisma.user.update({ where: { id: anyUser.id }, data: { role: 'DIRECTOR' } });
        console.log(`Promoted ${anyUser.name} to DIRECTOR for testing.`);
    }
  }

  console.log('--- SUCCESS: Approval rules are active ---');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
