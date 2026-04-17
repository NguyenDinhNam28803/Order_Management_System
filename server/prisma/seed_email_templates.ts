/**
 * Seed: Email Notification Templates
 *
 * Upsert toàn bộ notification_templates dùng eventType làm key.
 * Chạy: npx ts-node --project tsconfig.json prisma/seed_email_templates.ts
 *
 * Lưu ý: bodyTemplate dưới đây dùng cho kênh SMS/IN_APP ({{variable}} syntax).
 * Kênh EMAIL render HTML thông qua EmailTemplatesService.render() trong code.
 * subject luôn được dùng làm tiêu đề email gửi đi.
 */
import { PrismaClient, NotificationChannel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────────────────────
// Danh sách templates
// priority: 1 = cao (urgent), 2 = thường, 3 = thấp (info)
// ─────────────────────────────────────────────────────────────────────────────
const templates = [
  // ── 1. Tài khoản ──────────────────────────────────────────────────────────
  {
    eventType: 'NEW_USER_ACCOUNT',
    channel: NotificationChannel.EMAIL,
    priority: 1,
    subject: 'Chào mừng bạn gia nhập hệ thống SPMS',
    bodyTemplate:
      'Chào {{name}}, tài khoản của bạn đã được tạo thành công.\n' +
      'Email: {{email}} | Tổ chức: {{orgName}} | Vai trò: {{role}}\n' +
      '{{#tempPassword}}Mật khẩu tạm: {{tempPassword}} — Vui lòng đổi ngay sau khi đăng nhập.{{/tempPassword}}\n' +
      'Đăng nhập tại: {{loginUrl}}',
  },
  {
    eventType: 'USER_REGISTERED',
    channel: NotificationChannel.EMAIL,
    priority: 1,
    subject: 'Chào mừng bạn gia nhập hệ thống SPMS',
    bodyTemplate:
      'Chào {{name}}, tài khoản của bạn đã được tạo thành công.\n' +
      'Email: {{email}} | Tổ chức: {{orgName}} | Vai trò: {{role}}\n' +
      'Đăng nhập tại: {{loginUrl}}',
  },
  {
    eventType: 'USER_LOGIN',
    channel: NotificationChannel.EMAIL,
    priority: 3,
    subject: 'Thông báo đăng nhập vào SPMS — {{loginAt}}',
    bodyTemplate:
      'Chào {{name}}, tài khoản của bạn vừa đăng nhập lúc {{loginAt}} ' +
      'từ thiết bị {{device}} (vị trí: {{location}}). ' +
      'Nếu không phải bạn, hãy đổi mật khẩu ngay.',
  },

  // ── 2. Yêu cầu mua hàng (PR) ──────────────────────────────────────────────
  {
    eventType: 'PR_APPROVED',
    channel: NotificationChannel.EMAIL,
    priority: 2,
    subject: '[Đã duyệt] Yêu cầu mua hàng {{prNumber}} được phê duyệt',
    bodyTemplate:
      'Chào {{name}}, yêu cầu mua hàng {{prNumber}} — "{{prTitle}}" ' +
      'đã được {{approverName}} phê duyệt. ' +
      'Bộ phận mua sắm sẽ tiến hành xử lý.',
  },
  {
    eventType: 'PR_REJECTED',
    channel: NotificationChannel.EMAIL,
    priority: 2,
    subject: '[Từ chối] Yêu cầu mua hàng {{prNumber}} bị từ chối',
    bodyTemplate:
      'Chào {{name}}, yêu cầu mua hàng {{prNumber}} — "{{prTitle}}" ' +
      'đã bị {{approverName}} từ chối. Lý do: {{rejectReason}}. ' +
      'Vui lòng chỉnh sửa và gửi lại.',
  },

  // ── 3. Đơn mua hàng (PO) ──────────────────────────────────────────────────
  {
    eventType: 'PO_APPROVAL_REQUEST',
    channel: NotificationChannel.EMAIL,
    priority: 1,
    subject: '[Cần phê duyệt] Đơn hàng mua sắm {{poNumber}} — {{totalAmount}} {{currency}}',
    bodyTemplate:
      'Chào {{name}}, có đơn hàng {{poNumber}} cần bạn phê duyệt. ' +
      'Nhà cung cấp: {{supplierName}} | Giá trị: {{totalAmount}} {{currency}}. ' +
      'Vui lòng vào hệ thống để xem và phê duyệt.',
  },
  {
    eventType: 'PO_APPROVED',
    channel: NotificationChannel.EMAIL,
    priority: 2,
    subject: '[Đã duyệt] Đơn hàng {{poNumber}} được phê duyệt thành công',
    bodyTemplate:
      'Chào {{name}}, đơn hàng {{poNumber}} đã được phê duyệt thành công. ' +
      'Hệ thống sẽ gửi PO tới nhà cung cấp ngay lập tức.',
  },

  // ── 4. Yêu cầu báo giá (RFQ) ──────────────────────────────────────────────
  {
    eventType: 'RFQ_INVITATION',
    channel: NotificationChannel.EMAIL,
    priority: 1,
    subject: '[Mời báo giá] {{rfqNumber}} — {{rfqTitle}} | Hạn: {{deadline}}',
    bodyTemplate:
      'Kính gửi {{name}}, ' +
      'Công ty trân trọng mời quý vị báo giá cho yêu cầu "{{rfqTitle}}" ({{rfqNumber}}). ' +
      'Hạn nộp: {{deadline}}. Hàng hóa: {{itemsSummary}}. ' +
      'Vui lòng vào hệ thống để xem chi tiết và gửi báo giá.',
  },
  {
    eventType: 'QUOTATION_RECEIVED',
    channel: NotificationChannel.EMAIL,
    priority: 2,
    subject: '[Báo giá mới] {{supplierName}} vừa gửi báo giá cho {{rfqNumber}}',
    bodyTemplate:
      'Chào {{name}}, nhà cung cấp {{supplierName}} vừa gửi báo giá cho ' +
      'RFQ {{rfqNumber}} — "{{rfqTitle}}". ' +
      'Tổng số báo giá nhận được: {{quotationCount}}. ' +
      'Vui lòng vào hệ thống để so sánh và lựa chọn.',
  },

  // ── 5. Hợp đồng ───────────────────────────────────────────────────────────
  {
    eventType: 'CONTRACT_EXPIRY_WARNING',
    channel: NotificationChannel.EMAIL,
    priority: 1,
    subject: '[Cảnh báo] Hợp đồng {{contractCode}} sắp hết hạn — còn {{daysLeft}} ngày',
    bodyTemplate:
      'Chào {{name}}, hợp đồng {{contractCode}} với {{supplierName}} ' +
      'sẽ hết hạn vào {{expiryDate}} (còn {{daysLeft}} ngày). ' +
      'Vui lòng liên hệ nhà cung cấp để gia hạn hoặc đàm phán hợp đồng mới.',
  },

  // ── 6. Nhận hàng (GRN) ────────────────────────────────────────────────────
  {
    eventType: 'GRN_CONFIRMED',
    channel: NotificationChannel.EMAIL,
    priority: 2,
    subject: '[Nhận hàng] GRN {{grnCode}} đã xác nhận — Sẵn sàng đối chiếu hóa đơn',
    bodyTemplate:
      'Chào {{name}}, bộ phận kho đã xác nhận nhận hàng cho đơn {{poCode}} ({{grnCode}}) ' +
      'từ {{supplierName}} vào ngày {{confirmedAt}}. ' +
      'Hệ thống đã kích hoạt quy trình đối chiếu 3 chiều PO ↔ GRN ↔ Invoice.',
  },

  // ── 7. Ngân sách ──────────────────────────────────────────────────────────
  {
    eventType: 'BUDGET_LIMIT_WARNING',
    channel: NotificationChannel.EMAIL,
    priority: 1,
    subject: '[Cảnh báo ngân sách] {{deptName}} đã dùng {{usedPercent}}% ngân sách {{budgetPeriod}}',
    bodyTemplate:
      'Chào {{name}}, ngân sách phòng {{deptName}} kỳ {{budgetPeriod}} ' +
      'đã sử dụng {{usedPercent}}% (còn lại: {{remainingAmount}} VNĐ). ' +
      'Vui lòng kiểm soát chi tiêu hoặc yêu cầu điều chỉnh ngân sách.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🚀 Seeding ${templates.length} email notification templates...`);

  let created = 0;
  let updated = 0;

  for (const tpl of templates) {
    const existing = await prisma.notificationTemplate.findUnique({
      where: { eventType: tpl.eventType },
    });

    if (existing) {
      await prisma.notificationTemplate.update({
        where: { eventType: tpl.eventType },
        data: {
          subject:      tpl.subject,
          bodyTemplate: tpl.bodyTemplate,
          priority:     tpl.priority,
          channel:      tpl.channel,
          isActive:     true,
        },
      });
      console.log(`  ↺  Updated : ${tpl.eventType}`);
      updated++;
    } else {
      await prisma.notificationTemplate.create({ data: tpl as any });
      console.log(`  +  Created : ${tpl.eventType}`);
      created++;
    }
  }

  console.log(`\n✅ Done — ${created} created, ${updated} updated.\n`);

  console.log('📋 Tổng kết các template đã seed:');
  console.log('   Tài khoản      : NEW_USER_ACCOUNT, USER_REGISTERED, USER_LOGIN');
  console.log('   PR             : PR_APPROVED, PR_REJECTED');
  console.log('   PO             : PO_APPROVAL_REQUEST, PO_APPROVED');
  console.log('   RFQ            : RFQ_INVITATION, QUOTATION_RECEIVED');
  console.log('   Hợp đồng       : CONTRACT_EXPIRY_WARNING');
  console.log('   Nhận hàng      : GRN_CONFIRMED');
  console.log('   Ngân sách      : BUDGET_LIMIT_WARNING');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
