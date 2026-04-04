const { PrismaClient, UserRole, KycStatus, CompanyType } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const path = require('path');

// Load .env from the server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const orgCode = 'SUP_ABC';
  const orgName = 'Công ty Cổ phần Công nghệ ABC';
  const email = 'supplier@abc.com.vn';
  const fullName = 'ABC Supplier Manager';
  const password = 'password123';

  console.log(`🚀 Seeding Supplier account: ${orgName}`);

  // 1. Create/Upsert Organization
  const org = await prisma.organization.upsert({
    where: { code: orgCode },
    update: {
      name: orgName,
      companyType: CompanyType.SUPPLIER,
      isActive: true,
      kycStatus: KycStatus.APPROVED,
    },
    create: {
      code: orgCode,
      name: orgName,
      legalName: orgName,
      taxCode: '0312345678',
      companyType: CompanyType.SUPPLIER,
      isActive: true,
      kycStatus: KycStatus.APPROVED,
    },
  });

  console.log(`✅ Organization: ${org.name} (ID: ${org.id})`);

  // 2. Create/Upsert User
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      role: UserRole.SUPPLIER,
      orgId: org.id,
      passwordHash,
      isActive: true,
      isVerified: true,
    },
    create: {
      email,
      fullName,
      role: UserRole.SUPPLIER,
      orgId: org.id,
      passwordHash,
      isActive: true,
      isVerified: true,
    },
  });

  console.log(`✅ User: ${user.fullName} (${user.email})`);
  console.log(`\n--- ACCESS INFO ---`);
  console.log(`URL: /supplier/dashboard`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`--------------------\n`);
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
