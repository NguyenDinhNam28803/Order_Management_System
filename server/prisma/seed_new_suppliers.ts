/**
 * Seed file for 2 New Supplier Companies
 * Creates suppliers with categories, products, and users
 * Password for all test accounts: password123 (bcrypt hashed)
 */

import { PrismaClient, CompanyType, ProductType, CurrencyCode, PriceVolatility, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Generate bcrypt hash for 'password123'
const password = 'password123';
const PASSWORD_123_HASH = bcrypt.hashSync(password, 10);

async function main() {
  console.log('🌱 Seeding New Suppliers...\n');

  // ==========================================
  // SUPPLIER 1: Công ty TNHH Văn Phòng Phẩm Thiên Long
  // ==========================================
  console.log('🏢 Creating Supplier 1: Văn Phòng Phẩm Thiên Long...');
  
  const supplier1 = await prisma.organization.upsert({
    where: { code: 'VPP-THIENLONG' },
    update: {},
    create: {
      code: 'VPP-THIENLONG',
      name: 'Công ty TNHH Văn Phòng Phẩm Thiên Long',
      legalName: 'Công ty TNHH Văn Phòng Phẩm Thiên Long',
      taxCode: '0301283456',
      companyType: CompanyType.SUPPLIER,
      industry: 'Văn phòng phẩm & Dụng cụ học tập',
      countryCode: 'VN',
      province: 'TP. Hồ Chí Minh',
      address: '222 Đường Nguyễn Văn Quá, Quận 12, TP. Hồ Chí Minh',
      phone: '028-3715-6789',
      email: 'contact@thienlong.vn',
      website: 'https://thienlong.vn',
      isActive: true,
      kycStatus: 'APPROVED',
      trustScore: 92.00,
      metadata: {
        businessAreas: ['Bút viết', 'Sổ sách', 'Dụng cụ học tập', 'File tài liệu'],
        yearEstablished: 1987,
        employeeCount: 120,
        annualRevenue: '100-200 tỷ VND'
      }
    }
  });
  console.log(`✅ Supplier 1 created: ${supplier1.name} (${supplier1.code})`);

  // Categories for Supplier 1 (Stationery)
  const supplier1Categories = [
    { code: 'VPP-01', name: 'Bút các loại', description: 'Bút bi, bút mực, bút chì, bút lông' },
    { code: 'VPP-02', name: 'Sổ sách - Tập vở', description: 'Sổ tay, tập vở học sinh, sổ còng' },
    { code: 'VPP-03', name: 'File - Bìa hồ sơ', description: 'File đựng tài liệu, bìa kẹp, bìa trình ký' },
    { code: 'VPP-04', name: 'Dụng cụ học tập', description: 'Gôm, thước, bảng viết, compa' },
    { code: 'VPP-05', name: 'Giấy in - Photo', description: 'Giấy A4, giấy photo, giấy decal' }
  ];

  const categories1: { id: string; code: string; name: string }[] = [];
  for (const catData of supplier1Categories) {
    let category = await prisma.productCategory.findFirst({ where: { code: catData.code } });
    if (!category) {
      category = await prisma.productCategory.create({
        data: { code: catData.code, name: catData.name, description: catData.description, isActive: true }
      });
      console.log(`   📁 Category created: ${category.name}`);
    }
    categories1.push({ id: category.id, code: category.code, name: category.name });

    // Link supplier to category
    const existingLink = await prisma.supplierCategory.findFirst({
      where: { supplierId: supplier1.id, categoryId: category.id }
    });
    if (!existingLink) {
      await prisma.supplierCategory.create({
        data: { supplierId: supplier1.id, categoryId: category.id, isPrimary: catData.code === 'VPP-01' }
      });
    }
  }

  // Products for Supplier 1
  const productsData1 = [
    { sku: 'TL-BUT-01', name: 'Bút bi Thiên Long TL-027', unitPriceRef: 3500, categoryCode: 'VPP-01', unit: 'CÁI', attributes: { brand: 'Thiên Long', type: 'Bút bi', color: 'Xanh' } },
    { sku: 'TL-BUT-02', name: 'Bút mực Thiên Long TL-09', unitPriceRef: 8500, categoryCode: 'VPP-01', unit: 'CÁI', attributes: { brand: 'Thiên Long', type: 'Bút mực', color: 'Đen' } },
    { sku: 'TL-BUT-03', name: 'Bút chì gỗ 2B Thiên Long', unitPriceRef: 2500, categoryCode: 'VPP-01', unit: 'CÁI', attributes: { brand: 'Thiên Long', type: 'Bút chì', hardness: '2B' } },
    { sku: 'TL-SO-01', name: 'Sổ tay A5 200 trang', unitPriceRef: 45000, categoryCode: 'VPP-02', unit: 'CÁI', attributes: { brand: 'Thiên Long', size: 'A5', pages: 200 } },
    { sku: 'TL-SO-02', name: 'Tập vở 96 trang 4 ô ly', unitPriceRef: 12000, categoryCode: 'VPP-02', unit: 'CÁI', attributes: { brand: 'Thiên Long', pages: 96, ruling: '4 ô ly' } },
    { sku: 'TL-FILE-01', name: 'File 2 còng A4', unitPriceRef: 25000, categoryCode: 'VPP-03', unit: 'CÁI', attributes: { brand: 'Thiên Long', type: 'File còng', rings: 2 } },
    { sku: 'TL-FILE-02', name: 'Bìa trình ký A4', unitPriceRef: 18000, categoryCode: 'VPP-03', unit: 'CÁI', attributes: { brand: 'Thiên Long', type: 'Bìa trình ký' } },
    { sku: 'TL-DUNG-01', name: 'Gôm tẩy Thiên Long', unitPriceRef: 5000, categoryCode: 'VPP-04', unit: 'CÁI', attributes: { brand: 'Thiên Long', type: 'Gôm tẩy' } },
    { sku: 'TL-DUNG-02', name: 'Thước kẻ 30cm', unitPriceRef: 8000, categoryCode: 'VPP-04', unit: 'CÁI', attributes: { brand: 'Thiên Long', length: '30cm' } },
    { sku: 'TL-GIAY-01', name: 'Giấy A4 Double A 70gsm', unitPriceRef: 65000, categoryCode: 'VPP-05', unit: 'RAM', attributes: { brand: 'Double A', size: 'A4', weight: '70gsm' } },
    { sku: 'TL-GIAY-02', name: 'Giấy in A4 IK Plus 70gsm', unitPriceRef: 55000, categoryCode: 'VPP-05', unit: 'RAM', attributes: { brand: 'IK Plus', size: 'A4', weight: '70gsm' } }
  ];

  const today = new Date();
  const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  for (const prodData of productsData1) {
    const category = categories1.find(c => c.code === prodData.categoryCode);
    if (!category) continue;

    let product = await prisma.product.findFirst({ where: { sku: prodData.sku } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          sku: prodData.sku,
          name: prodData.name,
          description: prodData.name,
          unit: prodData.unit,
          unitPriceRef: prodData.unitPriceRef,
          currency: CurrencyCode.VND,
          categoryId: category.id,
          type: ProductType.CATALOG,
          priceVolatility: PriceVolatility.STABLE,
          isActive: true,
          attributes: prodData.attributes,
          imageUrls: []
        }
      });
    }

    // Create supplier price with 15% discount
    const existingPrice = await prisma.supplierProductPrice.findFirst({
      where: { supplierId: supplier1.id, productId: product.id, effectiveFrom: today }
    });
    if (!existingPrice) {
      const supplierPrice = Math.round(prodData.unitPriceRef * 0.85);
      await prisma.supplierProductPrice.create({
        data: {
          supplierId: supplier1.id,
          productId: product.id,
          unitPrice: supplierPrice,
          currency: CurrencyCode.VND,
          minQty: 1,
          effectiveFrom: today,
          effectiveUntil: oneYearLater,
          isActive: true
        }
      });
    }
  }
  console.log(`   💰 Created ${productsData1.length} supplier prices (15% discount)\n`);

  // Users for Supplier 1
  const user1_1 = await prisma.user.upsert({
    where: { email: 'sales@thienlong.vn' },
    update: {},
    create: {
      email: 'sales@thienlong.vn',
      fullName: 'Trần Thị Lan - Sales Manager',
      role: UserRole.SUPPLIER,
      orgId: supplier1.id,
      passwordHash: PASSWORD_123_HASH,
      isActive: true,
      phone: '0909123451'
    }
  });
  console.log(`   👤 User: ${user1_1.fullName} (${user1_1.email})`);

  const user1_2 = await prisma.user.upsert({
    where: { email: 'support@thienlong.vn' },
    update: {},
    create: {
      email: 'support@thienlong.vn',
      fullName: 'Lê Văn Hùng - Technical Support',
      role: UserRole.SUPPLIER,
      orgId: supplier1.id,
      passwordHash: PASSWORD_123_HASH,
      isActive: true,
      phone: '0909123452'
    }
  });
  console.log(`   👤 User: ${user1_2.fullName} (${user1_2.email})\n`);

  // ==========================================
  // SUPPLIER 2: Công ty TNHH May Mặc Xuất Khẩu Việt Tiến
  // ==========================================
  console.log('🏢 Creating Supplier 2: May Mặc Xuất Khẩu Việt Tiến...');
  
  const supplier2 = await prisma.organization.upsert({
    where: { code: 'MM-VIETTIEN' },
    update: {},
    create: {
      code: 'MM-VIETTIEN',
      name: 'Công ty TNHH May Mặc Xuất Khẩu Việt Tiến',
      legalName: 'Công ty TNHH May Mặc Xuất Khẩu Việt Tiến',
      taxCode: '0300567890',
      companyType: CompanyType.SUPPLIER,
      industry: 'May mặc & Đồng phục',
      countryCode: 'VN',
      province: 'TP. Hồ Chí Minh',
      address: '333 Đường Tân Kỳ Tân Quý, Quận Bình Tân, TP. Hồ Chí Minh',
      phone: '028-3765-4321',
      email: 'contact@viettien.com.vn',
      website: 'https://viettien.com.vn',
      isActive: true,
      kycStatus: 'APPROVED',
      trustScore: 95.00,
      metadata: {
        businessAreas: ['Đồng phục công sở', 'Đồng phục công nhân', 'Áo sơ mi', 'Quần tây'],
        yearEstablished: 1975,
        employeeCount: 5000,
        annualRevenue: '2000+ tỷ VND'
      }
    }
  });
  console.log(`✅ Supplier 2 created: ${supplier2.name} (${supplier2.code})`);

  // Categories for Supplier 2 (Garments)
  const supplier2Categories = [
    { code: 'MM-01', name: 'Đồng phục công sở', description: 'Áo sơ mi, quần tây, váy công sở' },
    { code: 'MM-02', name: 'Đồng phục công nhân', description: 'Quần áo bảo hộ, đồng phục xí nghiệp' },
    { code: 'MM-03', name: 'Đồng phục bảo hộ', description: 'Áo phản quang, giày bảo hộ, mũ cứng' },
    { code: 'MM-04', name: 'Vải và nguyên liệu', description: 'Vải cotton, polyester, vải kaki' },
    { code: 'MM-05', name: 'Phụ kiện may mặc', description: 'Cúc áo, khóa kéo, chỉ may, nhãn mác' }
  ];

  const categories2: { id: string; code: string; name: string }[] = [];
  for (const catData of supplier2Categories) {
    let category = await prisma.productCategory.findFirst({ where: { code: catData.code } });
    if (!category) {
      category = await prisma.productCategory.create({
        data: { code: catData.code, name: catData.name, description: catData.description, isActive: true }
      });
      console.log(`   📁 Category created: ${category.name}`);
    }
    categories2.push({ id: category.id, code: category.code, name: category.name });

    const existingLink = await prisma.supplierCategory.findFirst({
      where: { supplierId: supplier2.id, categoryId: category.id }
    });
    if (!existingLink) {
      await prisma.supplierCategory.create({
        data: { supplierId: supplier2.id, categoryId: category.id, isPrimary: catData.code === 'MM-01' }
      });
    }
  }

  // Products for Supplier 2
  const productsData2 = [
    { sku: 'VT-SOMI-01', name: 'Áo sơ mi nam tay dài trắng', unitPriceRef: 285000, categoryCode: 'MM-01', unit: 'CÁI', attributes: { brand: 'Viet Tien', gender: 'Nam', sleeve: 'Tay dài', color: 'Trắng' } },
    { sku: 'VT-SOMI-02', name: 'Áo sơ mi nữ tay ngắn xanh', unitPriceRef: 265000, categoryCode: 'MM-01', unit: 'CÁI', attributes: { brand: 'Viet Tien', gender: 'Nữ', sleeve: 'Tay ngắn', color: 'Xanh' } },
    { sku: 'VT-QUAN-01', name: 'Quần tây nam đen', unitPriceRef: 385000, categoryCode: 'MM-01', unit: 'CÁI', attributes: { brand: 'Viet Tien', gender: 'Nam', type: 'Quần tây', color: 'Đen' } },
    { sku: 'VT-BH-01', name: 'Đồng phục công nhân xanh', unitPriceRef: 185000, categoryCode: 'MM-02', unit: 'BỘ', attributes: { brand: 'Viet Tien', type: 'Đồng phục công nhân', color: 'Xanh' } },
    { sku: 'VT-BH-02', name: 'Đồng phục công nhân cam', unitPriceRef: 185000, categoryCode: 'MM-02', unit: 'BỘ', attributes: { brand: 'Viet Tien', type: 'Đồng phục công nhân', color: 'Cam' } },
    { sku: 'VT-AOPQ-01', name: 'Áo phản quang cao cấp', unitPriceRef: 125000, categoryCode: 'MM-03', unit: 'CÁI', attributes: { brand: 'Viet Tien', type: 'Áo phản quang', reflectivity: 'Cao' } },
    { sku: 'VT-VAI-01', name: 'Vải cotton 100% khổ 1.5m', unitPriceRef: 85000, categoryCode: 'MM-04', unit: 'MÉT', attributes: { brand: 'Viet Tien', material: 'Cotton 100%', width: '1.5m' } },
    { sku: 'VT-VAI-02', name: 'Vải kaki 65/35 khổ 1.5m', unitPriceRef: 65000, categoryCode: 'MM-04', unit: 'MÉT', attributes: { brand: 'Viet Tien', material: 'Kaki 65/35', width: '1.5m' } },
    { sku: 'VT-PHU-01', name: 'Cúc áo 4 lỗ thép không gỉ', unitPriceRef: 500, categoryCode: 'MM-05', unit: 'CÁI', attributes: { brand: 'Viet Tien', type: 'Cúc áo', material: 'Thép không gỉ' } },
    { sku: 'VT-PHU-02', name: 'Khóa kéo YKK 20cm', unitPriceRef: 3500, categoryCode: 'MM-05', unit: 'CÁI', attributes: { brand: 'YKK', type: 'Khóa kéo', length: '20cm' } },
    { sku: 'VT-PHU-03', name: 'Nhãn mác vải dệt', unitPriceRef: 2000, categoryCode: 'MM-05', unit: 'CÁI', attributes: { brand: 'Viet Tien', type: 'Nhãn mác', material: 'Vải dệt' } }
  ];

  for (const prodData of productsData2) {
    const category = categories2.find(c => c.code === prodData.categoryCode);
    if (!category) continue;

    let product = await prisma.product.findFirst({ where: { sku: prodData.sku } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          sku: prodData.sku,
          name: prodData.name,
          description: prodData.name,
          unit: prodData.unit,
          unitPriceRef: prodData.unitPriceRef,
          currency: CurrencyCode.VND,
          categoryId: category.id,
          type: ProductType.CATALOG,
          priceVolatility: PriceVolatility.STABLE,
          isActive: true,
          attributes: prodData.attributes,
          imageUrls: []
        }
      });
    }

    const existingPrice = await prisma.supplierProductPrice.findFirst({
      where: { supplierId: supplier2.id, productId: product.id, effectiveFrom: today }
    });
    if (!existingPrice) {
      const supplierPrice = Math.round(prodData.unitPriceRef * 0.88);
      await prisma.supplierProductPrice.create({
        data: {
          supplierId: supplier2.id,
          productId: product.id,
          unitPrice: supplierPrice,
          currency: CurrencyCode.VND,
          minQty: 1,
          effectiveFrom: today,
          effectiveUntil: oneYearLater,
          isActive: true
        }
      });
    }
  }
  console.log(`   💰 Created ${productsData2.length} supplier prices (12% discount)\n`);

  // Users for Supplier 2
  const user2_1 = await prisma.user.upsert({
    where: { email: 'sales@viettien.com.vn' },
    update: {},
    create: {
      email: 'sales@viettien.com.vn',
      fullName: 'Nguyễn Thị Mai - Sales Director',
      role: UserRole.SUPPLIER,
      orgId: supplier2.id,
      passwordHash: PASSWORD_123_HASH,
      isActive: true,
      phone: '0909123453'
    }
  });
  console.log(`   👤 User: ${user2_1.fullName} (${user2_1.email})`);

  const user2_2 = await prisma.user.upsert({
    where: { email: 'b2b@viettien.com.vn' },
    update: {},
    create: {
      email: 'b2b@viettien.com.vn',
      fullName: 'Phạm Văn Đức - B2B Account Manager',
      role: UserRole.SUPPLIER,
      orgId: supplier2.id,
      passwordHash: PASSWORD_123_HASH,
      isActive: true,
      phone: '0909123454'
    }
  });
  console.log(`   👤 User: ${user2_2.fullName} (${user2_2.email})\n`);

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n==========================================');
  console.log('🎉 SUPPLIER SEED COMPLETED SUCCESSFULLY!');
  console.log('==========================================\n');
  
  console.log('📊 Summary:');
  console.log('─────────────────────────────────────────');
  console.log('SUPPLIER 1: Văn Phòng Phẩm Thiên Long');
  console.log('   Code: VPP-THIENLONG');
  console.log('   Industry: Văn phòng phẩm & Dụng cụ học tập');
  console.log('   Categories: 5 (Bút, Sổ sách, File, Dụng cụ, Giấy in)');
  console.log('   Products: 11 items');
  console.log('   Users: 2');
  console.log('   Test Login: sales@thienlong.vn / password123');
  console.log('─────────────────────────────────────────');
  console.log('SUPPLIER 2: May Mặc Xuất Khẩu Việt Tiến');
  console.log('   Code: MM-VIETTIEN');
  console.log('   Industry: May mặc & Đồng phục');
  console.log('   Categories: 5 (Đồng phục công sở, CN, BH, Vải, Phụ kiện)');
  console.log('   Products: 11 items');
  console.log('   Users: 2');
  console.log('   Test Login: sales@viettien.com.vn / password123');
  console.log('─────────────────────────────────────────\n');
  
  console.log('💡 All supplier users can login with: password123');
  console.log('📝 Total new products: 22 items');
  console.log('📝 Total new categories: 10 categories');
  console.log('📝 Total new users: 4 supplier accounts');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
