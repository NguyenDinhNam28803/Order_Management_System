
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const id = '9deedeae-e0c1-4027-a454-e257ffab316b';
  
  try {
    console.log('Testing findUnique for CostCenter:', id);
    const cc = await prisma.costCenter.findUnique({
      where: { id },
      include: {
        department: true,
        budgetAllocations: true,
      },
    });
    console.log('Result:', cc);
  } catch (error) {
    console.error('Error detail:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
