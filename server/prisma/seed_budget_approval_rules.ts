import {
  PrismaClient,
  DocumentType,
  UserRole,
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
  const orgId = '58d0a759-0651-4b2b-b8f9-d58d3a3001af';

  console.log(
    `🚀 Creating approval rules for Budget Allocation in organization ${orgId}...`,
  );

  // Verify organization exists
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    throw new Error(`Organization with ID ${orgId} not found`);
  }

  console.log(`✅ Organization found: ${org.name}`);

  // Delete existing rules first to avoid conflicts
  await prisma.approvalMatrixRule.deleteMany({
    where: {
      orgId,
      documentType: DocumentType.BUDGET_ALLOCATION,
    },
  });

  console.log('🗑️  Cleared previous approval rules.');

  // Create approval matrix rules for budget allocation
  // Workflow: DEPT_APPROVER creates & submits → FINANCE approves → Budget allocated
  const rules = [
    {
      level: 1,
      approverRole: UserRole.FINANCE,
      minTotalAmount: 0,
      maxTotalAmount: 500000000, // 500 triệu VND
      description:
        'Finance Manager - Budget up to 500M VND (from department heads)',
    },
    {
      level: 2,
      approverRole: UserRole.DIRECTOR,
      minTotalAmount: 500000000, // 500 triệu VND
      maxTotalAmount: 1000000000, // 1 tỷ VND
      description: 'Director - Budget from 500M to 1B VND',
    },
    {
      level: 3,
      approverRole: UserRole.CEO,
      minTotalAmount: 1000000000, // 1 tỷ VND
      maxTotalAmount: 999999999999, // Unlimited
      description: 'CEO - Budget over 1B VND',
    },
  ];

  for (const rule of rules) {
    // Check if rule already exists
    const existingRule = await prisma.approvalMatrixRule.findUnique({
      where: {
        orgId_documentType_level: {
          orgId,
          documentType: DocumentType.BUDGET_ALLOCATION,
          level: rule.level,
        },
      },
    });

    if (existingRule) {
      console.log(
        `  ⚠️  Rule already exists for Level ${rule.level} - ${rule.approverRole}`,
      );
      continue;
    }

    const created = await prisma.approvalMatrixRule.create({
      data: {
        orgId,
        documentType: DocumentType.BUDGET_ALLOCATION,
        level: rule.level,
        approverRole: rule.approverRole,
        minTotalAmount: rule.minTotalAmount,
        minItemAmount: 0,
        currency: CurrencyCode.VND,
        slaHours: 48, // 2 days to review
        autoEscalateHours: 72, // 3 days auto escalate
        isActive: true,
        effectiveFrom: new Date(),
        effectiveUntil: null, // Indefinite
      },
    });

    console.log(
      `  ✅ Created ${rule.approverRole} approval rule (Level ${rule.level})`,
    );
    console.log(
      `     - Min Amount: ${rule.minTotalAmount.toLocaleString()} VND`,
    );
    console.log(
      `     - Max Amount: ${rule.maxTotalAmount.toLocaleString()} VND`,
    );
    console.log(`     - SLA: ${created.slaHours} hours`);
  }

  console.log('\n✅ Budget Allocation approval rules created successfully!');

  // Display summary
  const allRules = await prisma.approvalMatrixRule.findMany({
    where: {
      orgId,
      documentType: DocumentType.BUDGET_ALLOCATION,
    },
    orderBy: { level: 'asc' },
  });

  console.log('\n📋 Summary of Approval Rules:');
  console.log('================================');
  for (const r of allRules) {
    console.log(
      `Level ${r.level} | ${r.approverRole} | Min: ${Number(r.minTotalAmount).toLocaleString()} VND | SLA: ${r.slaHours}h`,
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
