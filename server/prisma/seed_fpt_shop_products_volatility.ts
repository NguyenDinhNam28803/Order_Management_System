import { PrismaClient, PriceVolatility } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedFPTShopProductsWithVolatility() {
  console.log(
    '🔄 Bắt đầu seeding sản phẩm FPT Shop với các loại price volatility...',
  );

  try {
    // 1️⃣ Lấy FPT Shop organization
    const fptShop = await prisma.organization.findFirst({
      where: {
        code: 'FPT_SHOP',
      },
    });

    if (!fptShop) {
      throw new Error(
        '❌ FPT Shop organization không tìm thấy. Vui lòng chạy seed_fpt_shop.ts trước',
      );
    }

    console.log(`✅ Tìm thấy FPT Shop: ${fptShop.id}`);

    // 2️⃣ Lấy các categories của FPT Shop
    const categories = await prisma.productCategory.findMany({
      where: {
        orgId: fptShop.id,
      },
    });

    if (categories.length === 0) {
      throw new Error(
        '❌ Không tìm thấy categories cho FPT Shop. Vui lòng chạy seed_fpt_shop.ts trước',
      );
    }

    console.log(`✅ Tìm thấy ${categories.length} categories`);

    // 3️⃣ STABLE Products (Giá ổn định) - Tạo ngay PO
    const stableProducts = [
      {
        code: 'DELL-LAPTOP-001',
        name: 'Dell XPS 13 (2024) - Giá ổn định',
        categoryCode: 'FPT_LAPTOP',
        basePrice: 35_000_000, // 35M VND
        volatility: PriceVolatility.STABLE,
        requiresQuoteFirst: false,
        description:
          'Laptop cao cấp giá ổn định. Có thể tạo PO trực tiếp mà không cần báo giá',
      },
      {
        code: 'HP-LAPTOP-002',
        name: 'HP Pavilion 14 (2024) - Giá ổn định',
        categoryCode: 'FPT_LAPTOP',
        basePrice: 18_000_000, // 18M VND
        volatility: PriceVolatility.STABLE,
        requiresQuoteFirst: false,
        description:
          'Laptop mid-range giá ổn định. Phù hợp cho công nhân văn phòng',
      },
      {
        code: 'ASUS-MONITOR-001',
        name: 'ASUS PA247CV 24" Professional Monitor - Giá ổn định',
        categoryCode: 'FPT_PERIPHERALS',
        basePrice: 8_500_000, // 8.5M VND
        volatility: PriceVolatility.STABLE,
        requiresQuoteFirst: false,
        description:
          'Màn hình chuyên nghiệp từ ASUS. Giá ổn định, mua ngay được',
      },
      {
        code: 'SAMSUNG-SSD-001',
        name: 'Samsung 870 EVO 1TB SSD - Giá ổn định',
        categoryCode: 'FPT_STORAGE',
        basePrice: 2_800_000, // 2.8M VND
        volatility: PriceVolatility.STABLE,
        requiresQuoteFirst: false,
        description: 'Ổ SSD 1TB chất lượng cao. Giá ổn định, có sẵn hàng',
      },
      {
        code: 'LOGITECH-MOUSE-001',
        name: 'Logitech MX Master 3S - Giá ổn định',
        categoryCode: 'FPT_PERIPHERALS',
        basePrice: 3_200_000, // 3.2M VND
        volatility: PriceVolatility.STABLE,
        requiresQuoteFirst: false,
        description: 'Chuột cao cấp cho design. Giá ổn định năm này',
      },
    ];

    // 4️⃣ MODERATE Products (Giá trung bình) - Có thể cần báo giá
    const moderateProducts = [
      {
        code: 'APPLE-IPHONE-001',
        name: 'iPhone 16 Pro Max - Giá trung bình',
        categoryCode: 'FPT_SMARTPHONE',
        basePrice: 42_000_000, // 42M VND
        volatility: PriceVolatility.MODERATE,
        requiresQuoteFirst: true,
        description:
          'Điện thoại flagship Apple. Giá thường biến động. Nên báo giá trước',
      },
      {
        code: 'SAMSUNG-TAB-001',
        name: 'Samsung Galaxy Tab S10 Ultra - Giá trung bình',
        categoryCode: 'FPT_TABLET',
        basePrice: 28_000_000, // 28M VND
        volatility: PriceVolatility.MODERATE,
        requiresQuoteFirst: true,
        description:
          'Tablet cao cấp từ Samsung. Áp dụng chính sách báo giá động',
      },
      {
        code: 'NVIDIA-GPU-001',
        name: 'NVIDIA GeForce RTX 4090 - Giá trung bình',
        categoryCode: 'FPT_GAMING',
        basePrice: 85_000_000, // 85M VND
        volatility: PriceVolatility.MODERATE,
        requiresQuoteFirst: true,
        description:
          'GPU gaming cao cấp. Giá biến động. Cần báo giá trước khi đặt',
      },
      {
        code: 'SONY-CAMERA-001',
        name: 'Sony A6700 Mirrorless Camera - Giá trung bình',
        categoryCode: 'FPT_CAMERA',
        basePrice: 32_000_000, // 32M VND
        volatility: PriceVolatility.MODERATE,
        requiresQuoteFirst: true,
        description:
          'Camera mirrorless chuyên nghiệp. Giá thường biến động theo thị trường',
      },
      {
        code: 'DJI-DRONE-001',
        name: 'DJI Air 3S - Giá trung bình',
        categoryCode: 'FPT_PERIPHERALS',
        basePrice: 22_000_000, // 22M VND
        volatility: PriceVolatility.MODERATE,
        requiresQuoteFirst: true,
        description:
          'Drone chuyên nghiệp DJI. Giá dao động theo mùa và hàng tồn kho',
      },
    ];

    // 5️⃣ VOLATILE Products (Giá biến động mạnh) - Bắt buộc báo giá
    const volatileProducts = [
      {
        code: 'INTEL-CPU-I9-001',
        name: 'Intel Core i9-14900K - Giá biến động mạnh',
        categoryCode: 'FPT_LAPTOP',
        basePrice: 18_500_000, // 18.5M VND (CPU)
        volatility: PriceVolatility.VOLATILE,
        requiresQuoteFirst: true,
        description:
          'CPU flagship Intel. Giá biến động mạnh. BẮTBUỘC báo giá trước khi đặt hàng',
      },
      {
        code: 'ETHEREUM-GPU-001',
        name: 'Nvidia RTX 4080 Super - Giá biến động mạnh',
        categoryCode: 'FPT_GAMING',
        basePrice: 65_000_000, // 65M VND
        volatility: PriceVolatility.VOLATILE,
        requiresQuoteFirst: true,
        description:
          'GPU cao cấp. Giá bị ảnh hưởng bởi thị trường tiền mã hóa. CẦN báo giá',
      },
      {
        code: 'PALLADIUM-HARDWARE-001',
        name: 'Premium Server Hardware Bundle - Giá biến động mạnh',
        categoryCode: 'FPT_NETWORKING',
        basePrice: 150_000_000, // 150M VND
        volatility: PriceVolatility.VOLATILE,
        requiresQuoteFirst: true,
        description:
          'Bundle hardware máy chủ cao cấp. Giá phụ thuộc vào giá nguyên tế. PHẢI báo giá',
      },
      {
        code: 'RARE-METAL-COMPONENT-001',
        name: 'Rare Earth Element Components - Giá biến động mạnh',
        categoryCode: 'FPT_STORAGE',
        basePrice: 45_000_000, // 45M VND
        volatility: PriceVolatility.VOLATILE,
        requiresQuoteFirst: true,
        description:
          'Linh kiện chứa nguyên tố đất hiếm. Giá biến động theo thị trường quốc tế',
      },
      {
        code: 'QUANTUM-COMPONENT-001',
        name: 'Advanced Processing Components - Giá biến động mạnh',
        categoryCode: 'FPT_AUDIO',
        basePrice: 120_000_000, // 120M VND
        volatility: PriceVolatility.VOLATILE,
        requiresQuoteFirst: true,
        description:
          'Linh kiện xử lý tiên tiến. Giá cực biến động. PHẢI lấy báo giá trước',
      },
    ];

    // 6️⃣ Combine all products
    const allProducts = [
      ...stableProducts,
      ...moderateProducts,
      ...volatileProducts,
    ];

    console.log(
      `\n📦 Đang tạo ${allProducts.length} sản phẩm (${stableProducts.length} STABLE + ${moderateProducts.length} MODERATE + ${volatileProducts.length} VOLATILE)...\n`,
    );

    let createdCount = 0;
    let skippedCount = 0;

    for (const productData of allProducts) {
      // Tìm category
      const category = categories.find(
        (c) => c.code === productData.categoryCode,
      );
      if (!category) {
        console.warn(
          `⚠️  Skip ${productData.code}: Không tìm thấy category ${productData.categoryCode}`,
        );
        skippedCount++;
        continue;
      }

      // Kiểm tra sản phẩm đã tồn tại chưa
      const existingProduct = await prisma.product.findFirst({
        where: {
          sku: productData.code,
          orgId: fptShop.id,
        },
      });

      if (existingProduct) {
        console.log(`⏭️  Bỏ qua ${productData.code}: Đã tồn tại`);
        skippedCount++;
        continue;
      }

      // Tạo sản phẩm
      const product = await prisma.product.create({
        data: {
          sku: productData.code,
          name: productData.name,
          description: productData.description,
          orgId: fptShop.id,
          categoryId: category.id,
          priceVolatility: productData.volatility,
          requiresQuoteFirst: productData.requiresQuoteFirst,
        },
      });

      // Tạo supplier product price
      const effectiveFromDate = new Date();
      effectiveFromDate.setHours(0, 0, 0, 0);

      await prisma.supplierProductPrice.upsert({
        where: {
          supplierId_productId_effectiveFrom: {
            supplierId: fptShop.id,
            productId: product.id,
            effectiveFrom: effectiveFromDate,
          },
        },
        create: {
          supplierId: fptShop.id,
          productId: product.id,
          unitPrice: productData.basePrice,
          currency: 'VND',
          effectiveFrom: effectiveFromDate,
          effectiveUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        update: {
          unitPrice: productData.basePrice,
          effectiveUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      const volatilityLabel = {
        [PriceVolatility.STABLE]: '🟢 STABLE',
        [PriceVolatility.MODERATE]: '🟡 MODERATE',
        [PriceVolatility.VOLATILE]: '🔴 VOLATILE',
      };

      const quoteLabel = productData.requiresQuoteFirst
        ? '(Cần báo giá)'
        : '(Tạo PO trực tiếp)';

      console.log(
        `✅ ${volatilityLabel[productData.volatility]} ${productData.code}: ${productData.name} ${quoteLabel}`,
      );
      createdCount++;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Kết quả:`);
    console.log(`   ✅ Tạo thành công: ${createdCount} sản phẩm`);
    console.log(`   ⏭️  Bỏ qua: ${skippedCount} sản phẩm`);
    console.log(`   📦 Tổng cộng: ${allProducts.length} sản phẩm`);
    console.log(`${'='.repeat(60)}\n`);

    // 7️⃣ Hiển thị thống kê
    const productsByVolatility = await prisma.product.groupBy({
      by: ['priceVolatility'],
      where: { orgId: fptShop.id },
      _count: true,
    });

    console.log(`📈 Thống kê Volatility cho FPT Shop:`);
    for (const stat of productsByVolatility) {
      const label = {
        [PriceVolatility.STABLE]: '🟢 STABLE (Giá ổn định)',
        [PriceVolatility.MODERATE]: '🟡 MODERATE (Giá trung bình)',
        [PriceVolatility.VOLATILE]: '🔴 VOLATILE (Giá biến động mạnh)',
      };
      console.log(`   ${label[stat.priceVolatility]}: ${stat._count} sản phẩm`);
    }

    // 8️⃣ Hiển thị quoteFirst statistics
    const quoteFirstStats = await prisma.product.groupBy({
      by: ['requiresQuoteFirst'],
      where: { orgId: fptShop.id },
      _count: true,
    });

    console.log(`\n🎫 Thống kê QuoteFirst cho FPT Shop:`);
    for (const stat of quoteFirstStats) {
      const label = stat.requiresQuoteFirst
        ? '🎫 Cần báo giá'
        : '⚡ Không cần báo giá';
      console.log(`   ${label}: ${stat._count} sản phẩm`);
    }

    console.log(
      `\n✨ Seed hoàn tất! Tất cả dữ liệu đã được thêm vào database\n`,
    );
  } catch (error) {
    console.error('❌ Lỗi khi seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy seed
seedFPTShopProductsWithVolatility()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
