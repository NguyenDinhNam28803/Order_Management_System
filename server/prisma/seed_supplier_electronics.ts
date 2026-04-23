import {
  PrismaClient,
  UserRole,
  KycStatus,
  CompanyType,
  SupplierTier,
  CurrencyCode,
} from '@prisma/client';
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
  console.log('🚀 Đang bắt đầu seed tài khoản nhà cung cấp điện tử...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Tạo hoặc cập nhật Organization (Nhà cung cấp)
  const supplierOrg = await prisma.organization.upsert({
    where: { code: 'NCC_DIEN_TU' },
    update: { 
        name: 'Nhà cung cấp thiết bị điện tử',
        companyType: CompanyType.SUPPLIER,
        isActive: true,
        kycStatus: KycStatus.APPROVED,
    },
    create: {
      code: 'NCC_DIEN_TU',
      name: 'Nhà cung cấp thiết bị điện tử',
      email: 'lyhung.dn81@gmail.com',
      companyType: CompanyType.SUPPLIER,
      industry: 'Electronics',
      isActive: true,
      kycStatus: KycStatus.APPROVED,
      supplierTier: SupplierTier.PREFERRED,
      countryCode: 'VN',
    },
  });

  console.log(`✅ Đã tạo/cập nhật tổ chức: ${supplierOrg.name} (ID: ${supplierOrg.id})`);

  // 2. Tạo User cho Supplier
  const supplierUser = await prisma.user.upsert({
    where: { email: 'lyhung.dn81@gmail.com' },
    update: { 
        fullName: 'Nhà cung cấp thiết bị điện tử',
        role: UserRole.SUPPLIER,
        isActive: true,
        isVerified: true,
        orgId: supplierOrg.id,
    },
    create: {
      email: 'lyhung.dn81@gmail.com',
      fullName: 'Nhà cung cấp thiết bị điện tử',
      role: UserRole.SUPPLIER,
      orgId: supplierOrg.id,
      passwordHash,
      isActive: true,
      isVerified: true,
    },
  });

  console.log(`✅ Đã tạo/cập nhật người dùng: ${supplierUser.email}`);

  // 3. Tìm danh mục điện tử (IT Hardware)
  // Trong seed.ts cũ có category IT_HW
  const category = await prisma.productCategory.findFirst({
    where: { 
        OR: [
            { code: 'IT_HW' },
            { name: { contains: 'Điện tử', mode: 'insensitive' } },
            { name: { contains: 'Hardware', mode: 'insensitive' } }
        ]
    }
  });

  if (category) {
    console.log(`📂 Đã tìm thấy danh mục: ${category.name} (Code: ${category.code})`);
    
    // Liên kết Supplier với Category
    await prisma.supplierCategory.upsert({
      where: { 
        supplierId_categoryId: { 
          supplierId: supplierOrg.id, 
          categoryId: category.id 
        } 
      },
      update: {},
      create: {
        supplierId: supplierOrg.id,
        categoryId: category.id,
        isPrimary: true,
      }
    });

    // 4. Gán các sản phẩm thuộc danh mục này cho Supplier
    const products = await prisma.product.findMany({
      where: { categoryId: category.id }
    });

    if (products.length > 0) {
        console.log(`📦 Đang gán ${products.length} sản phẩm cho nhà cung cấp...`);
        
        const effectiveFrom = new Date();
        effectiveFrom.setHours(0, 0, 0, 0); // Đưa về đầu ngày để tránh lỗi unique constraint nếu chạy lại trong ngày

        for (const product of products) {
            await prisma.supplierProductPrice.upsert({
                where: {
                    supplierId_productId_effectiveFrom: {
                        supplierId: supplierOrg.id,
                        productId: product.id,
                        effectiveFrom: effectiveFrom,
                    }
                },
                update: { 
                    unitPrice: product.unitPriceRef || 500000,
                    isActive: true 
                },
                create: {
                    supplierId: supplierOrg.id,
                    productId: product.id,
                    unitPrice: product.unitPriceRef || 500000,
                    currency: product.currency || CurrencyCode.VND,
                    effectiveFrom: effectiveFrom,
                    isActive: true,
                }
            });
        }
        console.log(`✅ Đã hoàn tất gán giá cho ${products.length} sản phẩm.`);
    } else {
        console.log('⚠️ Không tìm thấy sản phẩm nào trong danh mục này để gán.');
    }
  } else {
    console.log('❌ Không tìm thấy danh mục IT Hardware hoặc Điện tử. Vui lòng kiểm tra lại database.');
  }

  console.log('\n✨ Hoàn tất quá trình seed!');
  console.log('--------------------------------------------------');
  console.log('Thông tin đăng nhập:');
  console.log(`- Email: lyhung.dn81@gmail.com`);
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
