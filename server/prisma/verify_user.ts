import { PrismaClient } from '@prisma/client';
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
  const email = 'hung.lc2102@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true }
  });

  if (!user) {
    console.log(`❌ User with email ${email} NOT FOUND.`);
    return;
  }

  console.log('--- USER INFO ---');
  console.log('ID:', user.id);
  console.log('Email:', user.email);
  console.log('Role:', user.role);
  console.log('Is Active:', user.isActive);
  console.log('Org Name:', user.organization?.name);
  console.log('Org Type:', user.organization?.companyType);

  const isPasswordValid = await bcrypt.compare('password123', user.passwordHash || '');
  console.log('Password "password123" is valid:', isPasswordValid);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
