import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      department: true,
    },
  });
  console.log('--- USERS IN DB ---');
  users.forEach((u) => {
    console.log(
      `Email: ${u.email}, Dept: ${u.department?.name || 'NULL'}, DeptId: ${u.deptId}`,
    );
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
