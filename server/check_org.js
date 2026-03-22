const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgId = '95690e47-188d-4cd1-b3b7-326da44c2c70';
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (org) {
    console.log(`Found organization: ${org.name} (${org.code})`);
  } else {
    console.log(`Organization with ID ${orgId} NOT FOUND.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
