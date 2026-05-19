# 🎯 Hướng Dẫn Chạy Seed và Test Hai Flow

## 📥 Step 1: Chạy Seed

### Option A: Dùng npx ts-node (nhanh nhất)
```bash
cd server
npx ts-node --project tsconfig.json prisma/seed_two_flows.ts
```

### Option B: Dùng prisma seed (nếu đã config)
```bash
cd server
npx prisma db seed -- seed_two_flows.ts
```

### Output Mong Đợi
```
🌱 Seed Data for Two Procurement Flows...

📦 Creating Organization, Users, and Departments...
✅ Organization created: [UUID]
✅ Users created: Requester, Approver, Procurement Officer

🏷️  Creating Product Categories...
✅ Categories created: [UUID], [UUID]

📄 Creating Products for FLOW 1 (STABLE - Office Supplies)...
✅ STABLE Products created:
   - A4 Paper (52,000 VND/ream)
   - Ballpoint Pen (90,000 VND/box)
   - Printer (2,600,000 VND/pcs)

💻 Creating Products for FLOW 2 (VOLATILE - Software)...
✅ VOLATILE Products created:
   - Windows Server (Reference: 5,000,000 VND/license, change freq: 3x/month)
   - Azure Cloud (Reference: 2,000,000 VND/month, change freq: 5x/month)
   - Adobe CC (Reference: 8,000,000 VND/5seats, change freq: 2x/month)

🔷 Creating Purchase Requisition for FLOW 1 (STABLE Items)...
✅ PR FLOW 1 created: PR-FLOW1-XXXXXXXXX
   Status: DRAFT
   Total items: 3 (all STABLE price products)
   Total estimate: 5,532,000 VND
   Expected: Auto tạo RFQ sau khi APPROVED

🔶 Creating Purchase Requisition for FLOW 2 (VOLATILE Items)...
✅ PR FLOW 2 created: PR-FLOW2-XXXXXXXXX
   Status: DRAFT
   Total items: 3 (all VOLATILE price products)
   Total estimate: 47,000,000 VND
   Expected: Auto tạo QuotationRequest sau khi APPROVED

═══════════════════════════════════════════════════════════════════════════════
🎯 HƯỚNG DẪN TEST HAI FLOW
✨ Seed completed! Ready to test both flows.
```

---

## 🔷 Test FLOW 1: STABLE PRICES (Office Supplies)

### Mục Đích
Tất cả items có giá ổn định → Hệ thống tự tạo **RFQ** ngay sau khi duyệt → Nhanh chóng

### Quy Trình

**Step 1: Xem PR vừa tạo**
- Tìm PR với số `PR-FLOW1-XXXXXXXXX` 
- Status: `DRAFT`
- Items: A4 Paper (10 ream), Pen (5 box), Printer (2 pcs)
- Total: ~5,532,000 VND

**Step 2: SUBMIT PR**
```
Action: Submit/Send for Approval
Expected: Status DRAFT → PENDING_APPROVAL
```

**Step 3: ASSIGN APPROVER**
```
Approver: approver_flow@test.com (Finance role)
Action: Assign to approver
```

**Step 4: DUYỆT PR (Log in as Approver)**
```
Action: Approve
Expected:
  - Status: PENDING_APPROVAL → APPROVED
  - Approved At: [timestamp]
```

**🤖 AUTOMATION TÍCH CỰC (không cần bất cứ thao tác nào)**
```
AutomationService.handleDocumentApproved() được gọi:

1. Check items:
   - product_A4Paper.priceVolatility = STABLE ✓
   - product_Pen.priceVolatility = STABLE ✓
   - product_Printer.priceVolatility = STABLE ✓
   
2. Kết luận: hasVolatileItems = false

3. Gọi: autoCreateRfqFromPr(prId)
   
4. Kiểm tra trước: Có RFQ nào cho PR này chưa? 
   → Không → Tiếp tục
   
5. Tạo RfqRequest:
   - rfqNumber: RFQ-AUTO-2026-XXXX
   - prId: [PR Flow 1 ID]
   - title: "RFQ tự động cho Office Supplies for Q2 2026"
   - items: Copy 3 items từ PR
   - status: SENT (đã gửi)
   - deadline: +7 ngày
   
6. Gọi: rfqService.searchAndAddSuppliers(rfq.id)
   → AI gợi ý nhà CC phù hợp
   
7. Log: "Automation completed for PR PR-FLOW1-XXXXXXXXX"
```

