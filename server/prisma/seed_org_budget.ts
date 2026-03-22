const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Lấy thông tin Organization
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log('Không tìm thấy Organization nào.');
    return;
  }

  // 2. Tạo tổng ngân sách năm 2026 cho Organization
  const orgBudget = await prisma.orgBudget.upsert({
    where: {
      orgId_fiscalYear: {
        orgId: org.id,
        fiscalYear: 2026
      }
    },
    update: {
      totalAmount: 10000000000 // 10 tỷ VND
    },
    create: {
      orgId: org.id,
      fiscalYear: 2026,
      totalAmount: 10000000000,
      currency: 'VND'
    }
  });

  console.log('Đã tạo/cập nhật ngân sách tổng cho tổ chức:', orgBudget);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
