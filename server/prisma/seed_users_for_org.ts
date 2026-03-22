import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const orgId = '95690e47-188d-4cd1-b3b7-326da44c2c70';
  console.log(`🚀 Seeding users for organization ID: ${orgId}`);

  // Check if organization exists
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    console.error(
      `❌ Organization with ID ${orgId} not found. Please check the ID.`,
    );
    return;
  }

  console.log(`Found organization: ${org.name} (${org.code})`);

  const passwordHash = await bcrypt.hash('password123', 10);

  // Get all roles from enum
  const roles = Object.values(UserRole);
  console.log(`Found ${roles.length} roles: ${roles.join(', ')}`);

  for (const role of roles) {
    const email = `${role.toLowerCase()}@example.com`;
    const fullName = `${role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, ' ')} User`;

    await prisma.user.upsert({
      where: { email },
      update: {
        orgId,
        role,
        fullName,
        passwordHash,
        isActive: true,
        isVerified: true,
      },
      create: {
        email,
        fullName,
        role,
        orgId,
        passwordHash,
        isActive: true,
        isVerified: true,
      },
    });
    console.log(`✅ Upserted user: ${email} with role ${role}`);
  }

  console.log('✨ Seeding users finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
