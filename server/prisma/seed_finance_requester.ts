import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🚀 Đang bắt đầu seed tài khoản requester phòng tài chính...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const email = 'hung.finance@gmail.com';
    const orgCode = 'PROCURESMART';
    const deptCode = 'FINANCE_DEPT';

    // 1. Tìm Organization
    const org = await prisma.organization.findUnique({
        where: { code: orgCode }
    });

    if (!org) {
        console.error(`❌ Không tìm thấy tổ chức với mã ${orgCode}`);
        return;
    }

    // 2. Tìm Department
    const dept = await prisma.department.findFirst({
        where: { 
            orgId: org.id,
            code: deptCode
        }
    });

    if (!dept) {
        console.error(`❌ Không tìm thấy phòng ban với mã ${deptCode} trong tổ chức ${orgCode}`);
        return;
    }

    // 3. Tạo hoặc cập nhật User
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            fullName: 'Người yêu cầu Tài chính',
            role: UserRole.REQUESTER,
            orgId: org.id,
            deptId: dept.id,
            isActive: true,
            isVerified: true,
        },
        create: {
            email,
            fullName: 'Người yêu cầu Tài chính',
            role: UserRole.REQUESTER,
            orgId: org.id,
            deptId: dept.id,
            passwordHash,
            isActive: true,
            isVerified: true,
        },
    });

    console.log(`✅ Đã tạo/cập nhật người dùng: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Phòng ban: ${dept.name}`);
    console.log(`- Tổ chức: ${org.name}`);
    console.log('\n✨ Hoàn tất quá trình seed!');
    console.log('--------------------------------------------------');
    console.log('Thông tin đăng nhập:');
    console.log(`- Email: ${email}`);
    console.log(`- Password: password123`);
    console.log('--------------------------------------------------');
}

main()
    .catch((e) => {
        console.error('❌ Lỗi khi seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
