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
    '🚀 Seeding FPT Software organization with products and categories...',
  );

  // 1. Create FPT Software Organization (SUPPLIER)
  const org = await prisma.organization.upsert({
    where: { code: 'FPT_SOFT' },
    update: {},
    create: {
      code: 'FPT_SOFT',
      name: 'FPT Software',
      legalName: 'FPT Software Co., Ltd',
      taxCode: '0905234567',
      companyType: CompanyType.SUPPLIER,
      industry: 'Information Technology & Software Development',
      countryCode: 'VN',
      province: 'Ha Noi',
      address: '9th Floor, Capital Place, 34 Lieu Giai, Ba Dinh, Ha Noi',
      phone: '+84-24-7301-3939',
      email: 'contact@fpt-software.com',
      website: 'https://www.fpt-software.com',
      isActive: true,
      kycStatus: KycStatus.APPROVED,
      supplierTier: SupplierTier.APPROVED,
      trustScore: 95,
    },
  });

  console.log(`✅ Organization created: ${org.name} (ID: ${org.id})`);

  // 2. Create Product Categories for FPT Software
  const categories = [
    {
      code: 'FPT_SW_LICENSE',
      name: 'Giấy phép phần mềm',
      description: 'Giấy phép sử dụng phần mềm từ FPT Software và các đối tác',
    },
    {
      code: 'FPT_DEV_SERVICE',
      name: 'Dịch vụ phát triển phần mềm',
      description: 'Dịch vụ tư vấn và phát triển giải pháp phần mềm tùy chỉnh',
    },
    {
      code: 'FPT_TECH_SERVICE',
      name: 'Dịch vụ hỗ trợ kỹ thuật',
      description: 'Dịch vụ bảo trì, hỗ trợ và nâng cấp hệ thống',
    },
    {
      code: 'FPT_TRAINING',
      name: 'Dịch vụ đào tạo',
      description: 'Khóa đào tạo chuyên nghiệp cho nhân sự',
    },
    {
      code: 'FPT_CONSULTING',
      name: 'Dịch vụ tư vấn',
      description: 'Tư vấn chiến lược số hóa và công nghệ thông tin',
    },
    {
      code: 'FPT_CLOUD',
      name: 'Dịch vụ điện toán đám mây',
      description: 'Dịch vụ hosting, server và cơ sở dữ liệu',
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

  // 3. Create Products for FPT Software
  const products = [
    // Giấy phép phần mềm (SOFTWARE LICENSES)
    {
      name: 'Microsoft Office 365 - 1 năm (5 User)',
      categoryCode: 'FPT_SW_LICENSE',
      sku: 'FPT-OFF365-001',
      price: 4500000,
      unit: 'GIAC_PHE_P',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description:
        'Giấy phép sử dụng Microsoft Office 365 cho 5 người trong 1 năm',
    },
    {
      name: 'Adobe Creative Cloud - 1 năm (10 User)',
      categoryCode: 'FPT_SW_LICENSE',
      sku: 'FPT-ADO-CCL-001',
      price: 12500000,
      unit: 'GIAC_PHE_P',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Giấy phép Adobe Creative Cloud cho 10 người trong 1 năm',
    },
    {
      name: 'Atlassian Jira - 1 năm (100 User)',
      categoryCode: 'FPT_SW_LICENSE',
      sku: 'FPT-JIRA-001',
      price: 8900000,
      unit: 'GIAC_PHE_P',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Giấy phép Jira cho quản lý dự án, 100 người dùng',
    },
    {
      name: 'GitHub Enterprise - 1 năm (50 User)',
      categoryCode: 'FPT_SW_LICENSE',
      sku: 'FPT-GHE-001',
      price: 7200000,
      unit: 'GIAC_PHE_P',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Giấy phép GitHub Enterprise cho 50 developer',
    },
    {
      name: 'JetBrains IDE Bundle - 1 năm (20 User)',
      categoryCode: 'FPT_SW_LICENSE',
      sku: 'FPT-JETS-001',
      price: 3800000,
      unit: 'GIAC_PHE_P',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Bộ IDE JetBrains (IntelliJ, PyCharm, WebStorm, v.v.)',
    },
    {
      name: 'Oracle Database License - 1 năm',
      categoryCode: 'FPT_SW_LICENSE',
      sku: 'FPT-ORA-001',
      price: 15000000,
      unit: 'GIAC_PHE_P',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Giấy phép sử dụng Oracle Database Server Standard Edition',
    },
    {
      name: 'Slack Enterprise Grid - 1 năm (500 User)',
      categoryCode: 'FPT_SW_LICENSE',
      sku: 'FPT-SLACK-001',
      price: 6800000,
      unit: 'GIAC_PHE_P',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Giấy phép Slack cho khoảng 500 người dùng',
    },
    {
      name: 'Figma Professional - 1 năm (20 Seat)',
      categoryCode: 'FPT_SW_LICENSE',
      sku: 'FPT-FIGMA-001',
      price: 2400000,
      unit: 'GIAC_PHE_P',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Giấy phép Figma cho thiết kế UI/UX, 20 ghế làm việc',
    },

    // Dịch vụ phát triển phần mềm (DEVELOPMENT SERVICES)
    {
      name: 'Phát triển Ứng dụng Web (Frontend + Backend) - 100 công nhân/ngày',
      categoryCode: 'FPT_DEV_SERVICE',
      sku: 'FPT-DEV-WEB-001',
      price: 250000000,
      unit: 'CONG_NHAN_NGAY',
      currency: CurrencyCode.VND,
      type: ProductType.NON_CATALOG,
      description:
        'Dịch vụ phát triển ứng dụng web toàn diện (React/Vue/Angular + Node/Java/Python)',
    },
    {
      name: 'Phát triển Ứng dụng Mobile (iOS + Android) - 80 công nhân/ngày',
      categoryCode: 'FPT_DEV_SERVICE',
      sku: 'FPT-DEV-MOB-001',
      price: 200000000,
      unit: 'CONG_NHAN_NGAY',
      currency: CurrencyCode.VND,
      type: ProductType.NON_CATALOG,
      description:
        'Dịch vụ phát triển ứng dụng mobile native hoặc cross-platform',
    },
    {
      name: 'Phát triển Hệ thống Backend - 120 công nhân/ngày',
      categoryCode: 'FPT_DEV_SERVICE',
      sku: 'FPT-DEV-BACK-001',
      price: 300000000,
      unit: 'CONG_NHAN_NGAY',
      currency: CurrencyCode.VND,
      type: ProductType.NON_CATALOG,
      description:
        'Dịch vụ phát triển hệ thống backend scalable với microservices',
    },
    {
      name: 'Phát triển AI/Machine Learning - 150 công nhân/ngày',
      categoryCode: 'FPT_DEV_SERVICE',
      sku: 'FPT-DEV-AI-001',
      price: 375000000,
      unit: 'CONG_NHAN_NGAY',
      currency: CurrencyCode.VND,
      type: ProductType.NON_CATALOG,
      description:
        'Dịch vụ phát triển giải pháp AI, Machine Learning, Data Analytics',
    },
    {
      name: 'Phát triển Blockchain/Web3 - 160 công nhân/ngày',
      categoryCode: 'FPT_DEV_SERVICE',
      sku: 'FPT-DEV-BC-001',
      price: 400000000,
      unit: 'CONG_NHAN_NGAY',
      currency: CurrencyCode.VND,
      type: ProductType.NON_CATALOG,
      description:
        'Dịch vụ phát triển giải pháp Blockchain, Smart Contracts, DeFi',
    },

    // Dịch vụ hỗ trợ kỹ thuật (TECHNICAL SUPPORT SERVICES)
    {
      name: 'Bảo trì & Hỗ trợ Hệ thống - 1 năm (Gói cơ bản)',
      categoryCode: 'FPT_TECH_SERVICE',
      sku: 'FPT-SUPP-BASIC-001',
      price: 45000000,
      unit: 'GOI_HANG_NAM',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Hỗ trợ kỹ thuật cơ bản 24/5, giờ hành chính',
    },
    {
      name: 'Bảo trì & Hỗ trợ Hệ thống - 1 năm (Gói Premium)',
      categoryCode: 'FPT_TECH_SERVICE',
      sku: 'FPT-SUPP-PREM-001',
      price: 95000000,
      unit: 'GOI_HANG_NAM',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Hỗ trợ kỹ thuật cao cấp 24/7 với SLA cao',
    },
    {
      name: 'Nâng cấp & Tối ưu hóa Hệ thống - 60 công nhân/ngày',
      categoryCode: 'FPT_TECH_SERVICE',
      sku: 'FPT-UP-OPT-001',
      price: 150000000,
      unit: 'CONG_NHAN_NGAY',
      currency: CurrencyCode.VND,
      type: ProductType.NON_CATALOG,
      description: 'Dịch vụ nâng cấp hiệu năng, bảo mật, khả năng mở rộng',
    },
    {
      name: 'Quản lý cơ sở hạ tầng IT (IaaS) - 1 năm',
      categoryCode: 'FPT_TECH_SERVICE',
      sku: 'FPT-IAAS-001',
      price: 200000000,
      unit: 'GOI_HANG_NAM',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Quản lý toàn bộ cơ sở hạ tầng server, network, storage',
    },

    // Dịch vụ đào tạo (TRAINING SERVICES)
    {
      name: 'Đào tạo lập trình Web (5 ngày, 20 người)',
      categoryCode: 'FPT_TRAINING',
      sku: 'FPT-TRAIN-WEB-001',
      price: 35000000,
      unit: 'KHOA_DAO_TAO',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description:
        'Khóa đào tạo lập trình web từ cơ bản tới nâng cao cho 20 người trong 5 ngày',
    },
    {
      name: 'Đào tạo DevOps & Cloud (3 ngày, 15 người)',
      categoryCode: 'FPT_TRAINING',
      sku: 'FPT-TRAIN-DEVOPS-001',
      price: 28000000,
      unit: 'KHOA_DAO_TAO',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Khóa đào tạo DevOps, CI/CD, Docker, Kubernetes',
    },
    {
      name: 'Đào tạo UI/UX Design (4 ngày, 15 người)',
      categoryCode: 'FPT_TRAINING',
      sku: 'FPT-TRAIN-DESIGN-001',
      price: 30000000,
      unit: 'KHOA_DAO_TAO',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Khóa đào tạo thiết kế giao diện người dùng chuyên nghiệp',
    },
    {
      name: 'Đào tạo Project Management (Agile/Scrum) - 3 ngày, 20 người',
      categoryCode: 'FPT_TRAINING',
      sku: 'FPT-TRAIN-PM-001',
      price: 25000000,
      unit: 'KHOA_DAO_TAO',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Khóa đào tạo Agile, Scrum, và quản lý dự án hiện đại',
    },

    // Dịch vụ tư vấn (CONSULTING SERVICES)
    {
      name: 'Tư vấn Chiến lược Số hóa - 50 công nhân/ngày',
      categoryCode: 'FPT_CONSULTING',
      sku: 'FPT-CONS-DX-001',
      price: 125000000,
      unit: 'CONG_NHAN_NGAY',
      currency: CurrencyCode.VND,
      type: ProductType.NON_CATALOG,
      description:
        'Tư vấn chiến lược chuyển đổi số và hiện đại hóa doanh nghiệp',
    },
    {
      name: 'Tư vấn Enterprise Architecture - 60 công nhân/ngày',
      categoryCode: 'FPT_CONSULTING',
      sku: 'FPT-CONS-EA-001',
      price: 150000000,
      unit: 'CONG_NHAN_NGAY',
      currency: CurrencyCode.VND,
      type: ProductType.NON_CATALOG,
      description: 'Tư vấn thiết kế kiến trúc enterprise cho tổ chức lớn',
    },
    {
      name: 'Tư vấn An toàn thông tin - 70 công nhân/ngày',
      categoryCode: 'FPT_CONSULTING',
      sku: 'FPT-CONS-SEC-001',
      price: 175000000,
      unit: 'CONG_NHAN_NGAY',
      currency: CurrencyCode.VND,
      type: ProductType.NON_CATALOG,
      description: 'Tư vấn bảo mật thông tin, compliance và quản lý rủi ro',
    },
    {
      name: 'Tư vấn ERP Implementation - 80 công nhân/ngày',
      categoryCode: 'FPT_CONSULTING',
      sku: 'FPT-CONS-ERP-001',
      price: 200000000,
      unit: 'CONG_NHAN_NGAY',
      currency: CurrencyCode.VND,
      type: ProductType.NON_CATALOG,
      description:
        'Tư vấn triển khai hệ thống ERP (SAP, Oracle, Microsoft Dynamics)',
    },

    // Dịch vụ điện toán đám mây (CLOUD SERVICES)
    {
      name: 'Cloud Server Hosting - 1 năm (2 vCPU, 4GB RAM, 100GB SSD)',
      categoryCode: 'FPT_CLOUD',
      sku: 'FPT-CLOUD-SRV-001',
      price: 8000000,
      unit: 'GOI_HANG_NAM',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Quản lý server ảo trên cloud với cấu hình cơ bản',
    },
    {
      name: 'Cloud Database (PostgreSQL/MySQL) - 1 năm (100GB)',
      categoryCode: 'FPT_CLOUD',
      sku: 'FPT-CLOUD-DB-001',
      price: 5500000,
      unit: 'GOI_HANG_NAM',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Dịch vụ cơ sở dữ liệu được quản lý trên cloud',
    },
    {
      name: 'Cloud CDN & DDoS Protection - 1 năm',
      categoryCode: 'FPT_CLOUD',
      sku: 'FPT-CLOUD-CDN-001',
      price: 6800000,
      unit: 'GOI_HANG_NAM',
      currency: CurrencyCode.VND,
      type: ProductType.CATALOG,
      description: 'Dịch vụ phân phối nội dung toàn cầu và bảo vệ DDoS',
    },
    {
      name: 'Cloud Migration & Setup - 40 công nhân/ngày',
      categoryCode: 'FPT_CLOUD',
      sku: 'FPT-CLOUD-MIG-001',
      price: 100000000,
      unit: 'CONG_NHAN_NGAY',
      currency: CurrencyCode.VND,
      type: ProductType.NON_CATALOG,
      description: 'Dịch vụ di chuyển toàn bộ hạ tầng lên cloud',
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
    `\n✅ Total ${products.length} products created/found for FPT Software!`,
  );

  // 4. Create SupplierCategory - link FPT Software to all categories
  console.log('\n📂 Creating Supplier Categories...');
  for (const [catCode, catId] of Object.entries(categoryMap)) {
    const existingSupplierCat = await prisma.supplierCategory.findFirst({
      where: {
        supplierId: org.id,
        categoryId: catId,
      },
    });

    if (!existingSupplierCat) {
      const isPrimary = catCode === 'FPT_SW_LICENSE'; // Set first category as primary
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
  console.log('✅ Seed completed successfully for FPT Software organization!');
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