**Step 5: VERIFY KẾT QUẢ**
```
✅ RfqRequest được tạo tự động:
   - Số: RFQ-AUTO-2026-XXXX
   - Status: SENT
   - Items: 3 items (A4 Paper, Pen, Printer)
   - Suppliers invited: [list]
   - Deadline: [+7 days]

✅ Nhà CC bắt đầu báo giá
✅ Có thể kiểm tra trong Sourcing Tab
```

### Kiểm Tra trong Database
```sql
-- Xem RFQ vừa tạo
SELECT * FROM rfq_requests 
WHERE pr_id = '[PR Flow 1 ID]' 
AND status = 'SENT';

-- Expected: 1 record

-- Xem RFQ items
SELECT * FROM rfq_items 
WHERE rfq_id = '[RFQ ID]';

-- Expected: 3 items (paper, pen, printer)

-- Xem suppliers invited
SELECT * FROM rfq_suppliers 
WHERE rfq_id = '[RFQ ID]';

-- Expected: 2-3 suppliers tự động gợi ý
```

---

## 🔶 Test FLOW 2: VOLATILE PRICES (Software)

### Mục Đích
Có items giá thay đổi → Hệ thống tự tạo **QuotationRequest** → Chờ nhà CC báo giá → Chậm hơn

### Quy Trình

**Step 1: Xem PR vừa tạo**
- Tìm PR với số `PR-FLOW2-XXXXXXXXX`
- Status: `DRAFT`
- Items: Windows Server (3 license), Azure (12 months), Adobe CC (1x5seats)
- Total: ~47,000,000 VND

**Step 2: SUBMIT PR**
```
Action: Submit/Send for Approval
Expected: Status DRAFT → PENDING_APPROVAL
```

**Step 3: ASSIGN APPROVER**
```
Approver: approver_flow@test.com
Action: Assign to approver
```

**Step 4: DUYỆT PR (Log in as Approver)**
```
Action: Approve
Expected:
  - Status: PENDING_APPROVAL → APPROVED
  - Approved At: [timestamp]
```

**🤖 AUTOMATION TÍCH CỰC**
```
AutomationService.handleDocumentApproved() được gọi:

1. Check items:
   - product_WindowsServer.priceVolatility = VOLATILE ✓
   - product_CloudService.priceVolatility = VOLATILE ✓
   - product_AdobeSuite.priceVolatility = VOLATILE ✓
   
2. Kết luận: hasVolatileItems = true

3. Gọi: autoCreateQuotationRequestFromPr(prId)

4. Nhóm theo categoryId:
   - Tất cả 3 items cùng category: SOFTWARE-LICENSE
   - categoryMap = { [SOFTWARE-LICENSE-ID]: 47,000,000 }

5. Tạo QuotationRequest:
   - prId: [PR Flow 2 ID]
   - categoryId: [SOFTWARE-LICENSE Category ID]
   - description: "Báo giá cho danh mục mặt hàng - PR PR-FLOW2-XXXXXXXXX"
   - estimatedBudget: 47,000,000 VND
   - status: PENDING (chờ xử lý)
   - note: "Mặt hàng có giá thay đổi liên tục..."
   
6. Log: "QuotationRequest created for category: [ID]"
   Log: "Automation completed: QuotationRequests created for PR"
```

**Step 5: VERIFY KẾT QUẢ**
```
✅ QuotationRequest được tạo tự động:
   - Số: [auto-generate]
   - Status: PENDING
   - Danh mục: SOFTWARE-LICENSE
   - Ngân sách dự kiến: 47,000,000 VND
   - Ghi chú: "Mặt hàng có giá thay đổi..."

✅ Chờ nhân viên tuyển mua xử lý
✅ Có thể kiểm tra trong Quotation Requests Tab
```

