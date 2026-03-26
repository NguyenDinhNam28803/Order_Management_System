import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
// import * as bcrypt from 'bcrypt';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Nam Viet Software Solutions...');

  // 1. Tạo tổ chức
  const namViet = await prisma.organization.create({
    data: {
      code: 'NV-SOFT',
      name: 'Công ty Cổ phần Giải pháp và Dịch vụ Phần mềm Nam Việt',
      companyType: 'BUYER',
      isActive: true,
    },
  });

  // 2. Tạo các phòng ban ( chưa có đầy đủ )
  const departments = ['IT', 'Finance', 'Procurement', 'Management'];
  const deptMap: { [key: string]: string } = {};

  for (const name of departments) {
    const dept = await prisma.department.create({
      data: {
        orgId: namViet.id,
        code: 'NV-' + name.toUpperCase(),
        name: name,
        // Không còn gán budgetAnnual ở đây
      },
    });
    deptMap[name] = dept.id;
  }

  // 2.1 Thêm ngân sách tổng cho công ty (OrgBudget)
  await prisma.orgBudget.create({
    data: {
      orgId: namViet.id,
      fiscalYear: 2026,
      totalAmount: 5000000000, // 5 tỷ VNĐ ngân sách tổng công ty
      currency: 'VND',
    },
  });

  // 3. Seed User cho mỗi role (tất cả các role trong Enum)
  const roles = Object.values(UserRole);

  for (const role of roles) {
    let deptId = deptMap['IT']; // Mặc định là IT

    // Gán phòng ban thông minh hơn dựa trên Role
    if (role === 'FINANCE') deptId = deptMap['Finance'];
    else if (role === 'PROCUREMENT') deptId = deptMap['Procurement'];
    else if (['CEO', 'DIRECTOR', 'PLATFORM_ADMIN'].includes(role))
      deptId = deptMap['Management'];

    await prisma.user.create({
      data: {
        orgId: namViet.id,
        deptId: deptId,
        email: `${role.toLowerCase()}@namviet.com.vn`,
        fullName: `${role.replace('_', ' ')} User`,
        role: role,
        passwordHash: 'password123', // Hash đại diện cho 'password123'
        isActive: true,
      },
    });
    console.log(`Created user: ${role.toLowerCase()}@namviet.com.vn`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
