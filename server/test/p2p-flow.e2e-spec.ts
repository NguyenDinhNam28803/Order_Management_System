import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Procure-to-Pay (P2P) & Supplier Evaluation (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let prId: string;
  let poId: string;
  let grnId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let invoiceId: string;

  // Lưu ý: Các UUID bên dưới cần được thay thế bằng dữ liệu thực tế trong DB của bạn
  // Hoặc script này nên chạy sau một bước Seed dữ liệu chuẩn.
  const supplierId = '00000000-0000-0000-0000-000000000001';
  const deptId = '00000000-0000-0000-0000-000000000002';
  const costCenterId = '00000000-0000-0000-0000-000000000003';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Giả lập đăng nhập để lấy token thực hiện các bước sau
    // Nếu hệ thống chưa có dữ liệu, bước này có thể thất bại.
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@company.com', password: 'adminPassword' });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    authToken = loginRes.body.accessToken || 'mock-token';
  });

  describe('Quy trình 1: PROCURE-TO-PAY (P2P)', () => {
    it('Bước 1: Tạo PR (Status: DRAFT)', async () => {
      const res = await request(app.getHttpServer())
        .post('/purchase-requisitions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Thiết bị văn phòng đợt 1',
          description: 'Mua Laptop và màn hình cho nhân viên mới',
          deptId: deptId,
          costCenterId: costCenterId,
          items: [
            {
              productDesc: 'Laptop Dell Latitude 5420',
              qty: 2,
              unit: 'PCS',
              estimatedPrice: 20000000,
              currency: 'VND',
            },
          ],
        });

      expect(res.status).toBe(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      prId = res.body.id;
      expect(res.body.status).toBe('DRAFT');
      console.log(`- Created PR: ${res.body.prNumber} (Status: DRAFT)`);
    });

    it('Bước 2: Phê duyệt PR (Status: APPROVED)', async () => {
      // Giả định API cập nhật trạng thái trực tiếp (Workflow thực tế có thể phức tạp hơn)
      const res = await request(app.getHttpServer())
        .patch(`/purchase-requisitions/${prId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('APPROVED');
      console.log(`- PR ${prId} approved. Committed budget updated.`);
    });

    it('Bước 3: Tạo PO từ PR (Status: ISSUED)', async () => {
      const res = await request(app.getHttpServer())
        .post('/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prId: prId,
          supplierId: supplierId,
          deliveryDate: new Date(Date.now() + 86400000 * 7), // 7 ngày sau
          paymentTerms: 'Net 30',
        });

      expect(res.status).toBe(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      poId = res.body.id;
      expect(res.body.status).toBe('ISSUED');
      console.log(`- Created PO: ${res.body.poNumber} from PR.`);
    });

    it('Bước 4: Nhập hàng qua GRN (Status: CONFIRMED)', async () => {
      const res = await request(app.getHttpServer())
        .post('/goods-receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          poId: poId,
          receivedAt: new Date(),
          items: [
            {
              poItemId: 'get-item-id-from-po', // Cần lấy ID thực tế từ PO
              receivedQty: 2,
              acceptedQty: 2,
              qcResult: 'PASS',
            },
          ],
        });

      expect(res.status).toBe(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      grnId = res.body.id;
      expect(res.body.status).toBe('CONFIRMED');
      console.log(
        `- GRN ${res.body.grnNumber} confirmed. Inventory/Quality updated.`,
      );
    });

    it('Bước 5: Tạo Invoice & 3-Way Match (Status: MATCHING)', async () => {
      const res = await request(app.getHttpServer())
        .post('/supplier-invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          poId: poId,
          grnId: grnId,
          invoiceNumber: `INV-${Date.now()}`,
          totalAmount: 40000000,
          invoiceDate: new Date(),
        });

      expect(res.status).toBe(201);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      invoiceId = res.body.id;
      // Trạng thái sẽ là MATCHING hoặc AUTO_APPROVED nếu dữ liệu khớp hoàn toàn
      expect(['MATCHING', 'AUTO_APPROVED']).toContain(res.body.status);
      console.log(`- Invoice created. 3-Way Matching process started.`);
    });
  });

  describe('Quy trình 2: ĐÁNH GIÁ NHÀ CUNG CẤP (SUPPLIER EVALUATION)', () => {
    it('Bước 6: Kiểm tra tính toán KPI tự động', async () => {
      // API này giả định hệ thống sẽ trigger việc tính lại điểm dựa trên GRN/PO vừa tạo
      const res = await request(app.getHttpServer())
        .get(`/supplier-kpi/calculate/${supplierId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.otdScore).toBeDefined(); // Điểm giao hàng đúng hạn
      expect(res.body.qualityScore).toBeDefined(); // Điểm chất lượng
      console.log(
        `- KPI recalculated: OTD=${res.body.otdScore}, Quality=${res.body.qualityScore}`,
      );
    });

    it('Bước 7: Đánh giá thủ công (Manual Review)', async () => {
      const res = await request(app.getHttpServer())
        .post('/supplier-manual-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          poId: poId,
          packagingScore: 5,
          communicationScore: 4,
          overallScore: 90,
          comment: 'Nhà cung cấp hỗ trợ tốt, đóng gói cẩn thận.',
        });

      expect(res.status).toBe(201);
      expect(res.body.overallScore).toBe(90);
      console.log(`- Manual review submitted for PO ${poId}.`);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
