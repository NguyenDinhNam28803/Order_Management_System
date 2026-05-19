const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('--- USERS ---');
  users.forEach(u => console.log(`${u.email} | deptId: ${u.deptId} | role: ${u.role}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
