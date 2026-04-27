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
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
        where: { email },
        data: {
            passwordHash,
            isActive: true,
            isVerified: true
        }
    });

    console.log(`✅ Updated password for ${user.email} to "password123"`);
    console.log(`✅ Status: isActive=${user.isActive}, isVerified=${user.isVerified}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
