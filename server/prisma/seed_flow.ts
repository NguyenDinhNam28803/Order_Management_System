import {
  PrismaClient,
  //UserRole,
  KycStatus,
  CompanyType,
  PrStatus,
  //CurrencyCode,
  //SupplierTier,
  RfqStatus,
  QuotationStatus,
  PoStatus,
} from '@prisma/client';
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
  console.log('🚀 Bắt đầu seed dữ liệu luồng từ PR đến PO...');

  //const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Lấy hoặc tạo Organization
  const buyerOrg = await prisma.organization.upsert({
    where: { code: 'BUYER_CORP' },
    update: {},
    create: {
      code: 'BUYER_CORP',
      name: 'Global Tech Solutions (Vietnam)',
      companyType: CompanyType.BOTH,
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
      companyType: CompanyType.SUPPLIER,
      industry: 'Electronics',
      countryCode: 'VN',
      isActive: true,
      kycStatus: KycStatus.APPROVED,
    },
  });

  // 2. Lấy hoặc tạo Department & Cost Center
  const itDept = await prisma.department.findFirst({
    where: { orgId: buyerOrg.id, code: 'IT_DEPT' },
  });
  if (!itDept)
    throw new Error('IT_DEPT not found. Please run main seed first.');

  const costCenter = await prisma.costCenter.findFirst({
    where: { orgId: buyerOrg.id, code: 'CC_IT_OPS' },
  });
  if (!costCenter)
    throw new Error('CC_IT_OPS not found. Please run main seed first.');

  // 3. Lấy Users
  const requester = await prisma.user.findUnique({
    where: { email: 'john.requester@gts.com' },
  });
  const procurement = await prisma.user.findUnique({
    where: { email: 'mike.procurement@gts.com' },
  });
  const supplierUser = await prisma.user.findUnique({
    where: { email: 'sales@hanoihardware.vn' },
  });

  if (!requester || !procurement || !supplierUser) {
    throw new Error('Required users not found. Please run main seed first.');
  }

  // 4. Lấy Products
  const laptop = await prisma.product.findFirst({
    where: { name: { contains: 'Laptop' } },
  });
  const monitor = await prisma.product.findFirst({
    where: { name: { contains: 'Monitor' } },
  });

  if (!laptop || !monitor) throw new Error('Products not found.');

  console.log('📝 Tạo Purchase Requisition (PR)...');
  const pr = await prisma.purchaseRequisition.create({
    data: {
      prNumber: `PR-FLOW-${Date.now().toString().slice(-6)}`,
      title: 'Dự án nâng cấp hạ tầng IT 2026',
      description: 'Cần mua thêm Laptop và Monitor cho nhân viên mới',
      orgId: buyerOrg.id,
      requesterId: requester.id,
      deptId: itDept.id,
      costCenterId: costCenter.id,
      status: PrStatus.APPROVED, // Giả định đã được duyệt để đi tiếp luồng Sourcing
      totalEstimate: 100000000,
      items: {
        create: [
          {
            lineNumber: 1,
            productId: laptop.id,
            productDesc: laptop.name,
            qty: 5,
            unit: 'UNIT',
            estimatedPrice: 15000000,
          },
          {
            lineNumber: 2,
            productId: monitor.id,
            productDesc: monitor.name,
            qty: 5,
            unit: 'UNIT',
            estimatedPrice: 5000000,
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log('🔍 Tạo RFQ từ PR...');
  const rfq = await prisma.rfqRequest.create({
    data: {
      rfqNumber: `RFQ-FLOW-${Date.now().toString().slice(-6)}`,
      orgId: buyerOrg.id,
      prId: pr.id,
      title: 'Mời thầu thiết bị IT cho dự án nâng cấp',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Deadline 7 ngày tới
      status: RfqStatus.SENT,
      createdById: procurement.id,
      items: {
        create: pr.items.map((item) => ({
          prItemId: item.id,
          lineNumber: item.lineNumber,
          description: item.productDesc,
          qty: item.qty,
          unit: item.unit,
        })),
      },
      suppliers: {
        create: {
          supplierId: supplierOrg.id,
        },
      },
    },
    include: { items: true },
  });

  console.log('💰 Nhà cung cấp gửi Báo giá (Quotation)...');
  const quotation = await prisma.rfqQuotation.create({
    data: {
      quotationNumber: `QUO-FLOW-${Date.now().toString().slice(-6)}`,
      rfqId: rfq.id,
      supplierId: supplierOrg.id,
      totalPrice: 95000000, // Thấp hơn estimate một chút
      leadTimeDays: 5,
      validityDays: 30,
      status: QuotationStatus.SUBMITTED,
      submittedAt: new Date(),
      items: {
        create: rfq.items.map((item) => ({
          rfqItemId: item.id,
          unitPrice: item.lineNumber === 1 ? 14000000 : 5000000,
          qtyOffered: item.qty,
        })),
      },
    },
  });

  console.log('🏆 Trao thầu và tạo Purchase Order (PO)...');
  // 1. Chấp nhận báo giá
  await prisma.rfqQuotation.update({
    where: { id: quotation.id },
    data: {
      status: QuotationStatus.ACCEPTED,
      reviewedAt: new Date(),
      reviewedById: procurement.id,
    },
  });

  // 2. Cập nhật RFQ sang AWARDED
  await prisma.rfqRequest.update({
    where: { id: rfq.id },
    data: {
      status: RfqStatus.AWARDED,
      awardedSupplierId: supplierOrg.id,
      awardedAt: new Date(),
    },
  });

  // 3. Tạo Purchase Order
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: `PO-FLOW-${Date.now().toString().slice(-6)}`,
      orgId: buyerOrg.id,
      prId: pr.id,
      rfqId: rfq.id,
      quotationId: quotation.id,
      supplierId: supplierOrg.id,
      buyerId: procurement.id,
      deptId: itDept.id,
      costCenterId: costCenter.id,
      status: PoStatus.ISSUED,
      totalAmount: 95000000,
      taxAmount: 9500000, // 10% VAT
      deliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            lineNumber: 1,
            sku: laptop.sku,
            description: laptop.name,
            qty: 5,
            unit: 'UNIT',
            unitPrice: 14000000,
            total: 70000000,
          },
          {
            lineNumber: 2,
            sku: monitor.sku,
            description: monitor.name,
            qty: 5,
            unit: 'UNIT',
            unitPrice: 5000000,
            total: 25000000,
          },
        ],
      },
    },
  });

  // 4. Cập nhật trạng thái PR sang PO_CREATED
  await prisma.purchaseRequisition.update({
    where: { id: pr.id },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data: { status: 'PO_CREATED' as any },
  });

  console.log(`✨ Hoàn tất seed luồng! PO đã tạo: ${po.poNumber}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
