import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing connection...');
  try {
    const orgCount = await prisma.organization.count();
    console.log(`Connection successful. Organization count: ${orgCount}`);
    
    const targetOrgId = 'cfd39893-7162-4b30-b298-e4d4d367c3d5';
    const org = await prisma.organization.findUnique({
      where: { id: targetOrgId }
    });
    
    if (org) {
      console.log(`Found organization: ${org.name}`);
    } else {
      console.log(`Organization with ID ${targetOrgId} NOT FOUND.`);
      const firstOrgs = await prisma.organization.findMany({ take: 5 });
      console.log('Existing organizations (first 5):');
      firstOrgs.forEach(o => console.log(`- ${o.name} (${o.id})`));
    }
  } catch (err) {
    console.error('Connection failed:');
    console.error(err);
  }
}

main().finally(() => prisma.$disconnect());
