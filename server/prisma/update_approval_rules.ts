import {
  PrismaClient,
  UserRole,
  DocumentType,
  CurrencyCode,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const orgIds = [
    '95690e47-188d-4cd1-b3b7-326da44c2c70', // Công ty đầu tiên
    'ec9ff575-e291-471c-b334-e8716f97cf07', // Innovation Hub Co.
  ];

  console.log(
    '⚖️ Updating Approval Matrix Rules with lower thresholds (1M - 3M VND)...',
  );

  for (const orgId of orgIds) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) continue;

    console.log(`Updating rules for: ${org.name}`);

    // Clean existing rules for this org
    await prisma.approvalMatrixRule.deleteMany({ where: { orgId } });

    const newRules = [
      // --- PURCHASE REQUISITION (PR) ---
      {
        orgId,
        documentType: DocumentType.PURCHASE_REQUISITION,
        level: 1,
        approverRole: UserRole.DEPT_APPROVER,
        minTotalAmount: 0,
        currency: CurrencyCode.VND,
      },
      {
        orgId,
        documentType: DocumentType.PURCHASE_REQUISITION,
        level: 2,
        approverRole: UserRole.DIRECTOR,
        minTotalAmount: 1000000, // > 1 Triệu VNĐ
        currency: CurrencyCode.VND,
      },
      {
        orgId,
        documentType: DocumentType.PURCHASE_REQUISITION,
        level: 3,
        approverRole: UserRole.CEO,
        minTotalAmount: 3000000, // > 3 Triệu VNĐ
        currency: CurrencyCode.VND,
      },

      // --- PURCHASE ORDER (PO) ---
      {
        orgId,
        documentType: DocumentType.PURCHASE_ORDER,
        level: 1,
        approverRole: UserRole.PROCUREMENT,
        minTotalAmount: 0,
        currency: CurrencyCode.VND,
      },
      {
        orgId,
        documentType: DocumentType.PURCHASE_ORDER,
        level: 2,
        approverRole: UserRole.FINANCE,
        minTotalAmount: 1000000, // > 1 Triệu VNĐ
        currency: CurrencyCode.VND,
      },
      {
        orgId,
        documentType: DocumentType.PURCHASE_ORDER,
        level: 3,
        approverRole: UserRole.CEO,
        minTotalAmount: 3000000, // > 3 Triệu VNĐ
        currency: CurrencyCode.VND,
      },
    ];

    for (const rule of newRules) {
      await prisma.approvalMatrixRule.create({
        data: {
          ...rule,
          isActive: true,
          slaHours: 24,
          autoEscalateHours: 48,
        },
      });
    }
    console.log(`✅ Finished ${org.name}`);
  }

  console.log('✨ All approval rules updated successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