**Step 6: QUẢN LÝ QUOTATION REQUEST (Procurement Officer)**

```
Log in as: procurement_flow@test.com (Procurement Officer)

Action: Xem QuotationRequest (status: PENDING)
  - Review items và ngân sách
  - Chọn nhà CC để tìm giá

Action: Gửi request báo giá
  - Email/Contact nhà CC
  - Yêu cầu cung cấp báo giá chi tiết
  - Deadline: ~1-2 tuần

Nhà CC nộp báo giá:
  - Update QuotationRequest.returnedPrice
  - Update status: ACKNOWLEDGED → PRICE_RETURNED

Action: Tạo PR chính thức
  - Dựa trên giá báo từ nhà CC
  - Cập nhật số lượng, giá nếu cần
  - Submit PR mới → Duyệt → Tạo PO
```

### Kiểm Tra trong Database
```sql
-- Xem QuotationRequest vừa tạo
SELECT * FROM quotation_requests 
WHERE pr_id = '[PR Flow 2 ID]' 
AND status = 'PENDING';

-- Expected: 1 record

-- Xem dữ liệu chi tiết
SELECT * FROM quotation_requests qr
LEFT JOIN purchase_requisitions pr ON qr.pr_id = pr.id
WHERE qr.pr_id = '[PR Flow 2 ID]';

-- Expected:
-- - prId: [PR Flow 2 ID]
-- - categoryId: [SOFTWARE-LICENSE-ID]
-- - estimatedBudget: 47,000,000
-- - status: PENDING
-- - returnedPrice: NULL (chưa có báo giá)
```

---

## 🧪 Test Case Kỳ Lạ: PR MIX

**Nếu muốn test trường hợp PR có vừa STABLE vừa VOLATILE**

Tạo PR mới với items:
```
1. A4 Paper (STABLE)
2. Windows Server (VOLATILE)
3. Pen (STABLE)
```

Duyệt PR:
```
✅ EXPECTED: Hệ thống chọn FLOW 2 (vì có 1 item VOLATILE)
   → Tạo QuotationRequest (không tạo RFQ)
   → TẤT CẢ items (cả 3) sẽ vào QuotationRequest
```

---

## 📊 Tóm Tắt Kết Quả

| Tiêu Chí | Flow 1 (STABLE) | Flow 2 (VOLATILE) |
|----------|-----------------|-------------------|
| **Product Type** | A4 Paper, Pen, Printer | Windows Server, Azure, Adobe |
| **priceVolatility** | STABLE | VOLATILE |
| **Auto Creation** | RFQ Request | Quotation Request |
| **Status** | SENT | PENDING |
| **Có AI Gợi Ý?** | ✅ Có (searchAndAddSuppliers) | ❌ Không (chờ manual) |
| **Thời Gian** | Nhanh (2-3 tuần) | Chậm (3-4 tuần) |
| **Next Step** | Nhà CC báo giá ngay | Tuyển mua tìm giá |
| **DB Record** | rfq_requests | quotation_requests |

---

## 🔍 Debugging

### Automation không chạy?
1. Verify PR status = APPROVED (không phải SUBMITTED)
2. Xem server logs: `grep "Auto-creating" full_server_log.txt`
3. Verify AutomationService được inject đúng

### RFQ không được tạo?
```sql
-- Check existing RFQ
SELECT * FROM rfq_requests WHERE pr_id = '[PR ID]';

-- Nếu có: xóa tạo lại PR
DELETE FROM rfq_requests WHERE pr_id = '[PR ID]';
```

### Product priceVolatility undefined?
```bash
# Regenerate Prisma client
npx prisma generate

# Rebuild
npm run build
```

---

## 🚀 Sau Khi Test Thành Công

1. ✅ Verify cả 2 flow hoạt động
2. 📝 Ghi chép time logs (STABLE vs VOLATILE)
3. 💾 Backup database trước/sau
4. 📊 Import data production (nếu sẵn sàng)
5. 🎓 Training team về 2 flow procedure
