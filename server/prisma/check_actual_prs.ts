import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
    const prs = await prisma.purchaseRequisition.findMany({ 
      select: { prNumber: true },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });
    console.log('LIST_OF_PRS:', JSON.stringify(prs));
  } catch (e) {
    console.error('ERROR_CHECKING_PRS:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
