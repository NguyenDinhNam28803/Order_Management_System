const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- CHECKING APPROVAL SETUP ---');
  
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log('No organization found.');
    return;
  }

  console.log(`Organization: ${org.name} (${org.id})`);

  // 1. Check Approval Rules
  const rules = await prisma.approvalMatrixRule.findMany({
    where: { orgId: org.id, isActive: true },
    orderBy: { level: 'asc' }
  });

  console.log(`Found ${rules.length} active approval rules.`);
  rules.forEach(r => {
    console.log(`- Level ${r.level}: ${r.approverRole} for ${r.documentType} (Min Amount: ${r.minTotalAmount})`);
  });

  // 2. Check Departments and Heads
  const depts = await prisma.department.findMany({
    where: { orgId: org.id }
  });

  console.log(`\nFound ${depts.length} departments.`);
  for (const d of depts) {
      if (d.headUserId) {
          const head = await prisma.user.findUnique({ where: { id: d.headUserId } });
          console.log(`- Dept: ${d.name} (${d.code}) | Head: ${head ? head.name : 'ID:' + d.headUserId}`);
      } else {
        console.log(`- Dept: ${d.name} (${d.code}) | Head: NONE`);
      }
  }

  // 3. Check Users with special roles
  const supervisors = await prisma.user.findMany({
    where: { 
        orgId: org.id,
        role: { in: ['DIRECTOR', 'CEO', 'DEPT_APPROVER'] }
    }
  });

  console.log(`\nFound ${supervisors.length} users with approval roles.`);
  supervisors.forEach(u => {
    console.log(`- User: ${u.name} | Role: ${u.role} | DeptID: ${u.deptId}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
