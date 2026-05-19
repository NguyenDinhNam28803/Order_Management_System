import {
  PrismaClient,
  CompanyType,
  KycStatus,
  CurrencyCode,
  ProductType,
  SupplierTier,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    '🚀 Seeding FPT Shop organization with technology products and categories...',
  );

  // 1. Create FPT Shop Organization (SUPPLIER)
  const org = await prisma.organization.upsert({
    where: { code: 'FPT_SHOP' },
    update: {},
    create: {
      code: 'FPT_SHOP',
      name: 'FPT Shop',
      legalName: 'FPT Shop Electronics Co., Ltd',
      taxCode: '0901234567',
      companyType: CompanyType.SUPPLIER,
      industry: 'Consumer Electronics & Technology Retail',
      countryCode: 'VN',
      province: 'Ho Chi Minh',
      address: '477 Nguyen Trai Street, District 1, Ho Chi Minh City',
      phone: '+84-28-3821-6888',
      email: 'support@fptshop.com.vn',
      website: 'https://www.fptshop.com.vn',
      isActive: true,
      kycStatus: KycStatus.APPROVED,
      supplierTier: SupplierTier.APPROVED,
      trustScore: 92,
    },
  });

  console.log(`✅ Organization created: ${org.name} (ID: ${org.id})`);

  // 2. Create Product Categories for FPT Shop
  const categories = [
    {
      code: 'FPT_LAPTOP',
      name: 'Máy tính & Laptop',
      description: 'Máy tính cá nhân, laptop, desktop, workstation',
    },
    {
      code: 'FPT_SMARTPHONE',
      name: 'Điện thoại thông minh',
      description: 'Smartphone, điện thoại di động các thương hiệu',
    },
    {
      code: 'FPT_TABLET',
      name: 'Tablet & Accessories',
      description: 'Máy tính bảng và các phụ kiện kèm theo',
    },
    {
      code: 'FPT_PERIPHERALS',
      name: 'Ngoại vi máy tính',
      description: 'Chuột, bàn phím, tai nghe, webcam, v.v.',
    },
    {
      code: 'FPT_NETWORKING',
      name: 'Thiết bị mạng',
      description: 'Router, modem, switch, access point',
    },
    {
      code: 'FPT_STORAGE',
      name: 'Thiết bị lưu trữ',
      description: 'Ổ SSD, HDD, USB, thẻ nhớ, v.v.',
    },
    {
      code: 'FPT_CAMERA',
      name: 'Camera & Thiết bị giám sát',
      description: 'Camera an ninh, webcam, camera hành động',
    },
    {
      code: 'FPT_AUDIO',
      name: 'Thiết bị âm thanh',
      description: 'Loa, tai nghe, micro, bộ âm thanh',
    },
    {
      code: 'FPT_GAMING',
      name: 'Thiết bị gaming',
      description: 'Bàn phím gaming, chuột gaming, headset gaming',
    },
    {
      code: 'FPT_PRINTER',
      name: 'Máy in và thiết bị văn phòng',
      description: 'Máy in, máy photocopy, máy scan',
    },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    let existingCat = await prisma.productCategory.findFirst({
      where: { code: cat.code },
    });

    if (!existingCat) {
      existingCat = await prisma.productCategory.create({
        data: {
          orgId: org.id,
          code: cat.code,
          name: cat.name,
          description: cat.description,
        },
      });
    }
    categoryMap[cat.code] = existingCat.id;
  }

  console.log('✅ Product categories created.');

  // 3. Create Products for FPT Shop
  const products = [
    // Máy tính & Laptop (LAPTOPS & COMPUTERS)
    {
      name: 'Laptop ASUS Vivobook 14 (Intel i5, 8GB RAM, 512GB SSD)',
      categoryCode: 'FPT_LAPTOP',
      sku: 'FPT-SHIP-LPT-001',
      price: 12500000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Laptop siêu nhẹ với bàn phím chiclet thoải mái',
    },
    {
      name: 'Laptop Dell XPS 13 (Intel i7, 16GB RAM, 1TB SSD)',
      categoryCode: 'FPT_LAPTOP',
      sku: 'FPT-SHIP-LPT-002',
      price: 28500000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Laptop cao cấp với màn hình InfinityEdge',
    },
    {
      name: 'Laptop HP Pavilion 15 (AMD Ryzen 5, 8GB RAM, 256GB SSD)',
      categoryCode: 'FPT_LAPTOP',
      sku: 'FPT-SHIP-LPT-003',
      price: 11800000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Laptop giá rẻ phù hợp cho công việc hàng ngày',
    },
    {
      name: 'Laptop Gaming ASUS ROG G15 (RTX 3080, i9, 32GB RAM)',
      categoryCode: 'FPT_LAPTOP',
      sku: 'FPT-SHIP-LPT-004',
      price: 45000000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Laptop gaming cao cấp với hiệu năng khủng',
    },
    {
      name: 'Desktop PC LENOVO IdeaCentre (i7, 16GB, 512GB SSD)',
      categoryCode: 'FPT_LAPTOP',
      sku: 'FPT-SHIP-DSK-001',
      price: 18500000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Máy tính để bàn cho văn phòng và thiết kế',
    },

    // Điện thoại thông minh (SMARTPHONES)
    {
      name: 'iPhone 15 Pro Max (256GB) - Đen Titan',
      categoryCode: 'FPT_SMARTPHONE',
      sku: 'FPT-SHIP-IPH-001',
      price: 29800000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Điện thoại flagship từ Apple với camera 48MP',
    },
    {
      name: 'Samsung Galaxy S24 Ultra (256GB) - Xám',
      categoryCode: 'FPT_SMARTPHONE',
      sku: 'FPT-SHIP-SGH-001',
      price: 26500000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Điện thoại cao cấp với đó S Pen và màn hình AMOLED',
    },
    {
      name: 'Google Pixel 8 (128GB) - Obsidian',
      categoryCode: 'FPT_SMARTPHONE',
      sku: 'FPT-SHIP-GGL-001',
      price: 18900000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Điện thoại với AI xử lý ảnh tốt nhất hiện nay',
    },
    {
      name: 'Xiaomi 14 Ultra (512GB) - Bạc',
      categoryCode: 'FPT_SMARTPHONE',
      sku: 'FPT-SHIP-XMI-001',
      price: 22000000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Smartphone flagship Xiaomi với Snapdragon 8 Gen 3',
    },
    {
      name: 'iPhone 15 (128GB) - Hồng',
      categoryCode: 'FPT_SMARTPHONE',
      sku: 'FPT-SHIP-IPH-002',
      price: 19300000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'iPhone phổ thông với A17 Pro chip',
    },

    // Tablet & Accessories
    {
      name: 'iPad Pro 12.9" (128GB, WiFi) - Silver',
      categoryCode: 'FPT_TABLET',
      sku: 'FPT-SHIP-PAD-001',
      price: 18500000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Máy tính bảng cao cấp từ Apple với Apple Pencil',
    },
    {
      name: 'Samsung Galaxy Tab S10 Ultra (256GB)',
      categoryCode: 'FPT_TABLET',
      sku: 'FPT-SHIP-PAD-002',
      price: 15800000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Tablet Samsung với màn hình AMOLED 14.6 inch',
    },
    {
      name: 'iPad Air (64GB, WiFi)',
      categoryCode: 'FPT_TABLET',
      sku: 'FPT-SHIP-PAD-003',
      price: 11200000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'iPad tầm trung với hiệu năng ổn định',
    },

    // Ngoại vi máy tính (PERIPHERALS)
    {
      name: 'Chuột gaming Logitech G Pro X (16K DPI)',
      categoryCode: 'FPT_PERIPHERALS',
      sku: 'FPT-SHIP-MOU-001',
      price: 1850000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Chuột gaming chuyên nghiệp cho e-sports',
    },
    {
      name: 'Bàn phím cơ Corsair K95 RGB Platinum',
      categoryCode: 'FPT_PERIPHERALS',
      sku: 'FPT-SHIP-KBD-001',
      price: 4200000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Bàn phím cơ gaming cao cấp với RGB lighting',
    },
    {
      name: 'Tai nghe Sony WH-1000XM5',
      categoryCode: 'FPT_PERIPHERALS',
      sku: 'FPT-SHIP-HDH-001',
      price: 7850000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Tai nghe chống ồn tốt nhất với noise canceling',
    },
    {
      name: 'Webcam Logitech C920 Full HD',
      categoryCode: 'FPT_PERIPHERALS',
      sku: 'FPT-SHIP-WBC-001',
      price: 1450000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Webcam Full HD cho live stream và họp trực tuyến',
    },
    {
      name: 'Monitor Dell UltraSharp U2723DE (27 inch, 4K)',
      categoryCode: 'FPT_PERIPHERALS',
      sku: 'FPT-SHIP-MON-001',
      price: 8500000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Màn hình 4K cho chuyên viên thiết kế',
    },

    // Thiết bị mạng (NETWORKING)
    {
      name: 'Router WiFi 6 ASUS RT-AX88U Pro (Dual-band)',
      categoryCode: 'FPT_NETWORKING',
      sku: 'FPT-SHIP-RTR-001',
      price: 4500000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Router WiFi 6 cho phủ sóng rộng',
    },
    {
      name: 'Modem DOCSIS 3.1 ARRIS SB8200',
      categoryCode: 'FPT_NETWORKING',
      sku: 'FPT-SHIP-MDM-001',
      price: 2800000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Modem cáp tốc độ cao cho internet',
    },
    {
      name: 'Switch Cisco SG250-26P (26 Port Gigabit)',
      categoryCode: 'FPT_NETWORKING',
      sku: 'FPT-SHIP-SWT-001',
      price: 3200000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Switch mạng chuyên nghiệp cho doanh nghiệp',
    },

    // Thiết bị lưu trữ (STORAGE)
    {
      name: 'SSD Samsung 990 Pro NVMe 2TB',
      categoryCode: 'FPT_STORAGE',
      sku: 'FPT-SHIP-SSD-001',
      price: 2450000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Ổ SSD NVMe tốc độ cao PCIe 4.0',
    },
    {
      name: 'HDD Seagate Barracuda Pro 4TB',
      categoryCode: 'FPT_STORAGE',
      sku: 'FPT-SHIP-HDD-001',
      price: 1850000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Ổ cứng lớn cho lưu trữ dài hạn',
    },
    {
      name: 'USB Flash Drive SanDisk Extreme 256GB',
      categoryCode: 'FPT_STORAGE',
      sku: 'FPT-SHIP-USB-001',
      price: 650000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'USB 3.1 tốc độ cao cho di chuyển file',
    },
    {
      name: 'Thẻ nhớ SanDisk Extreme microSD 128GB',
      categoryCode: 'FPT_STORAGE',
      sku: 'FPT-SHIP-MSD-001',
      price: 320000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Thẻ nhớ 128GB cho điện thoại và máy ảnh',
    },

    // Camera & Thiết bị giám sát (CAMERA)
    {
      name: 'Camera an ninh Hikvision Full HD 2MP',
      categoryCode: 'FPT_CAMERA',
      sku: 'FPT-SHIP-CAM-001',
      price: 1250000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Camera giám sát 24/7 với đêm hồng ngoài',
    },
    {
      name: 'GoPro Hero 11 Black',
      categoryCode: 'FPT_CAMERA',
      sku: 'FPT-SHIP-GOP-001',
      price: 8200000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Camera hành động 4K 60fps chống nước',
    },
    {
      name: 'Webcam logitech 4K Ultra HD',
      categoryCode: 'FPT_CAMERA',
      sku: 'FPT-SHIP-WBC-002',
      price: 4200000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Webcam 4K cho streaming chuyên nghiệp',
    },

    // Thiết bị âm thanh (AUDIO)
    {
      name: 'Loa JBL Boombox 3 (Bluetooth)',
      categoryCode: 'FPT_AUDIO',
      sku: 'FPT-SHIP-SPN-001',
      price: 2850000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Loa Bluetooth di động chống nước IPX7',
    },
    {
      name: 'Âm thanh Bose QuietComfort 45',
      categoryCode: 'FPT_AUDIO',
      sku: 'FPT-SHIP-HAS-001',
      price: 5200000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Tai nghe không dây chống ồn Bose',
    },
    {
      name: 'Microphone Rode Wireless GO II',
      categoryCode: 'FPT_AUDIO',
      sku: 'FPT-SHIP-MIC-001',
      price: 3850000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Micro không dây cho vlogging chuyên nghiệp',
    },

    // Thiết bị gaming (GAMING)
    {
      name: 'Bàn phím cơ gaming Razer Huntsman V3 Pro',
      categoryCode: 'FPT_GAMING',
      sku: 'FPT-SHIP-GKB-001',
      price: 3500000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Bàn phím gaming với switch quang tốc độ cao',
    },
    {
      name: 'Chuột gaming SteelSeries Rival 5',
      categoryCode: 'FPT_GAMING',
      sku: 'FPT-SHIP-GMM-001',
      price: 1280000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Chuột gaming thiết kế ergonomic',
    },
    {
      name: 'Headset gaming HyperX Cloud ProFlight 2',
      categoryCode: 'FPT_GAMING',
      sku: 'FPT-SHIP-GHD-001',
      price: 2100000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Headset gaming wireless cho console và PC',
    },

    // Máy in và thiết bị văn phòng (PRINTER)
    {
      name: 'Máy in Epson EcoTank L8160 (All-in-One)',
      categoryCode: 'FPT_PRINTER',
      sku: 'FPT-SHIP-PRT-001',
      price: 8500000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Máy in đa năng bình mực lớn tiết kiệm',
    },
    {
      name: 'Máy photocopy Canon imageRUNNER 2520',
      categoryCode: 'FPT_PRINTER',
      sku: 'FPT-SHIP-CPY-001',
      price: 35000000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Máy photocopy đen trắng cho doanh nghiệp',
    },
    {
      name: 'Scanner Fujitsu fi-8290 (A4)',
      categoryCode: 'FPT_PRINTER',
      sku: 'FPT-SHIP-SCN-001',
      price: 14500000,
      unit: 'CÁI',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Máy scan chuyên dụng cho văn phòng',
    },
  ];

  // Track products for supplier price setup
  const productMap: Array<{
    sku: string;
    id: string;
    price: number;
    categoryCode: string;
  }> = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];

    const existingProduct = await prisma.product.findFirst({
      where: { sku: p.sku },
    });

    if (!existingProduct) {
      const createdProduct = await prisma.product.create({
        data: {
          orgId: org.id,
          categoryId: categoryMap[p.categoryCode],
          sku: p.sku,
          name: p.name,
          description: p.description,
          unit: p.unit,
          unitPriceRef: p.price,
          currency: p.currency,
          type: p.type,
          lastPriceAt: p.type === ProductType.CATALOG ? new Date() : null,
        },
      });
      productMap.push({
        sku: p.sku,
        id: createdProduct.id,
        price: p.price,
        categoryCode: p.categoryCode,
      });
      console.log(`  ✓ Created product: ${p.name}`);
    } else {
      productMap.push({
        sku: existingProduct.sku || p.sku,
        id: existingProduct.id,
        price: existingProduct.unitPriceRef
          ? Number(existingProduct.unitPriceRef)
          : p.price,
        categoryCode: p.categoryCode,
      });
    }
  }

  console.log(
    `\n✅ Total ${products.length} products created/found for FPT Shop!`,
  );

  // 4. Create SupplierCategory - link FPT Shop to all categories
  console.log('\n📂 Creating Supplier Categories...');
  for (const [catCode, catId] of Object.entries(categoryMap)) {
    const existingSupplierCat = await prisma.supplierCategory.findFirst({
      where: {
        supplierId: org.id,
        categoryId: catId,
      },
    });

    if (!existingSupplierCat) {
      const isPrimary = catCode === 'FPT_LAPTOP'; // Set first category as primary
      await prisma.supplierCategory.create({
        data: {
          supplierId: org.id,
          categoryId: catId,
          isPrimary,
        },
      });
      console.log(`  ✓ Linked supplier to category: ${catCode}`);
    }
  }

  // 5. Create SupplierProductPrice - pricing for each product
  console.log('\n💰 Creating Supplier Product Prices...');
  const today = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  for (const pm of productMap) {
    const existingPrice = await prisma.supplierProductPrice.findFirst({
      where: {
        supplierId: org.id,
        productId: pm.id,
        effectiveFrom: {
          lte: today,
        },
        effectiveUntil: {
          gte: today,
        },
      },
    });

    if (!existingPrice) {
      await prisma.supplierProductPrice.create({
        data: {
          supplierId: org.id,
          productId: pm.id,
          unitPrice: pm.price,
          currency: CurrencyCode.VND,
          minQty: null, // No minimum quantity
          effectiveFrom: today,
          effectiveUntil: nextYear,
          isActive: true,
        },
      });
      console.log(`  ✓ Created price for product: ${pm.sku}`);
    }
  }

  console.log(
    `\n✅ SupplierCategory and SupplierProductPrice records created!`,
  );
  console.log('✅ Seed completed successfully for FPT Shop organization!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
