import {
  PrismaClient,
  UserRole,
  KycStatus,
  CompanyType,
} from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // 1. Create a default Organization
  const org = await prisma.organization.upsert({
    where: { code: 'ORG001' },
    update: {},
    create: {
      code: 'ORG001',
      name: 'Default Organization',
      legalName: 'Default Corp Ltd.',
      taxCode: '123456789',
      companyType: CompanyType.BOTH,
      industry: 'Technology',
      countryCode: 'VN',
      isActive: true,
      kycStatus: KycStatus.APPROVED,
    },
  });

  console.log(`Created organization with id: ${org.id}`);

  // 2. Create a default Department
  const dept = await prisma.department.upsert({
    where: { orgId_code: { orgId: org.id, code: 'IT' } },
    update: {},
    create: {
      orgId: org.id,
      code: 'IT',
      name: 'Information Technology',
      isActive: true,
    },
  });

  console.log(`Created department with id: ${dept.id}`);

  // 3. Create Users
  const users = [
    {
      email: 'admin@example.com',
      fullName: 'System Administrator',
      role: UserRole.PLATFORM_ADMIN,
    },
    {
      email: 'requester@example.com',
      fullName: 'John Requester',
      role: UserRole.REQUESTER,
    },
    {
      email: 'approver@example.com',
      fullName: 'Sarah Approver',
      role: UserRole.DEPT_APPROVER,
    },
    {
      email: 'procurement@example.com',
      fullName: 'Mike Procurement',
      role: UserRole.PROCUREMENT,
    },
    {
      email: 'finance@example.com',
      fullName: 'Alice Finance',
      role: UserRole.FINANCE,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        orgId: org.id,
        deptId: dept.id,
        isActive: true,
        isVerified: true,
        passwordHash:
          '$2b$10$EPf9hvS6YfV1M5H/i.YVDe9A2K9E.E5L5L5L5L5L5L5L5L5L5L5L', // dummy hash
      },
    });
    console.log(`Created user: ${user.email} with role ${user.role}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
