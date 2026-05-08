import {
  PrismaClient,
  CompanyType,
  KycStatus,
  UserRole,
  SupplierTier,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Seeding supplier: Nguyễn Đình Nam (FPT)...');

  // 1. Tạo tổ chức nhà cung cấp
  const org = await prisma.organization.upsert({
    where: { code: 'NAM_FPT_SUPPLIER' },
    update: {},
    create: {
      code: 'NAM_FPT_SUPPLIER',
      name: 'Công ty TNHH Nguyễn Đình Nam',
      legalName: 'Công ty TNHH Nguyễn Đình Nam',
      taxCode: '0909280921',
      companyType: CompanyType.SUPPLIER,
      industry: 'Information Technology',
      countryCode: 'VN',
      province: 'Ho Chi Minh',
      address: 'Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh',
      phone: '+84-909-280-921',
      email: 'namndtb00921@fpt.edu.vn',
      isActive: true,
      kycStatus: KycStatus.APPROVED,
      supplierTier: SupplierTier.APPROVED,
      trustScore: 80,
    },
  });

  console.log(`✅ Organization: ${org.name} (ID: ${org.id})`);

  // 2. Tạo tài khoản người dùng cho nhà cung cấp
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'namndtb00921@fpt.edu.vn' },
    update: {
      passwordHash,
      isActive: true,
      role: UserRole.SUPPLIER,
      orgId: org.id,
    },
    create: {
      email: 'namndtb00921@fpt.edu.vn',
      passwordHash,
      fullName: 'Nguyễn Đình Nam',
      role: UserRole.SUPPLIER,
      isActive: true,
      orgId: org.id,
      kycStatus: KycStatus.APPROVED,
      phone: '+84-909-280-921',
    },
  });

  console.log(`✅ User created: ${user.email} (role: ${user.role})`);
  console.log(`   Password mặc định: password123`);
  console.log('✅ Seed hoàn tất!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
