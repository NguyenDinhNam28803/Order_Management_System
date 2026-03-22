import { PrismaClient, UserRole, CompanyType, KycStatus, CurrencyCode } from '@prisma/client';
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
  console.log('🚀 Creating a fresh test organization with full structure...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create New Organization
  const org = await prisma.organization.upsert({
    where: { code: 'INN_HUB' },
    update: {},
    create: {
      code: 'INN_HUB',
      name: 'Innovation Hub Co., Ltd',
      legalName: 'Innovation Hub Technology Solutions',
      taxCode: '0123456789',
      companyType: CompanyType.BOTH,
      industry: 'High-Tech Manufacturing',
      countryCode: 'VN',
      isActive: true,
      kycStatus: KycStatus.APPROVED,
    },
  });

  console.log(`✅ Organization created: ${org.name} (ID: ${org.id})`);

  // 2. Create Departments
  const deptData = [
    { code: 'IT_DEPT', name: 'Information Technology' },
    { code: 'FIN_DEPT', name: 'Finance & Accounting' },
    { code: 'PROC_DEPT', name: 'Global Procurement' },
    { code: 'WH_DEPT', name: 'Central Warehouse' },
    { code: 'PROD_DEPT', name: 'Production Line' },
    { code: 'ADMIN_DEPT', name: 'Administration' },
  ];

  const depts: any = {};
  for (const d of deptData) {
    depts[d.code] = await prisma.department.upsert({
      where: { orgId_code: { orgId: org.id, code: d.code } },
      update: {},
      create: {
        orgId: org.id,
        code: d.code,
        name: d.name,
      },
    });
  }
  console.log('✅ Departments created.');

  // 3. Create Users for each role and department
  const userData = [
    // IT Department
    { email: 'it.requester@innhub.com', fullName: 'IT Staff 01', role: UserRole.REQUESTER, deptCode: 'IT_DEPT' },
    { email: 'it.manager@innhub.com', fullName: 'IT Manager', role: UserRole.DEPT_APPROVER, deptCode: 'IT_DEPT' },
    
    // Finance Department
    { email: 'finance.staff@innhub.com', fullName: 'Accountant 01', role: UserRole.REQUESTER, deptCode: 'FIN_DEPT' },
    { email: 'cfo@innhub.com', fullName: 'Chief Financial Officer', role: UserRole.FINANCE, deptCode: 'FIN_DEPT' },
    
    // Procurement
    { email: 'proc.officer@innhub.com', fullName: 'Procurement Specialist', role: UserRole.PROCUREMENT, deptCode: 'PROC_DEPT' },
    
    // Warehouse & QA
    { email: 'wh.keeper@innhub.com', fullName: 'Warehouse Keeper', role: UserRole.WAREHOUSE, deptCode: 'WH_DEPT' },
    { email: 'qa.inspector@innhub.com', fullName: 'Quality Inspector', role: UserRole.QA, deptCode: 'WH_DEPT' },
    
    // Leadership
    { email: 'director@innhub.com', fullName: 'Technical Director', role: UserRole.DIRECTOR, deptCode: 'ADMIN_DEPT' },
    { email: 'ceo@innhub.com', fullName: 'Chief Executive Officer', role: UserRole.CEO, deptCode: 'ADMIN_DEPT' },
    
    // System & Admin
    { email: 'admin@innhub.com', fullName: 'System Administrator', role: UserRole.PLATFORM_ADMIN, deptCode: 'ADMIN_DEPT' },
  ];

  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        orgId: org.id,
        deptId: depts[u.deptCode].id,
        passwordHash,
      },
      create: {
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        orgId: org.id,
        deptId: depts[u.deptCode].id,
        passwordHash,
        isActive: true,
        isVerified: true,
      },
    });

    // If manager/head, update department head
    if (u.role === UserRole.DEPT_APPROVER || u.role === UserRole.FINANCE || u.role === UserRole.DIRECTOR) {
        await prisma.department.update({
            where: { id: depts[u.deptCode].id },
            data: { headUserId: user.id }
        });
    }
  }
  console.log('✅ Users created and assigned to departments.');

  // 4. Create Cost Centers
  const ccData = [
    { code: 'CC_IT_OPS', name: 'IT Operations Cost', deptCode: 'IT_DEPT', budget: 1000000000 },
    { code: 'CC_PROD_GEN', name: 'General Production', deptCode: 'PROD_DEPT', budget: 5000000000 },
    { code: 'CC_MKT_CORP', name: 'Corporate Marketing', deptCode: 'ADMIN_DEPT', budget: 2000000000 },
  ];

  for (const cc of ccData) {
    await prisma.costCenter.upsert({
      where: { orgId_code: { orgId: org.id, code: cc.code } },
      update: { budgetAnnual: cc.budget },
      create: {
        orgId: org.id,
        deptId: depts[cc.deptCode].id,
        code: cc.code,
        name: cc.name,
        budgetAnnual: cc.budget,
        currency: CurrencyCode.VND,
      },
    });
  }
  console.log('✅ Cost Centers created.');

  console.log('\n✨ New Organization Setup Complete!');
  console.log(`🏢 Organization ID: ${org.id}`);
  console.log('🔑 Default Password: password123');
  console.log('📧 Sample Emails:');
  console.log('   - Requester: it.requester@innhub.com');
  console.log('   - Manager: it.manager@innhub.com');
  console.log('   - Procurement: proc.officer@innhub.com');
  console.log('   - Finance: cfo@innhub.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
