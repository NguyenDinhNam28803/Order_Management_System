import { PrismaClient, UserRole, KycStatus } from '@prisma/client';
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
  const orgId = 'cfd39893-7162-4b30-b298-e4d4d367c3d5';
  const role = UserRole.SUPPLIER;
  const email = 'fptshop.bienhoa@fpt.com.vn';
  const fullName = 'FPT Shop Biên Hòa';
  const password = 'password123';

  console.log(`Checking organization with ID: ${orgId}`);
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    console.error(`ERROR: Organization with ID ${orgId} not found!`);

    // In case it's not found, let's list some to help
    const someOrgs = await prisma.organization.findMany({ take: 5 });
    console.log('Available orgs (sample):');
    someOrgs.forEach((o) =>
      console.log(`- ${o.name} [ID: ${o.id}] [Code: ${o.code}]`),
    );
    return;
  }

  console.log(`Organization found: ${org.name}`);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      role,
      orgId,
      passwordHash,
      isActive: true,
      isVerified: true,
      kycStatus: KycStatus.APPROVED,
    },
    create: {
      email,
      fullName,
      role,
      orgId,
      passwordHash,
      isActive: true,
      isVerified: true,
      kycStatus: KycStatus.APPROVED,
    },
  });

  console.log(
    `SUCCESS: User '${user.fullName}' (${email}) has been seeded for organization '${org.name}'.`,
  );
  console.log(`Email account: ${email}`);
  console.log(`Default password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
