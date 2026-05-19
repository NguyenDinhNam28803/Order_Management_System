import { PrismaClient } from '@prisma/client';
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
  console.log('🧹 Cleaning up duplicate budget allocations...');

  // Find all duplicate budget allocations
  const duplicates = await prisma.$queryRaw<
    Array<{
      budgetPeriodId: string;
      costCenterId: string;
      deptId: string | null;
      categoryId: string | null;
      count: number;
      ids: string[];
    }>
  >`
    SELECT 
      budget_period_id as "budgetPeriodId",
      cost_center_id as "costCenterId",
      dept_id as "deptId",
      category_id as "categoryId",
      COUNT(*) as count,
      array_agg(id) as ids
    FROM budget_allocations
    GROUP BY budget_period_id, cost_center_id, dept_id, category_id
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length === 0) {
    console.log('✅ No duplicate budget allocations found!');
  } else {
    console.log(`⚠️  Found ${duplicates.length} duplicate groups:`);

    for (const group of duplicates) {
      console.log(
        `\n  Period: ${group.budgetPeriodId}, Cost Center: ${group.costCenterId}, Dept: ${group.deptId}, Category: ${group.categoryId}`,
      );
      console.log(`  Total records: ${group.count}`);
      console.log(`  IDs: ${group.ids.join(', ')}`);

      // Keep the first record, delete the rest
      const idsToDelete = group.ids.slice(1);
      console.log(`  → Keeping ID: ${group.ids[0]}`);
      console.log(`  → Deleting ${idsToDelete.length} records`);

      // Delete duplicate records
      await prisma.budgetAllocation.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      });

      console.log(`  ✅ Deleted ${idsToDelete.length} duplicate record(s)`);
    }
  }

  console.log('\n✅ Cleanup completed!');
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
