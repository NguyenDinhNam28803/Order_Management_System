/**
 * Seed file for 2 Additional Buyer Organizations
 * Creates company buyers with departments and users
 * Password for all test accounts: password123 (bcrypt hashed)
 */

import { PrismaClient, CompanyType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Generate bcrypt hash for 'password123'
const password = 'password123';
const PASSWORD_123_HASH = bcrypt.hashSync(password, 10);

async function main() {
  console.log('🌱 Seeding Additional Buyer Organizations...\n');

  // ==========================================
  // BUYER 1: Công ty TNHH TechStart Việt Nam
  // ==========================================
  console.log('🏢 Creating Buyer 1: TechStart Việt Nam...');
  
  const buyer1 = await prisma.organization.upsert({
    where: { code: 'TECHSTART-VN' },
    update: {},
    create: {
      code: 'TECHSTART-VN',
      name: 'Công ty TNHH TechStart Việt Nam',
      legalName: 'Công ty TNHH TechStart Việt Nam',
      taxCode: '0109876543',
      companyType: CompanyType.BUYER,
      industry: 'Công nghệ phần mềm & Khởi nghiệp',
      countryCode: 'VN',
      province: 'TP. Hồ Chí Minh',
      address: '123 Đường Lý Tự Trọng, Quận 1, TP. Hồ Chí Minh',
      phone: '028-1234-5678',
      email: 'contact@techstart.vn',
      website: 'https://techstart.vn',
      isActive: true,
      kycStatus: 'APPROVED',
      metadata: {
        businessAreas: ['Software Development', 'Digital Transformation', 'Cloud Services'],
        yearEstablished: 2018,
        employeeCount: 150,
        annualRevenue: '50-100 tỷ VND'
      }
    }
  });
  console.log(`✅ Buyer 1 created: ${buyer1.name} (${buyer1.code})`);

  // Departments for Buyer 1
  const buyer1Depts = [
    { code: 'TECHSTART-IT', name: 'Phòng IT' },
    { code: 'TECHSTART-HR', name: 'Phòng Nhân sự' },
    { code: 'TECHSTART-FIN', name: 'Phòng Tài chính' },
    { code: 'TECHSTART-ADM', name: 'Phòng Hành chính' }
  ];

  const depts1: { id: string; code: string; name: string }[] = [];
  for (const deptData of buyer1Depts) {
    let dept = await prisma.department.findFirst({ where: { code: deptData.code } });
    if (!dept) {
      dept = await prisma.department.create({
        data: {
          code: deptData.code,
          name: deptData.name,
          orgId: buyer1.id,
          isActive: true
        }
      });
      console.log(`   🏛️ Department created: ${dept.name}`);
    }
    depts1.push({ id: dept.id, code: dept.code, name: dept.name });
  }

  // Users for Buyer 1
  const buyer1Users = [
    { email: 'requester.it@techstart.vn', name: 'Nguyễn Minh IT - IT Requester', role: UserRole.REQUESTER, deptCode: 'TECHSTART-IT' },
    { email: 'manager.it@techstart.vn', name: 'Trần Văn Quản lý - IT Manager', role: UserRole.DEPT_APPROVER, deptCode: 'TECHSTART-IT' },
    { email: 'director@techstart.vn', name: 'Lê Thị Giám đốc - Director', role: UserRole.DIRECTOR, deptCode: null },
    { email: 'cfo@techstart.vn', name: 'Phạm Văn CFO - CFO', role: UserRole.FINANCE, deptCode: null },
    { email: 'procurement@techstart.vn', name: 'Hoàng Thị Mua sắm - Procurement', role: UserRole.PROCUREMENT, deptCode: null }
  ];

  for (const userData of buyer1Users) {
    const dept = userData.deptCode ? depts1.find(d => d.code === userData.deptCode) : null;
    
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        fullName: userData.name,
        role: userData.role,
        orgId: buyer1.id,
        deptId: dept?.id || null,
        passwordHash: PASSWORD_123_HASH,
        isActive: true
      }
    });
    console.log(`   👤 User: ${userData.name} (${userData.email})`);
  }

  // ==========================================
  // BUYER 2: Tập đoàn Xây dựng Phát triển Đông Nam
  // ==========================================
  console.log('\n🏢 Creating Buyer 2: Tập đoàn Xây dựng Phát triển Đông Nam...');
  
  const buyer2 = await prisma.organization.upsert({
    where: { code: 'DONGNAM-GROUP' },
    update: {},
    create: {
      code: 'DONGNAM-GROUP',
      name: 'Tập đoàn Xây dựng Phát triển Đông Nam',
      legalName: 'Công ty Cổ phần Tập đoàn Xây dựng Phát triển Đông Nam',
      taxCode: '0201234567',
      companyType: CompanyType.BUYER,
      industry: 'Xây dựng & Bất động sản',
      countryCode: 'VN',
      province: 'Hà Nội',
      address: '456 Đường Nguyễn Văn Huyên, Cầu Giấy, Hà Nội',
      phone: '024-9876-5432',
      email: 'contact@dongnam-group.vn',
      website: 'https://dongnam-group.vn',
      isActive: true,
      kycStatus: 'APPROVED',
      metadata: {
        businessAreas: ['Construction', 'Real Estate', 'Infrastructure Development'],
        yearEstablished: 2005,
        employeeCount: 500,
        annualRevenue: '500+ tỷ VND'
      }
    }
  });
  console.log(`✅ Buyer 2 created: ${buyer2.name} (${buyer2.code})`);

  // Departments for Buyer 2
  const buyer2Depts = [
    { code: 'DONGNAM-ENG', name: 'Phòng Kỹ thuật' },
    { code: 'DONGNAM-PROC', name: 'Phòng Vật tư' },
    { code: 'DONGNAM-FIN', name: 'Phòng Tài chính' },
    { code: 'DONGNAM-HR', name: 'Phòng Nhân sự' },
    { code: 'DONGNAM-ADM', name: 'Phòng Hành chính' }
  ];

  const depts2: { id: string; code: string; name: string }[] = [];
  for (const deptData of buyer2Depts) {
    let dept = await prisma.department.findFirst({ where: { code: deptData.code } });
    if (!dept) {
      dept = await prisma.department.create({
        data: {
          code: deptData.code,
          name: deptData.name,
          orgId: buyer2.id,
          isActive: true
        }
      });
      console.log(`   🏛️ Department created: ${dept.name}`);
    }
    depts2.push({ id: dept.id, code: dept.code, name: dept.name });
  }

  // Users for Buyer 2
  const buyer2Users = [
    { email: 'engineer@dongnam-group.vn', name: 'Nguyễn Văn Kỹ sư - Engineer', role: UserRole.REQUESTER, deptCode: 'DONGNAM-ENG' },
    { email: 'procurement@dongnam-group.vn', name: 'Trần Thị Vật tư - Procurement', role: UserRole.PROCUREMENT, deptCode: 'DONGNAM-PROC' },
    { email: 'manager.proc@dongnam-group.vn', name: 'Lê Văn Quản lý Vật tư - Manager', role: UserRole.DEPT_APPROVER, deptCode: 'DONGNAM-PROC' },
    { email: 'ceo@dongnam-group.vn', name: 'Phạm Văn CEO - CEO', role: UserRole.CEO, deptCode: null },
    { email: 'finance@dongnam-group.vn', name: 'Hoàng Thị Tài chính - Finance', role: UserRole.FINANCE, deptCode: 'DONGNAM-FIN' }
  ];

  for (const userData of buyer2Users) {
    const dept = userData.deptCode ? depts2.find(d => d.code === userData.deptCode) : null;
    
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        fullName: userData.name,
        role: userData.role,
        orgId: buyer2.id,
        deptId: dept?.id || null,
        passwordHash: PASSWORD_123_HASH,
        isActive: true
      }
    });
    console.log(`   👤 User: ${userData.name} (${userData.email})`);
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n==========================================');
  console.log('🎉 BUYER SEED COMPLETED SUCCESSFULLY!');
  console.log('==========================================\n');
  
  console.log('📊 Summary:');
  console.log('─────────────────────────────────────────');
  console.log('BUYER 1: TechStart Việt Nam');
  console.log('   Code: TECHSTART-VN');
  console.log('   Industry: Công nghệ phần mềm');
  console.log('   Departments: 4');
  console.log('   Users: 5');
  console.log('   Test Logins:');
  console.log('      - requester.it@techstart.vn / password123 (Requester)');
  console.log('      - procurement@techstart.vn / password123 (Procurement)');
  console.log('      - director@techstart.vn / password123 (Director)');
  console.log('─────────────────────────────────────────');
  console.log('BUYER 2: Tập đoàn Xây dựng Phát triển Đông Nam');
  console.log('   Code: DONGNAM-GROUP');
  console.log('   Industry: Xây dựng & Bất động sản');
  console.log('   Departments: 5');
  console.log('   Users: 5');
  console.log('   Test Logins:');
  console.log('      - engineer@dongnam-group.vn / password123 (Requester)');
  console.log('      - procurement@dongnam-group.vn / password123 (Procurement)');
  console.log('      - ceo@dongnam-group.vn / password123 (CEO)');
  console.log('─────────────────────────────────────────\n');
  
  console.log('💡 All users can login with: password123');
  console.log('📝 Total new accounts: 10 users across 2 companies');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
