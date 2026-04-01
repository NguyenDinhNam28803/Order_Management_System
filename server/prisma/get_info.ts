import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  const cc =
    (await prisma.costCenter.findFirst({
      where: { code: 'cc-it-1' },
    })) || (await prisma.costCenter.findFirst());

  console.log('--- DATA FOR SEEDING ---');
  console.log('ORG_ID:', org?.id);
  console.log('COST_CENTER_ID:', cc?.id);
  console.log('COST_CENTER_CODE:', cc?.code);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
