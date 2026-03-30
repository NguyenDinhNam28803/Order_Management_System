import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const prs = await prisma.purchaseRequisition.findMany({ select: { id: true, prNumber: true } });
  console.log(JSON.stringify(prs, null, 2));
  process.exit(0);
}
main();
