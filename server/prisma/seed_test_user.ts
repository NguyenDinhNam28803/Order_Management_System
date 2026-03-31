import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const email = 'admin@innhub.com';

  // Find organization or create one
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Innhub Demo Org',
        code: 'INNHUB',
        companyType: 'BUYER',
        countryCode: 'VN',
        taxCode: '0123456789'
      }
    });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isActive: true,
      role: 'PLATFORM_ADMIN',
      fullName: 'System Admin'
    },
    create: {
      email,
      passwordHash,
      fullName: 'System Admin',
      role: 'PLATFORM_ADMIN',
      isActive: true,
      orgId: org.id,
      kycStatus: 'APPROVED'
    },
  });

  console.log(`User ${user.email} ensured with password 'password123'`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
