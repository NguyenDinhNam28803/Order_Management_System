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
  const orgId = '15ec593f-1e29-4e69-b396-17c0ac9ddb2d';

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

    // --- QUY TẮC CHO CONTRACT (Hợp đồng) ---
    {
      orgId,
      documentType: DocumentType.CONTRACT,
      level: 1,
      approverRole: UserRole.DIRECTOR,
      minTotalAmount: 0, // Tất cả hợp đồng cần DIRECTOR duyệt
      slaHours: 48,
      autoEscalateHours: 72,
    },
    {
      orgId,
      documentType: DocumentType.CONTRACT,
      level: 2,
      approverRole: UserRole.CEO,
      minTotalAmount: 100000000, // Hợp đồng >= 100 triệu cần CEO duyệt thêm
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
