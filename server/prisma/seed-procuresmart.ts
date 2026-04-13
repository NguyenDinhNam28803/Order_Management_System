import { PrismaClient, UserRole, KycStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding ProcureSmart company...');

  const companyName = 'Công ty cổ phần và giải pháp quản lý đơn đặt hàng ProcureSmart';

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { code: 'PROCURESMART' },
    update: {},
    create: {
      id: randomUUID(),
      code: 'PROCURESMART',
      name: companyName,
      isActive: true,
      kycStatus: KycStatus.APPROVED,
    },
  });
  console.log(`✅ Organization created: ${org.name}`);

  // 2. Create Departments
  const departments = [
    { name: 'Phòng IT', code: 'IT_DEPT' },
    { name: 'Phòng Thu Mua', code: 'PROCUREMENT_DEPT' },
    { name: 'Phòng Tài Chính', code: 'FINANCE_DEPT' },
    { name: 'Phòng Kho', code: 'WAREHOUSE_DEPT' },
    { name: 'Ban Giám Đốc', code: 'MANAGEMENT_DEPT' },
  ];

  const createdDepts: Record<string, string> = {};

  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { 
        orgId_code: { orgId: org.id, code: dept.code }
      },
      update: {},
      create: {
        id: randomUUID(),
        name: dept.name,
        code: dept.code,
        orgId: org.id,
        isActive: true,
        budgetAnnual: 0,
        budgetUsed: 0,
      },
    });
    createdDepts[dept.code] = created.id;
    console.log(`✅ Department created: ${dept.name}`);
  }

  // 3. Create Cost Centers
  const costCenters = [
    { name: 'IT Operations', code: 'IT-OPS-2024', budgetAnnual: 500000000, budgetUsed: 0, deptCode: 'IT_DEPT' },
    { name: 'Procurement Budget', code: 'PROC-2024', budgetAnnual: 1000000000, budgetUsed: 0, deptCode: 'PROCUREMENT_DEPT' },
    { name: 'Finance Operations', code: 'FIN-2024', budgetAnnual: 300000000, budgetUsed: 0, deptCode: 'FINANCE_DEPT' },
    { name: 'Warehouse Operations', code: 'WH-2024', budgetAnnual: 200000000, budgetUsed: 0, deptCode: 'WAREHOUSE_DEPT' },
  ];

  const createdCCs: Record<string, string> = {};

  for (const cc of costCenters) {
    const deptId = createdDepts[cc.deptCode];
    if (deptId) {
      const created = await prisma.costCenter.upsert({
        where: { 
          orgId_code: { orgId: org.id, code: cc.code }
        },
        update: {},
        create: {
          id: randomUUID(),
          name: cc.name,
          code: cc.code,
          orgId: org.id,
          deptId: deptId,
          isActive: true,
          budgetAnnual: cc.budgetAnnual,
          budgetUsed: cc.budgetUsed,
          fiscalYear: 2024,
        },
      });
      createdCCs[cc.code] = created.id;
      console.log(`✅ Cost Center created: ${cc.name}`);
    }
  }

  // 4. Create Users with specified emails
  const defaultPassword = await bcrypt.hash('ProcureSmart@2024', 10);

  const users = [
    {
      email: 'itrequesterprocuresmart@gmail.com',
      name: 'Nguyễn Văn IT Requester',
      role: UserRole.REQUESTER,
      deptCode: 'IT_DEPT',
      jobTitle: 'IT Specialist',
    },
    {
      email: 'itmanageprocuresmart@gmail.com',
      name: 'Trần Thị Trưởng Phòng IT',
      role: UserRole.DEPT_APPROVER,
      deptCode: 'IT_DEPT',
      jobTitle: 'IT Manager',
    },
    {
      email: 'procurementprocuresmart@gmail.com',
      name: 'Lê Thị Thu Mua',
      role: UserRole.PROCUREMENT,
      deptCode: 'PROCUREMENT_DEPT',
      jobTitle: 'Procurement Officer',
    },
    {
      email: 'financeprocuresmart@gmail.com',
      name: 'Phạm Văn Tài Chính',
      role: UserRole.FINANCE,
      deptCode: 'FINANCE_DEPT',
      jobTitle: 'Finance Manager',
    },
    {
      email: 'warehouseprocuresmart@gmail.com',
      name: 'Hoàng Thị Thủ Kho',
      role: UserRole.WAREHOUSE,
      deptCode: 'WAREHOUSE_DEPT',
      jobTitle: 'Warehouse Manager',
    },
    {
      email: 'adminprocuresmart@gmail.com',
      name: 'Admin ProcureSmart',
      role: UserRole.PLATFORM_ADMIN,
      deptCode: 'MANAGEMENT_DEPT',
      jobTitle: 'System Administrator',
    },
  ];

  for (const user of users) {
    const deptId = createdDepts[user.deptCode];
    
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: randomUUID(),
        email: user.email,
        passwordHash: defaultPassword,
        fullName: user.name,
        role: user.role,
        orgId: org.id,
        deptId: deptId || null,
        isActive: true,
        isVerified: true,
        kycStatus: KycStatus.APPROVED,
        jobTitle: user.jobTitle,
        preferences: {},
        lastLoginAt: new Date(),
      },
    });
    console.log(`✅ User created: ${user.name} (${user.email}) - ${user.role}`);
  }

  console.log('\n🎉 ProcureSmart seeding completed!');
  console.log('----------------------------------------');
  console.log('Company: ' + companyName);
  console.log('Default password for all users: ProcureSmart@2024');
  console.log('----------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
