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
  const email = 'namndtb00921@fpt.edu.vn';
  const orgId = 'c6473f8f-ea8d-4a48-9f25-474dea336024';
  const role = UserRole.SUPPLIER;
  const password = 'password123';

  console.log(`Checking if organization ${orgId} exists...`);
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    console.warn(`Organization with ID ${orgId} not found. Creating it first...`);
    await prisma.organization.create({
      data: {
        id: orgId,
        code: 'TEMP_SUP_' + Math.floor(Math.random() * 1000),
        name: 'Temporary Supplier Org',
        companyType: 'SUPPLIER',
      },
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  console.log(`Upserting user ${email}...`);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role,
      orgId,
      passwordHash,
    },
    create: {
      email,
      fullName: 'Nam Supplier',
      role,
      orgId,
      passwordHash,
      isActive: true,
      isVerified: true,
    },
  });

  console.log('✅ User created/updated successfully:');
  console.log(user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
