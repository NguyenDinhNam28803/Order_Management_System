import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const orgId = '95690e47-188d-4cd1-b3b7-326da44c2c70';
  console.log(
    `🚀 Seeding departments and testers for organization ID: ${orgId}`,
  );

  // 1. Get all users of this organization
  const users = await prisma.user.findMany({
    where: { orgId },
  });

  if (users.length === 0) {
    console.error(
      `❌ No users found for organization ID ${orgId}. Please run the user seed first.`,
    );
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  for (const user of users) {
    const deptCode = `DEPT_${user.role}`;
    const deptName = `${user.role.charAt(0) + user.role.slice(1).toLowerCase().replace(/_/g, ' ')} Department`;

    console.log(`Creating department: ${deptName} (Code: ${deptCode})`);

    // 2. Create or Update Department with this user as Head
    const department = await prisma.department.upsert({
      where: {
        orgId_code: { orgId, code: deptCode },
      },
      update: {
        name: deptName,
        headUserId: user.id,
      },
      create: {
        orgId,
        code: deptCode,
        name: deptName,
        headUserId: user.id,
      },
    });

    // 3. Update the Head User to belong to this department
    await prisma.user.update({
      where: { id: user.id },
      data: { deptId: department.id },
    });

    // 4. Create a NEW REQUESTER for this department
    const userPrefix = user.email.split('@')[0];
    const testerEmail = `tester.${userPrefix}@example.com`;
    const testerName = `Tester for ${user.role} Dept (${userPrefix})`;

    await prisma.user.upsert({
      where: { email: testerEmail },
      update: {
        orgId,
        deptId: department.id,
        role: UserRole.REQUESTER,
        fullName: testerName,
        passwordHash,
        isActive: true,
        isVerified: true,
      },
      create: {
        email: testerEmail,
        fullName: testerName,
        role: UserRole.REQUESTER,
        orgId,
        deptId: department.id,
        passwordHash,
        isActive: true,
        isVerified: true,
      },
    });

    console.log(
      `✅ Dept ${deptCode} set up. Head: ${user.email}, Tester: ${testerEmail}`,
    );
  }

  console.log('✨ Departments and Testers seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
