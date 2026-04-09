/**
 * Seed file for Office Supplies Supplier
 * Creates a supplier company with categories and products (price <= 2,000,000 VND)
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

async function main() {
  console.log('🌱 Seeding Office Supplies Supplier...');

  // 1. Create Supplier Organization
  const supplier = await prisma.organization.upsert({
    where: { code: 'VPP-HOANGGIA' },
    update: {},
    create: {
      code: 'VPP-HOANGGIA',
      name: 'Công ty TNHH Văn Phòng Phẩm Hoàng Gia',
      legalName: 'Công ty TNHH Văn Phòng Phẩm Hoàng Gia',
      taxCode: '0312345689',
      companyType: CompanyType.SUPPLIER,
      industry: 'Văn phòng phẩm & Thiết bị văn phòng',
      countryCode: 'VN',
      province: 'TP. Hồ Chí Minh',
      address: '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
      phone: '028-1234-5678',
      email: 'contact@hoanggia-vpp.vn',
      website: 'https://hoanggia-vpp.vn',
      isActive: true,
      kycStatus: 'APPROVED',
      supplierTier: 'PREFERRED',
      trustScore: 95.50,
      metadata: {
        businessAreas: ['Văn phòng phẩm', 'Thiết bị văn phòng', 'Dụng cụ học tập'],
        yearEstablished: 2010,
        employeeCount: 50,
        annualRevenue: '50-100 tỷ VND'
      }
    }
  });
  console.log(`✅ Supplier created: ${supplier.name} (${supplier.code})`);

  // 2. Create Product Categories (if not exist)
  const categoriesData = [
    { code: 'VPP-01', name: 'Bút viết các loại', description: 'Bút bi, bút chì, bút dạ quang, bút lông' },
    { code: 'VPP-02', name: 'Giấy in ấn', description: 'Giấy A4, A3, giấy photo, giấy in nhiệt' },
    { code: 'VPP-03', name: 'File & Bìa', description: 'File tài liệu, bìa cứng, bìa lỗ, kẹp giấy' },
    { code: 'VPP-04', name: 'Dụng cụ văn phòng', description: 'Băng keo, kéo, thước, kẹp bướm, ghim bấm' },
    { code: 'TBVP-01', name: 'Thiết bị văn phòng nhỏ', description: 'Máy tính cầm tay, máy đóng ghim, bấm lỗ' },
    { code: 'TBVP-02', name: 'Lưu trữ & Tổ chức', description: 'Hộp đựng tài liệu, kệ gỗ, giá sách mini' }
  ];

  const categories: Awaited<ReturnType<typeof prisma.productCategory.findFirst>>[] = [];
  for (const catData of categoriesData) {
    // Check if category exists by code
    let category = await prisma.productCategory.findFirst({
      where: { code: catData.code }
    });
    
    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          code: catData.code,
          name: catData.name,
          description: catData.description,
          isActive: true
        }
      });
      console.log(`✅ Category created: ${category.name} (${category.code})`);
    } else {
      console.log(`✅ Category exists: ${category.name} (${category.code})`);
    }
    categories.push(category);
  }

  // 3. Create Products with prices <= 2,000,000 VND
  const productsData = [
    // Bút viết các loại (VPP-01)
    {
      sku: 'HG-BUTBI-01',
      name: 'Bút bi Thiên Long TL-027',
      description: 'Bút bi nước Thiên Long TL-027, ngòi 0.5mm, viết trơn, mực đều',
      unit: 'CÂY',
      unitPriceRef: 3500,
      categoryCode: 'VPP-01',
      attributes: { brand: 'Thiên Long', inkColor: 'Xanh', tipSize: '0.5mm' }
    },
    {
      sku: 'HG-BUTBI-02',
      name: 'Bút bi Thiên Long TL-031',
      description: 'Bút bi nước Thiên Long TL-031, ngòi 0.7mm, thân trong suốt',
      unit: 'CÂY',
      unitPriceRef: 4000,
      categoryCode: 'VPP-01',
      attributes: { brand: 'Thiên Long', inkColor: 'Đen', tipSize: '0.7mm' }
    },
    {
      sku: 'HG-BUTCHI-01',
      name: 'Bút chì gỗ 2B Deli',
      description: 'Bút chì gỗ Deli 2B, gỗ tự nhiên cao cấp, dễ gọt',
      unit: 'CÂY',
      unitPriceRef: 2500,
      categoryCode: 'VPP-01',
      attributes: { brand: 'Deli', hardness: '2B', material: 'Gỗ tự nhiên' }
    },
    {
      sku: 'HG-BUTDQ-01',
      name: 'Bút dạ quang Stabilo Boss Original',
      description: 'Bút dạ quang Stabilo Boss, 6 màu pastel, không lem mực',
      unit: 'BỘ',
      unitPriceRef: 185000,
      categoryCode: 'VPP-01',
      attributes: { brand: 'Stabilo', colors: 6, type: 'Dạ quang' }
    },
    {
      sku: 'HG-BUTLONG-01',
      name: 'Bút lông dầu Thiên Long PM-01',
      description: 'Bút lông dầu Thiên Long PM-01, viết trên mọi chất liệu',
      unit: 'CÂY',
      unitPriceRef: 12000,
      categoryCode: 'VPP-01',
      attributes: { brand: 'Thiên Long', color: 'Đen/Đỏ/Xanh', inkType: 'Dầu' }
    },

    // Giấy in ấn (VPP-02)
    {
      sku: 'HG-GIAYA4-01',
      name: 'Giấy A4 Double A 70gsm',
      description: 'Giấy A4 Double A 70gsm, độ trắng cao, chống kẹt máy',
      unit: 'RAM',
      unitPriceRef: 55000,
      categoryCode: 'VPP-02',
      attributes: { brand: 'Double A', weight: '70gsm', size: 'A4', sheets: 500 }
    },
    {
      sku: 'HG-GIAYA4-02',
      name: 'Giấy A4 Paper One 75gsm',
      description: 'Giấy A4 Paper One 75gsm, chất lượng cao, in ấn sắc nét',
      unit: 'RAM',
      unitPriceRef: 62000,
      categoryCode: 'VPP-02',
      attributes: { brand: 'Paper One', weight: '75gsm', size: 'A4', sheets: 500 }
    },
    {
      sku: 'HG-GIAYA3-01',
      name: 'Giấy A3 Double A 70gsm',
      description: 'Giấy A3 Double A 70gsm, dùng cho in ấn tài liệu lớn',
      unit: 'RAM',
      unitPriceRef: 110000,
      categoryCode: 'VPP-02',
      attributes: { brand: 'Double A', weight: '70gsm', size: 'A3', sheets: 500 }
    },
    {
      sku: 'HG-GIAYNOTE-01',
      name: 'Giấy note 3x3 inch Post-it 654',
      description: 'Giấy ghi chú Post-it 654, 100 tờ/xấp, dính tốt',
      unit: 'XẤP',
      unitPriceRef: 28000,
      categoryCode: 'VPP-02',
      attributes: { brand: '3M Post-it', size: '3x3 inch', sheets: 100, color: 'Vàng' }
    },

    // File & Bìa (VPP-03)
    {
      sku: 'HG-FILE-01',
      name: 'File lá F4 Thiên Long 20 lá',
      description: 'File lá Thiên Long F4, 20 lá trong, bìa nhựa cứng',
      unit: 'CÁI',
      unitPriceRef: 18000,
      categoryCode: 'VPP-03',
      attributes: { brand: 'Thiên Long', size: 'F4', pockets: 20, material: 'Nhựa' }
    },
    {
      sku: 'HG-FILE-02',
      name: 'File lá F4 Thiên Long 40 lá',
      description: 'File lá Thiên Long F4, 40 lá trong, nhiều màu',
      unit: 'CÁI',
      unitPriceRef: 32000,
      categoryCode: 'VPP-03',
      attributes: { brand: 'Thiên Long', size: 'F4', pockets: 40, material: 'Nhựa' }
    },
    {
      sku: 'HG-BIALO-01',
      name: 'Bìa lỗ A4 Deli 3820',
      description: 'Bìa lỗ A4 Deli 3820, nhựa PP trong, 100 tờ/bịch',
      unit: 'BỊCH',
      unitPriceRef: 45000,
      categoryCode: 'VPP-03',
      attributes: { brand: 'Deli', size: 'A4', quantity: 100, material: 'PP' }
    },
    {
      sku: 'HG-KEP-01',
      name: 'Kẹp bướm 51mm Deli (hộp 12 cái)',
      description: 'Kẹp bướm Deli 51mm, thép không gỉ, giữ chặt tài liệu',
      unit: 'HỘP',
      unitPriceRef: 42000,
      categoryCode: 'VPP-03',
      attributes: { brand: 'Deli', size: '51mm', quantity: 12, material: 'Thép' }
    },
    {
      sku: 'HG-GHIM-01',
      name: 'Ghim bấm số 10 Plus (hộp 1000 ghim)',
      description: 'Ghim bấm số 10 Plus, chất lượng Nhật Bản, bền chắc',
      unit: 'HỘP',
      unitPriceRef: 18000,
      categoryCode: 'VPP-03',
      attributes: { brand: 'Plus', size: 'Số 10', quantity: 1000, origin: 'Nhật Bản' }
    },

    // Dụng cụ văn phòng (VPP-04)
    {
      sku: 'HG-BANGKEO-01',
      name: 'Băng keo trong 5cm x 100Y',
      description: 'Băng keo trong 5cm x 100Yard, dính tốt, dễ xé',
      unit: 'CUỘN',
      unitPriceRef: 15000,
      categoryCode: 'VPP-04',
      attributes: { width: '5cm', length: '100Y', type: 'Trong suốt', adhesive: 'Acrylic' }
    },
    {
      sku: 'HG-BANGKEO-02',
      name: 'Băng keo 2 mặt 2cm x 10m Scotch',
      description: 'Băng keo 2 mặt Scotch, dính chắc, không lưu keo',
      unit: 'CUỘN',
      unitPriceRef: 35000,
      categoryCode: 'VPP-04',
      attributes: { brand: '3M Scotch', width: '2cm', length: '10m', type: '2 mặt' }
    },
    {
      sku: 'HG-KEO-01',
      name: 'Keo khô PVP 15g (20 cái/hộp)',
      description: 'Keo khô PVP 15g, dán giấy tốt, không độc hại',
      unit: 'HỘP',
      unitPriceRef: 28000,
      categoryCode: 'VPP-04',
      attributes: { brand: 'PVP', weight: '15g', quantity: 20, type: 'Keo khô' }
    },
    {
      sku: 'HG-THUOC-01',
      name: 'Thước kẻ nhựa 30cm Deli 6230',
      description: 'Thước kẻ nhựa Deli 30cm, chia vạch rõ ràng, không phai',
      unit: 'CÁI',
      unitPriceRef: 8000,
      categoryCode: 'VPP-04',
      attributes: { brand: 'Deli', length: '30cm', material: 'Nhựa trong' }
    },

    // Thiết bị văn phòng nhỏ (TBVP-01)
    {
      sku: 'HG-MAYTINH-01',
      name: 'Máy tính Casio MX-12B',
      description: 'Máy tính Casio MX-12B, 12 số, pin năng lượng mặt trời',
      unit: 'CÁI',
      unitPriceRef: 165000,
      categoryCode: 'TBVP-01',
      attributes: { brand: 'Casio', digits: 12, power: 'Solar/Battery', size: 'Medium' }
    },
    {
      sku: 'HG-MAYTINH-02',
      name: 'Máy tính Casio JS-40B',
      description: 'Máy tính Casio JS-40B, 14 số, chức năng kiểm toán',
      unit: 'CÁI',
      unitPriceRef: 385000,
      categoryCode: 'TBVP-01',
      attributes: { brand: 'Casio', digits: 14, power: 'Solar/Battery', features: 'Kiểm toán' }
    },
    {
      sku: 'HG-DONGGhim-01',
      name: 'Máy đóng ghim số 3 Plus 30 tờ',
      description: 'Máy đóng ghim Plus, đóng được 30 tờ, thép cao cấp',
      unit: 'CÁI',
      unitPriceRef: 145000,
      categoryCode: 'TBVP-01',
      attributes: { brand: 'Plus', capacity: '30 tờ', type: 'Số 3', origin: 'Nhật Bản' }
    },
    {
      sku: 'HG-BAMLO-01',
      name: 'Máy bấm lỗ Deli 0102 20 tờ',
      description: 'Máy bấm lỗ Deli 0102, bấm 20 tờ/lần, thép đặc biệt',
      unit: 'CÁI',
      unitPriceRef: 125000,
      categoryCode: 'TBVP-01',
      attributes: { brand: 'Deli', capacity: '20 tờ', holes: 2, material: 'Thép' }
    },

    // Lưu trữ & Tổ chức (TBVP-02)
    {
      sku: 'HG-HOP-01',
      name: 'Hộp đựng tài liệu A4 nhựa trong',
      description: 'Hộp đựng tài liệu A4, nắp đậy chắc chắn, có khóa',
      unit: 'CÁI',
      unitPriceRef: 55000,
      categoryCode: 'TBVP-02',
      attributes: { size: 'A4', material: 'Nhựa trong', feature: 'Có nắp đậy' }
    },
    {
      sku: 'HG-KEGO-01',
      name: 'Kệ tài liệu gỗ 3 tầng Mini',
      description: 'Kệ tài liệu gỗ 3 tầng, thiết kế nhỏ gọn cho bàn làm việc',
      unit: 'CÁI',
      unitPriceRef: 185000,
      categoryCode: 'TBVP-02',
      attributes: { tiers: 3, material: 'Gỗ ép', size: '25x20x30cm', color: 'Vân gỗ' }
    },
    {
      sku: 'HG-KEGO-02',
      name: 'Kệ sách mini để bàn đa năng',
      description: 'Kệ sách mini để bàn, đa năng, có ngăn kéo nhỏ',
      unit: 'CÁI',
      unitPriceRef: 245000,
      categoryCode: 'TBVP-02',
      attributes: { tiers: 2, material: 'Gỗ + Nhựa', feature: 'Có ngăn kéo', size: '40x15x35cm' }
    },
    {
      sku: 'HG-KEODA-01',
      name: 'Khay đựng tài liệu 3 ngăn Xukiva',
      description: 'Khay đựng tài liệu 3 ngăn Xukiva, nhựa cao cấp, nhiều màu',
      unit: 'BỘ',
      unitPriceRef: 195000,
      categoryCode: 'TBVP-02',
      attributes: { brand: 'Xukiva', compartments: 3, material: 'Nhựa ABS', feature: 'Xếp chồng được' }
    },
    {
      sku: 'HG-KEODA-02',
      name: 'Khay đựng bút đa năng Deli 9115',
      description: 'Khay đựng bút Deli 9115, 7 ngăn, có ngăn kéo nhỏ',
      unit: 'CÁI',
      unitPriceRef: 85000,
      categoryCode: 'TBVP-02',
      attributes: { brand: 'Deli', compartments: 7, material: 'Nhựa', feature: 'Có ngăn kéo' }
    }
  ];

  const products: { product: Awaited<ReturnType<typeof prisma.product.create>>; category: NonNullable<Awaited<ReturnType<typeof prisma.productCategory.findFirst>>> }[] = [];
  for (const prodData of productsData) {
    const category = categories.find(c => c?.code === prodData.categoryCode);
    if (!category) continue;

    // Check if product exists by SKU
    let product = await prisma.product.findFirst({
      where: { sku: prodData.sku }
    });
    
    if (!product) {
      product = await prisma.product.create({
        data: {
          sku: prodData.sku,
          name: prodData.name,
          description: prodData.description,
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
      console.log(`✅ Product created: ${product.name} (${product.sku}) - ${Number(product.unitPriceRef).toLocaleString('vi-VN')} VND`);
    } else {
      console.log(`✅ Product exists: ${product.name} (${product.sku}) - ${Number(product.unitPriceRef).toLocaleString('vi-VN')} VND`);
    }
    products.push({ product, category });
  }

  // 4. Link Supplier to Categories (SupplierCategory)
  for (const category of categories.filter((c): c is NonNullable<typeof c> => c !== null)) {
    // Check if link exists
    const existingLink = await prisma.supplierCategory.findFirst({
      where: {
        supplierId: supplier.id,
        categoryId: category.id
      }
    });
    
    if (!existingLink) {
      await prisma.supplierCategory.create({
        data: {
          supplierId: supplier.id,
          categoryId: category!.id,
          isPrimary: category!.code === 'VPP-01' // Primary category is "Bút viết"
        }
      });
    }
  }
  console.log(`✅ Linked supplier to ${categories.length} categories`);

  // 5. Create Supplier Product Prices
  const today = new Date();
  const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  for (const { product } of products) {
    // Add some price variation for supplier (usually 10-20% lower than reference)
    const discountPercent = 0.85; // 15% discount
    const supplierPrice = Math.round((product.unitPriceRef?.toNumber() || 0) * discountPercent);

    // Check if price exists
    const existingPrice = await prisma.supplierProductPrice.findFirst({
      where: {
        supplierId: supplier.id,
        productId: product.id,
        effectiveFrom: today
      }
    });
    
    if (!existingPrice) {
      await prisma.supplierProductPrice.create({
        data: {
          supplierId: supplier.id,
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
  console.log(`✅ Created supplier prices for ${products.length} products (15% discount applied)`);

  // 6. Create Supplier User
  const supplierUser = await prisma.user.upsert({
    where: { email: 'sales@hoanggia-vpp.vn' },
    update: {},
    create: {
      email: 'sales@hoanggia-vpp.vn',
      fullName: 'Nguyễn Văn Hoàng - Sales Manager',
      role: UserRole.SUPPLIER,
      orgId: supplier.id,
      passwordHash: '$2b$10$EpRnTzVlqHNP0.fabX/EzOe9QY/JxY2v0J/cbp0ZJXgE5hRvxQ.Ly', // Password: Password123!
      isActive: true,
      phone: '0909123456'
    }
  });
  console.log(`✅ Supplier user created: ${supplierUser.fullName} (${supplierUser.email})`);

  // 7. Create second Supplier User with password123
  const passwordHash2 = await bcrypt.hash('password123', 10);
  const supplierUser2 = await prisma.user.upsert({
    where: { email: 'manager@hoanggia-vpp.vn' },
    update: {},
    create: {
      email: 'manager@hoanggia-vpp.vn',
      fullName: 'Trần Thị Mỹ Linh - Account Manager',
      role: UserRole.SUPPLIER,
      orgId: supplier.id,
      passwordHash: passwordHash2,
      isActive: true,
      phone: '0909234567'
    }
  });
  console.log(`✅ Second supplier user created: ${supplierUser2.fullName} (${supplierUser2.email}) - Password: password123`);

  console.log('\n🎉 Seed completed successfully!');
  console.log(`   Supplier: ${supplier.name}`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Products: ${products.length} (all <= 2,000,000 VND)`);
  console.log(`   User: ${supplierUser.fullName} (${supplierUser.email})`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
