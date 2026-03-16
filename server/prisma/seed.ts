import {
  PrismaClient,
  UserRole,
  KycStatus,
  CompanyType,
  PrStatus,
  CurrencyCode,
  SupplierTier,
} from '@prisma/client';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();
console.log('Database URL:', process.env.DATABASE_URL ? 'FOUND' : 'NOT FOUND');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Start seeding rich test data (including 100+ products)...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Organizations
  const buyerOrg = await prisma.organization.upsert({
    where: { code: 'BUYER_CORP' },
    update: {},
    create: {
      code: 'BUYER_CORP',
      name: 'Global Tech Solutions (Vietnam)',
      legalName: 'GTS Vietnam Co., Ltd',
      taxCode: '0102030405',
      companyType: CompanyType.BUYER,
      industry: 'Software Development',
      countryCode: 'VN',
      isActive: true,
      kycStatus: KycStatus.APPROVED,
    },
  });

  const supplierOrg = await prisma.organization.upsert({
    where: { code: 'SUP_HARDWARE' },
    update: {},
    create: {
      code: 'SUP_HARDWARE',
      name: 'Hanoi Hardware Hub',
      legalName: 'Hanoi Computer Components JSC',
      taxCode: '0908070605',
      companyType: CompanyType.SUPPLIER,
      industry: 'Electronics Distribution',
      countryCode: 'VN',
      isActive: true,
      kycStatus: KycStatus.APPROVED,
      supplierTier: SupplierTier.STRATEGIC,
    },
  });

  // 2. Create Departments
  const itDept = await prisma.department.upsert({
    where: { orgId_code: { orgId: buyerOrg.id, code: 'IT_DEPT' } },
    update: {},
    create: {
      orgId: buyerOrg.id,
      code: 'IT_DEPT',
      name: 'IT Operations',
    },
  });

  const procDept = await prisma.department.upsert({
    where: { orgId_code: { orgId: buyerOrg.id, code: 'PROC_DEPT' } },
    update: {},
    create: {
      orgId: buyerOrg.id,
      code: 'PROC_DEPT',
      name: 'Procurement & Sourcing',
    },
  });

  const financeDept = await prisma.department.upsert({
    where: { orgId_code: { orgId: buyerOrg.id, code: 'FIN_DEPT' } },
    update: {},
    create: {
      orgId: buyerOrg.id,
      code: 'FIN_DEPT',
      name: 'Finance & Accounting',
    },
  });

  // 3. Create Cost Centers
  await prisma.costCenter.upsert({
    where: { orgId_code: { orgId: buyerOrg.id, code: 'CC_IT_OPS' } },
    update: {},
    create: {
      orgId: buyerOrg.id,
      deptId: itDept.id,
      code: 'CC_IT_OPS',
      name: 'IT Infrastructure Budget',
      budgetAnnual: 5000000000,
      currency: CurrencyCode.VND,
    },
  });

  // 4. Create Users
  const buyerUsers = [
    {
      email: 'john.requester@gts.com',
      fullName: 'John Requester',
      role: UserRole.REQUESTER,
      deptId: itDept.id,
    },
    {
      email: 'sarah.approver@gts.com',
      fullName: 'Sarah IT Manager',
      role: UserRole.DEPT_APPROVER,
      deptId: itDept.id,
    },
    {
      email: 'mike.procurement@gts.com',
      fullName: 'Mike Procurement',
      role: UserRole.PROCUREMENT,
      deptId: procDept.id,
    },
    {
      email: 'alice.finance@gts.com',
      fullName: 'Alice Finance',
      role: UserRole.FINANCE,
      deptId: financeDept.id,
    },
    {
      email: 'david.director@gts.com',
      fullName: 'David Director',
      role: UserRole.DIRECTOR,
      deptId: itDept.id,
    },
    {
      email: 'ceo@gts.com',
      fullName: 'Board CEO',
      role: UserRole.CEO,
      deptId: itDept.id,
    },
    {
      email: 'qa@gts.com',
      fullName: 'QA Center',
      role: UserRole.QA,
      deptId: itDept.id,
    },
    {
      email: 'warehouse@gts.com',
      fullName: 'Warehouse Team',
      role: UserRole.WAREHOUSE,
      deptId: itDept.id,
    },
    {
      email: 'admin@gts.com',
      fullName: 'GTS Admin',
      role: UserRole.PLATFORM_ADMIN,
      deptId: itDept.id,
    },
    {
      email: 'system@gts.com',
      fullName: 'System Daemon',
      role: UserRole.SYSTEM,
      deptId: itDept.id,
    },
  ];

  const createdBuyerUsers: any = {};
  for (const u of buyerUsers) {
    createdBuyerUsers[u.role] = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash },
      create: {
        ...u,
        orgId: buyerOrg.id,
        passwordHash,
        isActive: true,
        isVerified: true,
      },
    });
  }

  await prisma.user.upsert({
    where: { email: 'sales@hanoihardware.vn' },
    update: { passwordHash },
    create: {
      email: 'sales@hanoihardware.vn',
      fullName: 'Sales Manager',
      role: UserRole.SUPPLIER,
      orgId: supplierOrg.id,
      passwordHash,
      isActive: true,
      isVerified: true,
    },
  });

  // 5. SEED 100 PRODUCTS ACROSS CATEGORIES
  console.log('📦 Seeding 100 business products...');

  const categoryData = [
    {
      code: 'IT_HW',
      name: 'IT Hardware',
      desc: 'Computers, Servers, and Peripherals',
    },
    {
      code: 'OFF_ST',
      name: 'Office Stationery',
      desc: 'Pens, Paper, and Desktop supplies',
    },
    { code: 'FURN', name: 'Furniture', desc: 'Chairs, Desks, and Cabinets' },
    {
      code: 'SOFT_LIC',
      name: 'Software Licenses',
      desc: 'SaaS, OS, and Enterprise Tools',
    },
    {
      code: 'SAFE_CLEAN',
      name: 'Safety & Cleaning',
      desc: 'Janitorial supplies and PPE',
    },
    {
      code: 'PANTRY',
      name: 'Pantry & Breakroom',
      desc: 'Coffee, Snacks, and Kitchenware',
    },
  ];

  // Clean old data to avoid duplicates/errors
  await prisma.product.deleteMany({});
  await prisma.productCategory.deleteMany({});

  const createdCats: any = {};
  for (const cat of categoryData) {
    const newCat = await prisma.productCategory.create({
      data: { code: cat.code, name: cat.name, description: cat.desc },
    });
    createdCats[cat.code] = newCat;
  }

  const productTemplates = [
    {
      cat: 'IT_HW',
      prefix: 'Laptop',
      models: [
        'Dell Latitude',
        'HP EliteBook',
        'MacBook Pro',
        'Lenovo ThinkPad',
      ],
      price: 25000000,
    },
    {
      cat: 'IT_HW',
      prefix: 'Monitor',
      models: [
        'Dell UltraSharp 27"',
        'LG 32" UHD',
        'Samsung Curved 24"',
        'ViewSonic Pro',
      ],
      price: 8000000,
    },
    {
      cat: 'IT_HW',
      prefix: 'Mouse',
      models: [
        'Logitech MX Master 3',
        'Razer DeathAdder',
        'Microsoft Bluetooth',
      ],
      price: 1500000,
    },
    {
      cat: 'OFF_ST',
      prefix: 'Paper',
      models: ['Double A A4 80gsm', 'IK Plus A4 70gsm', 'PaperOne A3'],
      price: 85000,
    },
    {
      cat: 'OFF_ST',
      prefix: 'Pen',
      models: ['Thiên Long Ballpoint', 'Pentel Gel Pen', 'Uni-ball Signo'],
      price: 12000,
    },
    {
      cat: 'FURN',
      prefix: 'Chair',
      models: ['Ergonomic Pro', 'Leather Executive', 'Mesh Staff Chair'],
      price: 4500000,
    },
    {
      cat: 'FURN',
      prefix: 'Desk',
      models: [
        'L-Shape Corner',
        'Standing Desk Electric',
        'Compact Staff Desk',
      ],
      price: 6000000,
    },
    {
      cat: 'SOFT_LIC',
      prefix: 'Subscription',
      models: [
        'Microsoft 365 Business',
        'Adobe Creative Cloud',
        'Zoom Pro 1-year',
        'Slack Enterprise',
      ],
      price: 3500000,
    },
    {
      cat: 'SAFE_CLEAN',
      prefix: 'Safety',
      models: ['Fire Extinguisher ABC', 'First Aid Kit XL', 'CCTV Camera 4K'],
      price: 1200000,
    },
    {
      cat: 'PANTRY',
      prefix: 'Coffee',
      models: [
        'Trung Nguyen Legend',
        'Starbucks Espresso Roast',
        'G7 Instant 3-in-1',
      ],
      price: 250000,
    },
  ];

  const productsData: any[] = [];
  for (let i = 1; i <= 100; i++) {
    const template = productTemplates[i % productTemplates.length];
    const model =
      template.models[Math.floor(Math.random() * template.models.length)];
    const sku = `${template.cat}-${i.toString().padStart(4, '0')}`;

    productsData.push({
      name: `${template.prefix} - ${model} (${i})`,
      sku: sku,
      description: `High-quality ${template.prefix.toLowerCase()} for enterprise use. Series ${i}.`,
      unitPriceRef: template.price + Math.random() * 500000,
      currency: CurrencyCode.VND,
      unit:
        template.cat === 'OFF_ST' && template.prefix === 'Paper'
          ? 'REAM'
          : 'UNIT',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      categoryId: createdCats[template.cat].id,
      isActive: true,
    });
  }

  await prisma.product.createMany({ data: productsData });

  console.log(`✅ Successfully seeded ${productsData.length} products.`);

  // 6. Workflow Data
  const randomProduct = await prisma.product.findFirst({
    where: { category: { code: 'IT_HW' } },
  });

  await prisma.purchaseRequisition.create({
    data: {
      prNumber: `PR-2026-X${Date.now().toString().slice(-4)}`,
      title: 'Monthly Office Supplies Refill',
      orgId: buyerOrg.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      requesterId: createdBuyerUsers[UserRole.REQUESTER].id,
      deptId: itDept.id,
      status: PrStatus.DRAFT,
      totalEstimate: 15000000,
      items: {
        create: {
          lineNumber: 1,
          productId: randomProduct?.id,
          productDesc: randomProduct?.name || 'Assorted IT Hardware',
          qty: 2,
          unit: 'UNIT',
          estimatedPrice: 7500000,
        },
      },
    },
  });

  // 7. SEED APPROVAL MATRIX RULES
  console.log('⚖️ Seeding Approval Matrix Rules...');

  const approvalRules = [
    // --- RULES FOR PURCHASE REQUISITION (PR) ---
    {
      orgId: buyerOrg.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      documentType: 'PURCHASE_REQUISITION' as any,
      level: 1,
      approverRole: UserRole.DEPT_APPROVER,
      minTotalAmount: 0,
      slaHours: 24,
      autoEscalateHours: 48,
    },
    {
      orgId: buyerOrg.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      documentType: 'PURCHASE_REQUISITION' as any,
      level: 2,
      approverRole: UserRole.DIRECTOR,
      minTotalAmount: 0,
      slaHours: 48,
      autoEscalateHours: 72,
    },

    // --- RULES FOR PURCHASE ORDER (PO) ---
    {
      orgId: buyerOrg.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      documentType: 'PURCHASE_ORDER' as any,
      level: 1,
      approverRole: UserRole.PROCUREMENT,
      minTotalAmount: 0,
      slaHours: 24,
      autoEscalateHours: 48,
    },
    {
      orgId: buyerOrg.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      documentType: 'PURCHASE_ORDER' as any,
      level: 2,
      approverRole: UserRole.FINANCE,
      minTotalAmount: 200000000, // > 200,000,000 VND
      slaHours: 24,
      autoEscalateHours: 48,
    },
    {
      orgId: buyerOrg.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      documentType: 'PURCHASE_ORDER' as any,
      level: 3,
      approverRole: UserRole.CEO,
      minTotalAmount: 1000000000, // > 1,000,000,000 VND
      slaHours: 48,
      autoEscalateHours: 96,
    },
  ];

  // Xóa cũ thêm mới để đảm bảo dữ liệu chuẩn
  await prisma.approvalMatrixRule.deleteMany({ where: { orgId: buyerOrg.id } });

  for (const rule of approvalRules) {
    await prisma.approvalMatrixRule.create({
      data: {
        ...rule,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        createdById: createdBuyerUsers[UserRole.PLATFORM_ADMIN].id,
      },
    });
  }

  console.log(
    `✅ Successfully seeded ${approvalRules.length} approval matrix rules.`,
  );

  console.log('✨ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
