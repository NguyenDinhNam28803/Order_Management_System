/**
 * Seed file for 2 Additional Suppliers
 * Creates supplier companies with categories, products, and users
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

// Pre-computed bcrypt hash for 'password123' with 10 rounds
// You can generate this with: await bcrypt.hash('password123', 10)
const password = 'password123'
const PASSWORD_123_HASH = bcrypt.hashSync(password, 10);

async function main() {
  console.log('🌱 Seeding Additional Suppliers...\n');

  // ==========================================
  // SUPPLIER 1: Công ty TNHH Thiết Bị Điện Tử Phương Nam
  // ==========================================
  console.log('🏢 Creating Supplier 1: Thiết Bị Điện Tử Phương Nam...');
  
  const supplier1 = await prisma.organization.upsert({
    where: { code: 'TBDT-PHUONGNAM' },
    update: {},
    create: {
      code: 'TBDT-PHUONGNAM',
      name: 'Công ty TNHH Thiết Bị Điện Tử Phương Nam',
      legalName: 'Công ty TNHH Thiết Bị Điện Tử Phương Nam',
      taxCode: '0312345690',
      companyType: CompanyType.SUPPLIER,
      industry: 'Thiết bị điện tử & Công nghệ',
      countryCode: 'VN',
      province: 'TP. Hồ Chí Minh',
      address: '456 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh',
      phone: '028-5678-9012',
      email: 'contact@phuongnam-tech.vn',
      website: 'https://phuongnam-tech.vn',
      isActive: true,
      kycStatus: 'APPROVED',
      supplierTier: 'APPROVED',
      trustScore: 88.50,
      metadata: {
        businessAreas: ['Laptop', 'Máy tính', 'Thiết bị mạng', 'Phụ kiện IT'],
        yearEstablished: 2015,
        employeeCount: 35,
        annualRevenue: '20-50 tỷ VND'
      }
    }
  });
  console.log(`✅ Supplier 1 created: ${supplier1.name} (${supplier1.code})`);

  // Categories for Supplier 1 (Electronics/IT)
  const supplier1Categories = [
    { code: 'IT-01', name: 'Máy tính xách tay (Laptop)', description: 'Laptop các thương hiệu Dell, HP, Lenovo, Asus' },
    { code: 'IT-02', name: 'Máy tính để bàn', description: 'PC desktop, workstation' },
    { code: 'IT-03', name: 'Màn hình máy tính', description: 'Monitor LCD/LED các kích thước' },
    { code: 'IT-04', name: 'Thiết bị mạng', description: 'Router, switch, modem, access point' },
    { code: 'IT-05', name: 'Phụ kiện IT', description: 'Bàn phím, chuột, webcam, ổ cứng di động' }
  ];

  const categories1: Awaited<ReturnType<typeof prisma.productCategory.findFirst>>[] = [];
  for (const catData of supplier1Categories) {
    let category = await prisma.productCategory.findFirst({ where: { code: catData.code } });
    if (!category) {
      category = await prisma.productCategory.create({
        data: { code: catData.code, name: catData.name, description: catData.description, isActive: true }
      });
      console.log(`   📁 Category created: ${category.name}`);
    }
    categories1.push(category);

    // Link supplier to category
    const existingLink = await prisma.supplierCategory.findFirst({
      where: { supplierId: supplier1.id, categoryId: category.id }
    });
    if (!existingLink) {
      await prisma.supplierCategory.create({
        data: { supplierId: supplier1.id, categoryId: category.id, isPrimary: catData.code === 'IT-01' }
      });
    }
  }

  // Products for Supplier 1
  const productsData1 = [
    { sku: 'PN-LAPTOP-01', name: 'Laptop Dell Latitude 5520', unitPriceRef: 18500000, categoryCode: 'IT-01', unit: 'CÁI', attributes: { brand: 'Dell', cpu: 'i5-1145G7', ram: '16GB', ssd: '512GB' } },
    { sku: 'PN-LAPTOP-02', name: 'Laptop HP ProBook 450 G8', unitPriceRef: 16500000, categoryCode: 'IT-01', unit: 'CÁI', attributes: { brand: 'HP', cpu: 'i5-1135G7', ram: '8GB', ssd: '256GB' } },
    { sku: 'PN-LAPTOP-03', name: 'Laptop Lenovo ThinkPad E15', unitPriceRef: 17500000, categoryCode: 'IT-01', unit: 'CÁI', attributes: { brand: 'Lenovo', cpu: 'i5-1135G7', ram: '16GB', ssd: '512GB' } },
    { sku: 'PN-PC-01', name: 'PC Dell OptiPlex 5090', unitPriceRef: 12500000, categoryCode: 'IT-02', unit: 'CÁI', attributes: { brand: 'Dell', cpu: 'i5-10500', ram: '8GB', ssd: '256GB' } },
    { sku: 'PN-PC-02', name: 'PC HP ProDesk 400 G7', unitPriceRef: 11500000, categoryCode: 'IT-02', unit: 'CÁI', attributes: { brand: 'HP', cpu: 'i5-10500', ram: '8GB', ssd: '256GB' } },
    { sku: 'PN-MONITOR-01', name: 'Màn hình Dell P2419H 24 inch', unitPriceRef: 4500000, categoryCode: 'IT-03', unit: 'CÁI', attributes: { brand: 'Dell', size: '24 inch', resolution: 'Full HD', panel: 'IPS' } },
    { sku: 'PN-MONITOR-02', name: 'Màn hình HP P24v G4 23.8 inch', unitPriceRef: 3800000, categoryCode: 'IT-03', unit: 'CÁI', attributes: { brand: 'HP', size: '23.8 inch', resolution: 'Full HD', panel: 'IPS' } },
    { sku: 'PN-NETWORK-01', name: 'Router Cisco RV340', unitPriceRef: 8500000, categoryCode: 'IT-04', unit: 'CÁI', attributes: { brand: 'Cisco', ports: '4x Gigabit', vpn: 'IPsec VPN' } },
    { sku: 'PN-NETWORK-02', name: 'Switch TP-Link TL-SG1024D', unitPriceRef: 2200000, categoryCode: 'IT-04', unit: 'CÁI', attributes: { brand: 'TP-Link', ports: '24x Gigabit', type: 'Unmanaged' } },
    { sku: 'PN-ACCESSORY-01', name: 'Bàn phím Logitech K120', unitPriceRef: 250000, categoryCode: 'IT-05', unit: 'CÁI', attributes: { brand: 'Logitech', type: 'Có dây', layout: 'Full-size' } },
    { sku: 'PN-ACCESSORY-02', name: 'Chuột Logitech M185 Wireless', unitPriceRef: 180000, categoryCode: 'IT-05', unit: 'CÁI', attributes: { brand: 'Logitech', type: 'Wireless', connection: 'USB Receiver' } },
    { sku: 'PN-ACCESSORY-03', name: 'Webcam Logitech C920e', unitPriceRef: 1500000, categoryCode: 'IT-05', unit: 'CÁI', attributes: { brand: 'Logitech', resolution: '1080p', type: 'HD Pro' } }
  ];

  const today = new Date();
  const oneYearLater = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  
  for (const prodData of productsData1) {
    const category = categories1.find(c => c?.code === prodData.categoryCode);
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

    // Create supplier price with 12% discount
    const existingPrice = await prisma.supplierProductPrice.findFirst({
      where: { supplierId: supplier1.id, productId: product.id, effectiveFrom: today }
    });
    if (!existingPrice) {
      const supplierPrice = Math.round(prodData.unitPriceRef * 0.88);
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
  console.log(`   💰 Created ${productsData1.length} supplier prices (12% discount)\n`);

  // Users for Supplier 1
  const user1_1 = await prisma.user.upsert({
    where: { email: 'sales@phuongnam-tech.vn' },
    update: {},
    create: {
      email: 'sales@phuongnam-tech.vn',
      fullName: 'Nguyễn Văn Phương - Sales Manager',
      role: UserRole.SUPPLIER,
      orgId: supplier1.id,
      passwordHash: PASSWORD_123_HASH,
      isActive: true,
      phone: '0909123457'
    }
  });
  console.log(`   👤 User: ${user1_1.fullName} (${user1_1.email}) - Pass: password123`);

  const user1_2 = await prisma.user.upsert({
    where: { email: 'support@phuongnam-tech.vn' },
    update: {},
    create: {
      email: 'support@phuongnam-tech.vn',
      fullName: 'Lê Thị Lan - Technical Support',
      role: UserRole.SUPPLIER,
      orgId: supplier1.id,
      passwordHash: PASSWORD_123_HASH,
      isActive: true,
      phone: '0909123458'
    }
  });
  console.log(`   👤 User: ${user1_2.fullName} (${user1_2.email}) - Pass: password123\n`);

  // ==========================================
  // SUPPLIER 2: Công ty TNHH Vật Tư Công Nghiệp Bắc Việt
  // ==========================================
  console.log('🏢 Creating Supplier 2: Vật Tư Công Nghiệp Bắc Việt...');
  
  const supplier2 = await prisma.organization.upsert({
    where: { code: 'VT-BACVIET' },
    update: {},
    create: {
      code: 'VT-BACVIET',
      name: 'Công ty TNHH Vật Tư Công Nghiệp Bắc Việt',
      legalName: 'Công ty TNHH Vật Tư Công Nghiệp Bắc Việt',
      taxCode: '0312345691',
      companyType: CompanyType.SUPPLIER,
      industry: 'Vật tư công nghiệp & Dụng cụ sửa chữa',
      countryCode: 'VN',
      province: 'Hà Nội',
      address: '789 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội',
      phone: '024-3456-7890',
      email: 'contact@bacviet-ind.vn',
      website: 'https://bacviet-ind.vn',
      isActive: true,
      kycStatus: 'APPROVED',
      supplierTier: 'APPROVED',
      trustScore: 90.00,
      metadata: {
        businessAreas: ['Dụng cụ cầm tay', 'Thiết bị bảo hộ', 'Vật liệu công nghiệp', 'Máy móc công cụ'],
        yearEstablished: 2012,
        employeeCount: 25,
        annualRevenue: '10-30 tỷ VND'
      }
    }
  });
  console.log(`✅ Supplier 2 created: ${supplier2.name} (${supplier2.code})`);

  // Categories for Supplier 2 (Industrial Supplies)
  const supplier2Categories = [
    { code: 'IND-01', name: 'Dụng cụ cầm tay', description: 'Máy khoan, máy mài, máy cắt các loại' },
    { code: 'IND-02', name: 'Thiết bị bảo hộ lao động', description: 'Mũ bảo hộ, găng tay, giày bảo hộ, kính bảo hộ' },
    { code: 'IND-03', name: 'Vật liệu công nghiệp', description: 'Dây điện, ống nhựa, phụ kiện công nghiệp' },
    { code: 'IND-04', name: 'Dụng cụ đo lường', description: 'Thước đo, đồng hồ vạn năng, cân điện tử' },
    { code: 'IND-05', name: 'Máy móc công nghiệp nhỏ', description: 'Máy nén khí, máy hàn, máy phát điện mini' }
  ];

  const categories2: Awaited<ReturnType<typeof prisma.productCategory.findFirst>>[] = [];
  for (const catData of supplier2Categories) {
    let category = await prisma.productCategory.findFirst({ where: { code: catData.code } });
    if (!category) {
      category = await prisma.productCategory.create({
        data: { code: catData.code, name: catData.name, description: catData.description, isActive: true }
      });
      console.log(`   📁 Category created: ${category.name}`);
    }
    categories2.push(category);

    const existingLink = await prisma.supplierCategory.findFirst({
      where: { supplierId: supplier2.id, categoryId: category.id }
    });
    if (!existingLink) {
      await prisma.supplierCategory.create({
        data: { supplierId: supplier2.id, categoryId: category.id, isPrimary: catData.code === 'IND-01' }
      });
    }
  }

  // Products for Supplier 2
  const productsData2 = [
    { sku: 'BV-DRILL-01', name: 'Máy khoan Bosch GSB 550', unitPriceRef: 1200000, categoryCode: 'IND-01', unit: 'CÁI', attributes: { brand: 'Bosch', power: '550W', type: 'Khoan động lực' } },
    { sku: 'BV-DRILL-02', name: 'Máy khoan Makita HP1630', unitPriceRef: 1500000, categoryCode: 'IND-01', unit: 'CÁI', attributes: { brand: 'Makita', power: '710W', type: 'Khoan động lực' } },
    { sku: 'BV-GRINDER-01', name: 'Máy mài góc Bosch GWS 060', unitPriceRef: 850000, categoryCode: 'IND-01', unit: 'CÁI', attributes: { brand: 'Bosch', power: '670W', discSize: '100mm' } },
    { sku: 'BV-HELMET-01', name: 'Mũ bảo hộ 3M H-700', unitPriceRef: 180000, categoryCode: 'IND-02', unit: 'CÁI', attributes: { brand: '3M', color: 'Trắng', material: 'HDPE' } },
    { sku: 'BV-GLOVES-01', name: 'Găng tay bảo hộ Ansell Edge', unitPriceRef: 45000, categoryCode: 'IND-02', unit: 'ĐÔI', attributes: { brand: 'Ansell', type: 'Phủ cao su', size: 'Size 9/L' } },
    { sku: 'BV-SHOES-01', name: 'Giày bảo hộ Jogger Bestrun', unitPriceRef: 680000, categoryCode: 'IND-02', unit: 'ĐÔI', attributes: { brand: 'Safety Jogger', toe: 'Thép chống đập', size: '42' } },
    { sku: 'BV-WIRE-01', name: 'Dây điện Cadivi CV 2.5mm²', unitPriceRef: 8500, categoryCode: 'IND-03', unit: 'MÉT', attributes: { brand: 'Cadivi', section: '2.5mm²', type: 'CV - Single core' } },
    { sku: 'BV-WIRE-02', name: 'Dây điện Cadivi CV 4.0mm²', unitPriceRef: 13500, categoryCode: 'IND-03', unit: 'MÉT', attributes: { brand: 'Cadivi', section: '4.0mm²', type: 'CV - Single core' } },
    { sku: 'BV-PIPE-01', name: 'Ống nhựa Bình Minh Ø21mm', unitPriceRef: 8500, categoryCode: 'IND-03', unit: 'MÉT', attributes: { brand: 'Bình Minh', diameter: '21mm', type: 'PVC Class 4' } },
    { sku: 'BV-MEASURE-01', name: 'Thước cuộn Stanley 5m', unitPriceRef: 180000, categoryCode: 'IND-04', unit: 'CÁI', attributes: { brand: 'Stanley', length: '5m', width: '19mm' } },
    { sku: 'BV-MEASURE-02', name: 'Đồng hồ vạn năng Uni-T UT33D', unitPriceRef: 320000, categoryCode: 'IND-04', unit: 'CÁI', attributes: { brand: 'Uni-T', type: 'Digital', functions: 'Volt/Amp/Ohm' } },
    { sku: 'BV-AIRCOMP-01', name: 'Máy nén khí Pancake 24L', unitPriceRef: 2800000, categoryCode: 'IND-05', unit: 'CÁI', attributes: { brand: 'Oshima', power: '1.5HP', tank: '24L' } }
  ];

  for (const prodData of productsData2) {
    const category = categories2.find(c => c?.code === prodData.categoryCode);
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
      const supplierPrice = Math.round(prodData.unitPriceRef * 0.90);
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
  console.log(`   💰 Created ${productsData2.length} supplier prices (10% discount)\n`);

  // Users for Supplier 2
  const user2_1 = await prisma.user.upsert({
    where: { email: 'sales@bacviet-ind.vn' },
    update: {},
    create: {
      email: 'sales@bacviet-ind.vn',
      fullName: 'Trần Văn Bắc - Sales Director',
      role: UserRole.SUPPLIER,
      orgId: supplier2.id,
      passwordHash: PASSWORD_123_HASH,
      isActive: true,
      phone: '0909123459'
    }
  });
  console.log(`   👤 User: ${user2_1.fullName} (${user2_1.email}) - Pass: password123`);

  const user2_2 = await prisma.user.upsert({
    where: { email: 'manager@bacviet-ind.vn' },
    update: {},
    create: {
      email: 'manager@bacviet-ind.vn',
      fullName: 'Phạm Thị Hương - Account Manager',
      role: UserRole.SUPPLIER,
      orgId: supplier2.id,
      passwordHash: PASSWORD_123_HASH,
      isActive: true,
      phone: '0909123460'
    }
  });
  console.log(`   👤 User: ${user2_2.fullName} (${user2_2.email}) - Pass: password123\n`);

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n==========================================');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('==========================================\n');
  
  console.log('📊 Summary:');
  console.log('─────────────────────────────────────────');
  console.log('SUPPLIER 1: Thiết Bị Điện Tử Phương Nam');
  console.log('   Code: TBDT-PHUONGNAM');
  console.log('   Categories: 5 (IT/Laptop/Desktop/Monitor/Network/Accessory)');
  console.log('   Products: 12 items');
  console.log('   Users: 2');
  console.log('   Test Login: sales@phuongnam-tech.vn / password123');
  console.log('─────────────────────────────────────────');
  console.log('SUPPLIER 2: Vật Tư Công Nghiệp Bắc Việt');
  console.log('   Code: VT-BACVIET');
  console.log('   Categories: 5 (Tools/PPE/Materials/Measurement/Machinery)');
  console.log('   Products: 12 items');
  console.log('   Users: 2');
  console.log('   Test Login: sales@bacviet-ind.vn / password123');
  console.log('─────────────────────────────────────────\n');
  
  console.log('💡 All supplier users can login with: password123');
  console.log('📝 Password hash (bcrypt, 10 rounds):');
  console.log('   ' + PASSWORD_123_HASH.substring(0, 30) + '...\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
