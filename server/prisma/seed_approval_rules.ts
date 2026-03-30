import 'dotenv/config';
import {
  PrismaClient,
  UserRole,
  DocumentType,
  CurrencyCode,
} from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  const orgId = '58d0a759-0651-4b2b-b8f9-d58d3a3001af';

  const approvalRules = [
    // --- QUY TẮC CHO PURCHASE_REQUISITION (PR) ---
    {
      orgId,
      documentType: DocumentType.PURCHASE_REQUISITION,
      level: 1,
      approverRole: UserRole.DEPT_APPROVER,
      minTotalAmount: 0,
      slaHours: 24,
      autoEscalateHours: 48,
    },
    {
      orgId,
      documentType: DocumentType.PURCHASE_REQUISITION,
      level: 2,
      approverRole: UserRole.DIRECTOR,
      minTotalAmount: 30000000, // Duyệt từ 30 triệu trở lên
      slaHours: 48,
      autoEscalateHours: 72,
    },
    {
      orgId,
      documentType: DocumentType.PURCHASE_REQUISITION,
      level: 3,
      approverRole: UserRole.CEO,
      minTotalAmount: 100000000, // Duyệt từ 100 triệu trở lên
      slaHours: 48,
      autoEscalateHours: 96,
    },

    // --- QUY TẮC CHO PURCHASE_ORDER (PO) ---
    {
      orgId,
      documentType: DocumentType.PURCHASE_ORDER,
      level: 1,
      approverRole: UserRole.DEPT_APPROVER,
      minTotalAmount: 0,
      slaHours: 24,
      autoEscalateHours: 48,
    },
    {
      orgId,
      documentType: DocumentType.PURCHASE_ORDER,
      level: 2,
      approverRole: UserRole.DIRECTOR,
      minTotalAmount: 30000000,
      slaHours: 48,
      autoEscalateHours: 72,
    },
    {
      orgId,
      documentType: DocumentType.PURCHASE_ORDER,
      level: 3,
      approverRole: UserRole.CEO,
      minTotalAmount: 100000000,
      slaHours: 48,
      autoEscalateHours: 96,
    },
  ];

  console.log(`🚀 Seeding Approval Matrix Rules for Org: ${orgId}...`);

  // Xóa các quy tắc cũ của công ty này để tránh trùng lặp khi chạy lại seed
  await prisma.approvalMatrixRule.deleteMany({
    where: { orgId },
  });

  for (const rule of approvalRules) {
    await prisma.approvalMatrixRule.create({
      data: {
        ...rule,
        currency: CurrencyCode.VND,
        isActive: true,
      },
    });
    console.log(
      `✅ Created Rule: ${rule.documentType} - Level ${rule.level} - ${rule.approverRole} (>= ${rule.minTotalAmount.toLocaleString()} VND)`,
    );
  }
}

seed()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('✨ Approval Matrix Rules seeded successfully!');
  });
