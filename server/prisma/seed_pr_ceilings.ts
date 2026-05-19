import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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

  const ceilings = [
    {
      role: 'REQUESTER',
      limit: '10000000',
      desc: 'Hạn mức khởi tạo tối đa cho Requester (10 triệu VND)',
    },
    {
      role: 'DEPT_APPROVER',
      limit: '30000000',
      desc: 'Hạn mức khởi tạo tối đa cho Dept Approver (30 triệu VND)',
    },
    {
      role: 'DIRECTOR',
      limit: '100000000',
      desc: 'Hạn mức khởi tạo tối đa cho Director (100 triệu VND)',
    },
    {
      role: 'CEO',
      limit: '999999999999', // Không giới hạn (số rất lớn)
      desc: 'Hạn mức khởi tạo cho CEO (Không giới hạn)',
    },
  ];

  console.log(`🚀 Seeding PR Creation Ceilings for Org: ${orgId}...`);

  for (const item of ceilings) {
    const configKey = `PR_CEILING_${item.role}`;

    await prisma.systemConfig.upsert({
      where: {
        orgId_configKey: {
          orgId,
          configKey,
        },
      },
      update: {
        configValue: item.limit,
        description: item.desc,
        valueType: 'NUMBER',
      },
      create: {
        orgId,
        configKey,
        configValue: item.limit,
        description: item.desc,
        valueType: 'NUMBER',
      },
    });

    console.log(`✅ Set ${configKey} = ${item.limit} VND`);
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
    console.log('✨ PR Creation Ceilings seeded successfully!');
  });
