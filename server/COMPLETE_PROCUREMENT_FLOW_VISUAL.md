# 📦 COMPLETE PROCUREMENT FLOW: Từ PR đến Supplier Evaluation

**Ngày cập nhật:** April 5, 2026  
**Phiên bản:** 3.0 - Visual Complete Flow  

---

## 📊 TỔNG QUAN: SƠ ĐỒ CHUNG TOÀN BỘ QUY TRÌNH

```
                        👤 REQUESTER
                             │
                             ↓
                    ┌──────────────────┐
                    │ 1️⃣ TẠO PR        │
                    │ Status: DRAFT     │
                    └──────────────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │ 2️⃣ SUBMIT PR      │
                    │ PENDING_APPROVAL  │
                    └──────────────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │ 3️⃣ PHÂN LOẠI      │
                    │ Volatility Check  │
                    └──────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ↓            ↓            ↓
              STABLE     MODERATE      VOLATILE
              (Flow 1)   (Flow 2a)     (Flow 2b)
                │            │            │
                ↓            ↓            ↓
           ┌────────┐   ┌────────┐   ┌────────┐
           │⚡ PO   │   │🎫 RFQ  │   │🎫 RFQ  │
           │Direct  │   │Request │   │Request │
           └────────┘   └────────┘   └────────┘
                │            │            │
                ↓            ↓            ↓
           ┌────────┐   ┌────────┐   ┌────────┐
           │Confirm │   │Select  │   │Select  │
           │Auto    │   │Quote   │   │Quote   │
           └────────┘   └────────┘   └────────┘
                │            │            │
                └────────────┼────────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │ 4️⃣ PO CONFIRMED   │
                    │ Ready for Delivery│
                    └──────────────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │ 5️⃣ 📦 GRN CREATED │
                    │ 3-Way Matching   │
                    └──────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ↓                 ↓
              ✅ MATCHED      ⚠️ EXCEPTION
                    │                 │
                    └────────┬────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │ 6️⃣ 💳 INVOICE     │
                    │ APPROVED         │
                    └──────────────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │ 7️⃣ 💰 PAYMENT     │
                    │ COMPLETED        │
                    └──────────────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │ 8️⃣ 📊 KPI CALC    │
                    │ 6 Metrics        │
                    └──────────────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │ 9️⃣ 🏆 TIER ASSIGN │
                    │ GOLD/SILVER/BR   │
                    └──────────────────┘
```

---

## 🔵 FLOW 1: STABLE PRODUCTS (Giá ổn định - Tạo PO trực tiếp)

### 📋 Quy Trình Chi Tiết Flow 1

```
REQUESTER tạo Purchase Requisition (PR)
         │
         ↓
    ┌───────────────────────────────────────────────┐
    │ 📝 PR-001 (DRAFT)                             │
    │                                               │
    │ Sản phẩm: Dell XPS 13 Laptop                  │
    │ Qty: 5 cái                                    │
    │ Unit Price: 35,000,000 VND                    │
    │ Total: 175,000,000 VND                        │
    │                                               │
    │ Price Volatility: STABLE ✅                   │
    │ Requires Quote First: NO ✅                   │
    │ Status: DRAFT                                 │
    └───────────────────────────────────────────────┘
         │
         ↓ (NHÂN VIÊN SUBMIT & GIAO APPROVER)
    ┌───────────────────────────────────────────────┐
    │ 📝 PR-001                                     │
    │ Status: PENDING_APPROVAL                      │
    └───────────────────────────────────────────────┘
         │
         ↓ (MANAGER PHÊ DUYỆT)
    ┌───────────────────────────────────────────────┐
    │ ✅ PR-001                                     │
    │ Status: APPROVED                              │
    │                                               │
    │ 🤖 AUTOMATION TRIGGER:                        │
    │    AutomationService.checkAndCreatePO()       │
    │    → Kiểm tra: Tất cả items STABLE?           │
    │    → Kết quả: YES ✅                          │
    │    → Hành động: AUTO create PO                │
    └───────────────────────────────────────────────┘
         │
         ↓ (AUTO TRIGGER)
    ┌───────────────────────────────────────────────┐
    │ 📄 PO-001 (AUTO CREATED)                      │
    │                                               │
    │ PO Number: PO-2026-001                        │
    │ From PR: PR-001 ✅ (GIỐNG)                   │
    │ Supplier: FPT Shop                            │
    │ Qty: 5 cái                                    │
    │ Unit Price: 35,000,000 VND                    │
    │ Total: 175,000,000 VND                        │
    │                                               │
    │ Status: DRAFT [🤖 Auto confirm]               │
    │ 🤖 AutomationService.confirmPOForStable()    │
    └───────────────────────────────────────────────┘
         │
         ↓ (AUTO CONFIRM)
    ┌───────────────────────────────────────────────┐
    │ ✅ PO-001                                     │
    │ Status: CONFIRMED                             │
    │ Confirmed At: 2026-04-05 10:30                │
    │                                               │
    │ Trigger: PurchaseOrderService                 │
    │          → Chuyển status                      │
    │          → Lưu confirmed timestamp            │
    │          → Emit event 'po.confirmed'          │
    │          → Gửi email to Supplier              │
    └───────────────────────────────────────────────┘
         │
         ↓ (NHÀ CUNG CẤP GIAO HÀNG)
    ┌───────────────────────────────────────────────┐
    │ 📦 GRN-001 (GOODS RECEIVED NOTE)              │
    │ Status: CREATED                               │
    │                                               │
    │ PO Reference: PO-001                          │
    │ Received Items:                               │
    │   - Dell XPS 13: 5 cái ✅                     │
    │   - Unit Price: 35,000,000 VND ✅             │
    │   - Received Qty: 5 (vs PO: 5) ✅             │
    │   - Price Match: 0% variance ✅               │
    │                                               │
    │ Received At: 2026-04-06 14:00                 │
    │ Received By: Warehouse Staff                  │
    └───────────────────────────────────────────────┘
         │
         ↓ (3-WAY MATCHING VALIDATION)
    ┌───────────────────────────────────────────────┐
    │ 🔍 RECEIVING SERVICE VALIDATE                 │
    │                                               │
    │ Tolerance Settings:                           │
    │   - Qty Tolerance: ±2%                        │
    │   - Price Tolerance: ±1%                      │
    │                                               │
    │ Check 1: Qty Variance                         │
    │   GRN Qty vs PO Qty: 5 vs 5                   │
    │   Variance: 0% ✅ PASS (< 2%)                 │
    │                                               │
    │ Check 2: Price Variance                       │
    │   GRN Price vs PO Price: 35M vs 35M           │
    │   Variance: 0% ✅ PASS (< 1%)                 │
    │                                               │
    │ Check 3: Invoice Amount                       │
    │   Expected: 175M (5 × 35M) ✅                 │
    │                                               │
    │ Result: ✅ ALL CHECKS PASS                    │
    └───────────────────────────────────────────────┘
         │
         ↓ (AUTO APPROVE - STABLE + PASS TOLERANCE)
    ┌───────────────────────────────────────────────┐
    │ ✅ GRN-001                                    │
    │ Status: MATCHED                               │
    │ Approval: AUTO (không cần manual)             │
    │ Matched At: 2026-04-06 14:10                  │
    │                                               │
    │ 🤖 Trigger:                                   │
    │    ReceivingService.createGRNWithAutoValidation║
    │    → Validate 3-way matching PASS             │
    │    → Product is STABLE                        │
    │    → Auto set status to MATCHED               │
    │    → Emit 'grn.matched'                       │
    │    → Trigger auto invoice approval            │
    └───────────────────────────────────────────────┘
         │
         ↓ (AUTO APPROVE RELATED INVOICE)
    ┌───────────────────────────────────────────────┐
    │ 💳 INVOICE-001                                │
    │ Status: RECEIVED                              │
    │ Invoice Amount: 175,000,000 VND               │
    │                                               │
    │ 🤖 Trigger: InvoiceService                    │
    │    → Matched with GRN-001 ✅                  │
    │    → Amount matches PO ✅                     │
    │    → All items received ✅                    │
    │    → Auto approve (NO exception)              │
    └───────────────────────────────────────────────┘
         │
         ↓ (AUTO APPROVE)
    ┌───────────────────────────────────────────────┐
    │ ✅ INVOICE-001                                │
    │ Status: APPROVED                              │
    │ Approved At: 2026-04-06 14:15                 │
    │ Approved By: System (AutoApprovalService)     │
    │                                               │
    │ 🤖 Next: Schedule Payment                     │
    └───────────────────────────────────────────────┘
         │
         ↓ (SCHEDULE PAYMENT)
    ┌───────────────────────────────────────────────┐
    │ 💰 PAYMENT RECORD                             │
    │ Payment Number: PAY-2026-001                  │
    │ Amount: 175,000,000 VND                       │
    │ Status: SCHEDULED                             │
    │ Scheduled Date: 2026-04-13 (7 days later)    │
    │ Payment Method: BANK_TRANSFER                 │
    │                                               │
    │ 🤖 Add to Payment Queue (BullMQ)              │
    │    Delay: 7 days                              │
    │    Job: execute-payment                       │
    └───────────────────────────────────────────────┘
         │
         ↓ (EXECUTE PAYMENT - JOB DATE REACHED)
    ┌───────────────────────────────────────────────┐
    │ 🏦 BANKING SERVICE                            │
    │ Transfer Funds                                │
    │                                               │
    │ Recipient: FPT Shop                           │
    │ Bank: Vietcombank                             │
    │ Account: 1234567890                           │
    │ Amount: 175,000,000 VND                       │
    │ Description: "Payment Invoice-001 for PO-001" │
    │                                               │
    │ Status: TRANSFER_IN_PROGRESS                  │
    └───────────────────────────────────────────────┘
         │
         ↓ (PAYMENT COMPLETED)
    ┌───────────────────────────────────────────────┐
    │ ✅ PAYMENT RECORD                             │
    │ Status: COMPLETED                             │
    │ Completed At: 2026-04-13 15:30                │
    │ Transaction Ref: TXN-2026-ABC123              │
    │                                               │
    │ 🤖 Trigger:                                   │
    │    PaymentService.executePayment()            │
    │    → Banking API call SUCCESS                 │
    │    → Update payment status                    │
    │    → Emit 'payment.completed'                 │
    │    → Trigger KPI Calculation                  │
    └───────────────────────────────────────────────┘
         │
         ↓ (AUTO TRIGGER KPI)
    ┌───────────────────────────────────────────────┐
    │ 📊 KPI CALCULATION (Automatic)                │
    │ Supplier: FPT Shop                            │
    │ Quarter: 2026Q2                               │
    │ Status: CALCULATING                           │
    │                                               │
    │ 🤖 Calculating 6 Metrics:                    │
    │    1️⃣ On-Time Delivery...                    │
    │    2️⃣ Quality Score (3-Way Match)...         │
    │    3️⃣ Price Competitiveness...               │
    │    4️⃣ Invoice Accuracy...                    │
    │    5️⃣ Responsiveness...                      │
    │    6️⃣ Order Fulfillment...                   │
    └───────────────────────────────────────────────┘
         │
         ↓ (KPI CALCULATED)
    ┌───────────────────────────────────────────────┐
    │ ✅ KPI RESULT                                 │
    │ Status: CALCULATED                            │
    │                                               │
    │ Metrics:                                      │
    │   On-Time Delivery: 100% (25% weight)         │
    │   Quality Score: 100% (20% weight)            │
    │   Price Competit.: 95% (20% weight)           │
    │   Invoice Accuracy: 100% (15% weight)         │
    │   Responsiveness: 100% (10% weight)           │
    │   Order Fulfillm.: 100% (10% weight)          │
    │                                               │
    │ TOTAL SCORE: 99% ✨                           │
    │                                               │
    │ 🏆 TIER: GOLD (≥ 85%)                         │
    └───────────────────────────────────────────────┘
         │
         ↓ (SAVE TO DATABASE)
    ┌───────────────────────────────────────────────┐
    │ 🏆 SUPPLIER EVALUATION                        │
    │ Status: COMPLETED                             │
    │                                               │
    │ Supplier: FPT Shop                            │
    │ Quarter: 2026Q2                               │
    │ Final Score: 99%                              │
    │ Assigned Tier: GOLD 🥇                        │
    │ Evaluation Date: 2026-04-13                   │
    │                                               │
    │ 📈 Dashboard Updated                          │
    │ 📧 Email sent to Procurement Manager          │
    └───────────────────────────────────────────────┘
         │
         ↓
    ✅ FLOW 1 COMPLETED SUCCESSFULLY
```

---

## 🟡 FLOW 2: MODERATE & VOLATILE PRODUCTS (Yêu cầu báo giá)

### 📋 Quy Trình Chi Tiết Flow 2

```
REQUESTER tạo Purchase Requisition (PR) - Quick Estimate
         │
         ↓
    ┌───────────────────────────────────────────────┐
    │ 📝 PR-002 (DRAFT - Quick Estimate)            │
    │                                               │
    │ Sản phẩm: iPhone 16 Pro Max                   │
    │ Qty: 20 cái (ước tính)                        │
    │ Unit Price: 42,000,000 VND (ước tính)        │
    │ Total: 840,000,000 VND (ước tính)             │
    │                                               │
    │ Price Volatility: MODERATE ⚠️                 │
    │ Requires Quote First: YES ✅                  │
    │ Status: DRAFT                                 │
    │                                               │
    │ Note: "Chỉ là dự kiến, có thể thay đổi"     │
    └───────────────────────────────────────────────┘
         │
         ↓ (NHÂN VIÊN SUBMIT)
    ┌───────────────────────────────────────────────┐
    │ 📝 PR-002                                     │
    │ Status: PENDING_APPROVAL                      │
    └───────────────────────────────────────────────┘
         │
         ↓ (MANAGER PHÊ DUYỆT)
    ┌───────────────────────────────────────────────┐
    │ ✅ PR-002                                     │
    │ Status: APPROVED                              │
    │                                               │
    │ 🤖 AUTOMATION TRIGGER:                        │
    │    AutomationService.checkProduct()           │
    │    → Kiểm tra: Có VOLATILE/MODERATE?          │
    │    → Kết quả: YES (MODERATE) ✅              │
    │    → Hành động: CREATE RFQ (không PO)         │
    └───────────────────────────────────────────────┘
         │
         ↓ (AUTO TRIGGER)
    ┌───────────────────────────────────────────────┐
    │ 📋 RFQ-001 (AUTO CREATED)                     │
    │ Status: DRAFT                                 │
    │                                               │
    │ RFQ Number: RFQ-2026-001                      │
    │ From PR: PR-002                               │
    │ Items:                                        │
    │   - Product: iPhone 16 Pro Max                │
    │   - Qty: 20 cái                               │
    │   - Budget: ~840,000,000 VND                  │
    │                                               │
    │ Scope: FLEXIBLE ❓                            │
    │   - Qty có thể thay đổi                       │
    │   - Loại sản phẩm có thể khác                 │
    │   - Spec có thể tư vấn                        │
    │                                               │
    │ Message: "Báo giá gói iPhone. Mong nhà CC     │
    │          tư vấn giải pháp tối ưu"            │
    └───────────────────────────────────────────────┘
         │
         ↓ (SEND TO SUPPLIERS)
    ┌───────────────────────────────────────────────┐
    │ 🎫 RFQ-001                                    │
    │ Status: SENT                                  │
    │ Sent At: 2026-04-05 09:00                     │
    │ Sent To: Supplier A, B, C                     │
    │                                               │
    │ 🤖 RFQService.sendRFQToSuppliers()            │
    │    → Create RFQResponse for each supplier     │
    │    → Send emails to suppliers                 │
    │    → Set deadline: 48 hours                   │
    └───────────────────────────────────────────────┘
         │
         ↓ (SUPPLIERS SUBMIT QUOTES)
    ┌───────────────────────────────────────────────┐
    │ 💰 QUOTE RECEIVED (OPTION A - Strict)         │
    │                                               │
    │ From Supplier A:                              │
    │ "iPhone 16 Pro Max 20 cái = 840,000,000 VND" │
    │ Strict matching RFQ scope                     │
    │                                               │
    │ ─────────────────────────────────────────     │
    │                                               │
    │ 💰 QUOTE RECEIVED (OPTION B - BUNDLED)       │
    │ From Supplier B:                              │
    │ "Better Option: iPhone 16 Pro MAX 25 cái     │
    │  + AppleCare 2 năm (THÊM MỚI)                 │
    │  = 900,000,000 VND (Nhưng rẻ hơn/cái)"       │
    │ ✅ Linh hoạt đề xuất khác                    │
    │                                               │
    │ ─────────────────────────────────────────     │
    │                                               │
    │ 💰 QUOTE RECEIVED (OPTION C - HYBRID)        │
    │ From Supplier C:                              │
    │ "Base: iPhone 16 Pro Max 15 cái = 630,000,000│
    │  + iPhone 16 (Tiêu chuẩn) 10 cái = 180,000,000│
    │  Total = 810,000,000 VND (Tiết kiệm)"        │
    │ ✅ Phối hợp chu kỳ nhu cầu                   │
    └───────────────────────────────────────────────┘
         │
         ↓ (PROCUREMENT OFFICER REVIEW & SELECT)
    ┌───────────────────────────────────────────────┐
    │ 👤 PROCUREMENT OFFICER DECISION               │
    │                                               │
    │ "Option B tốt nhất!                           │
    │  - Thêm AppleCare (hỗ trợ bảo hành)          │
    │  - Chỉ tăng 60M, lợi ích lớn"                 │
    │                                               │
    │ ✅ SELECT: Quote Option B (Supplier B)        │
    │                                               │
    │ 📋 Tạo PR CHÍNH THỨC MỚI                      │
    │    Dựa trên báo giá được chọn                │
    └───────────────────────────────────────────────┘
         │
         ↓ (CREATE FINAL PR)
    ┌───────────────────────────────────────────────┐
    │ ✅ PR-003 (CHÍNH THỨC MỚI)                    │
    │ Status: DRAFT                                 │
    │                                               │
    │ Items (CẬP NHẬT từ báo giá):                 │
    │   - iPhone 16 Pro Max: 25 cái (tăng từ 20)  │
    │   - AppleCare 2 năm: 25 gói (NEW)             │
    │                                               │
    │ Giá (CẬP NHẬT):                              │
    │   900,000,000 VND (từ 840,000,000)            │
    │                                               │
    │ Supplier: Supplier B (FPT Shop)               │
    │ Quote Reference: QUOTE-2026-001 (Option B)  │
    │                                               │
    │ Note: "PR chính thức từ báo giá. Khác PR-002"│
    │                                               │
    │ ⚠️ PR-003 ≠ PR-002 (Khác qty, khác items)    │
    └───────────────────────────────────────────────┘
         │
         ↓ (SUBMIT & APPROVE)
    ┌───────────────────────────────────────────────┐
    │ 📝 PR-003                                     │
    │ Status: PENDING_APPROVAL → APPROVED           │
    │ Approved By: Director / Manager               │
    │ Approved At: 2026-04-05 14:00                 │
    │                                               │
    │ 🤖 Auto trigger PO creation                   │
    └───────────────────────────────────────────────┘
         │
         ↓ (CREATE & CONFIRM PO)
    ┌───────────────────────────────────────────────┐
    │ 📄 PO-002 (FROM PR-003)                       │
    │ Status: DRAFT → CONFIRMED                     │
    │                                               │
    │ PO Number: PO-2026-002                        │
    │ From PR: PR-003 ✅ (CHÍNH THỨC)               │
    │ From Quote: QUOTE-2026-001 (Option B)        │
    │ Supplier: FPT Shop                            │
    │                                               │
    │ Items:                                        │
    │   - iPhone 16 Pro Max: 25 cái                 │
    │   - AppleCare 2 năm: 25 gói                   │
    │                                               │
    │ Total: 900,000,000 VND                        │
    │ Confirmed At: 2026-04-05 15:00                │
    │                                               │
    │ ≠ PR-002 (Quick Estimate)                     │
    │ = PR-003 (Official from Quote)                │
    └───────────────────────────────────────────────┘
         │
         ↓ (REST OF FLOW SAME AS FLOW 1)
    ┌───────────────────────────────────────────────┐
    │ 📦 GRN-002 (RECEIVING)                        │
    │ ↓                                             │
    │ 🔍 3-WAY MATCHING VALIDATION                  │
    │ ↓                                             │
    │ ✅ GRN-002 (MATCHED)                          │
    │ ↓                                             │
    │ 💳 INVOICE-002 (APPROVED)                     │
    │ ↓                                             │
    │ 💰 PAYMENT-002 (COMPLETED)                    │
    │ ↓                                             │
    │ 📊 KPI CALCULATION                            │
    │ ↓                                             │
    │ 🏆 SUPPLIER EVALUATION (COMPLETED)            │
    └───────────────────────────────────────────────┘
```

---

## 📊 CHI TIẾT 3-WAY MATCHING

```
    WHEN GRN IS CREATED
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ 🔍 3-WAY MATCHING VALIDATION              │
    │                                          │
    │ Compare 3 documents:                      │
    │ • PO (Purchase Order)                     │
    │ • GRN (Goods Received)                    │
    │ • Invoice (Supplier Invoice)              │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ ✓ CHECK 1: QUANTITY VALIDATION            │
    │                                          │
    │ PO Qty:        5 units                    │
    │ GRN Qty:       5 units                    │
    │ Invoice Qty:   5 units                    │
    │                                          │
    │ Variance: 0%                              │
    │ Tolerance: ±2%                            │
    │ Result: ✅ PASS                           │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ ✓ CHECK 2: UNIT PRICE VALIDATION          │
    │                                          │
    │ PO Price:      35,000,000 VND             │
    │ GRN Price:     35,000,000 VND             │
    │ Invoice Price: 35,000,000 VND             │
    │                                          │
    │ Variance: 0%                              │
    │ Tolerance: ±1%                            │
    │ Result: ✅ PASS                           │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ ✓ CHECK 3: LINE TOTAL VALIDATION          │
    │                                          │
    │ PO Total:      175,000,000 VND            │
    │ GRN Total:     175,000,000 VND            │
    │ Invoice Total: 175,000,000 VND            │
    │                                          │
    │ All match perfectly ✅                    │
    └──────────────────────────────────────────┘
         │
         ↓ (ALL PASS)
    ┌──────────────────────────────────────────┐
    │ ✅ GRN STATUS: MATCHED                    │
    │ AUTO APPROVAL TRIGGERED                  │
    │                                          │
    │ This enables:                             │
    │ • Auto approve Invoice                    │
    │ • Schedule Payment                        │
    │ • Trigger KPI Calculation                │
    └──────────────────────────────────────────┘


    EXCEPTION SCENARIO
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ ⚠️  QUANTITY MISMATCH                     │
    │                                          │
    │ PO Qty:    5 units                        │
    │ GRN Qty:   4 units (RECEIVED LESS)       │
    │                                          │
    │ Variance: 20% (4/5)                       │
    │ Tolerance: ±2%                            │
    │ Result: ❌ FAIL (20% > 2%)                │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ ⚠️  GRN STATUS: EXCEPTION_REVIEW          │
    │ MANUAL APPROVAL REQUIRED                 │
    │                                          │
    │ Notify:                                   │
    │ • Procurement Manager                    │
    │ • Warehouse Supervisor                   │
    │ • Supplier                                │
    │                                          │
    │ Options:                                  │
    │ 1. Accept (1 unit short, adjust PO)      │
    │ 2. Reject (request redelivery)            │
    │ 3. Return partial (renegotiate)           │
    └──────────────────────────────────────────┘
```

---

## 💰 CHI TIẾT PAYMENT FLOW

```
    AFTER INVOICE APPROVED
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ 📋 PAYMENT RECORD CREATED                 │
    │                                          │
    │ Payment Number: PAY-2026-001              │
    │ Amount: 175,000,000 VND                   │
    │ Status: SCHEDULED                         │
    │ Scheduled Date: 7 days from now           │
    │                                          │
    │ 🤖 Add to BullMQ Job Queue                │
    │    Job will execute on scheduled date     │
    └──────────────────────────────────────────┘
         │
         ↓ (WAIT 7 DAYS)
         │ [Job remains in queue]
         │
         ↓ (SCHEDULED DATE REACHED)
    ┌──────────────────────────────────────────┐
    │ 🤖 BullMQ JOB TRIGGERED                   │
    │ execute-payment job                       │
    │                                          │
    │ Calls: PaymentService.executePayment()   │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ 🏦 BANKING SERVICE PROCESS                │
    │                                          │
    │ Recipient:                                │
    │   Bank: Vietcombank                       │
    │   Account: 1234567890                     │
    │   Name: FPT Shop Co., Ltd                 │
    │                                          │
    │ Transfer Details:                         │
    │   Amount: 175,000,000 VND                 │
    │   Description: Payment Invoice-001        │
    │   Status: IN_PROGRESS                     │
    └──────────────────────────────────────────┘
         │
         ↓ (BANK PROCESSING)
         │ [Real bank transfer via API]
         │
         ↓ (SUCCESS RESPONSE)
    ┌──────────────────────────────────────────┐
    │ ✅ TRANSFER COMPLETED                     │
    │                                          │
    │ Transaction Reference:                    │
    │   TXN-ID: TXN-2026-ABC123                 │
    │   Timestamp: 2026-04-13 15:30             │
    │   Status: SUCCESS                         │
    │                                          │
    │ Payment Evidence:                         │
    │   Receipt number saved                    │
    │   Bank slip stored                        │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ 💰 PAYMENT RECORD UPDATED                 │
    │                                          │
    │ Status: COMPLETED                         │
    │ Completed At: 2026-04-13 15:30            │
    │ Transaction Ref: TXN-2026-ABC123          │
    │                                          │
    │ 🤖 Emit Event: 'payment.completed'        │
    │    → Trigger KPI Calculation              │
    │    → Send confirmation to Supplier        │
    │    → Update Financial Records             │
    └──────────────────────────────────────────┘
```

---

## 📊 CHI TIẾT KPI CALCULATION

```
    AFTER PAYMENT COMPLETED
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ 📊 KPI CALCULATION TRIGGERED              │
    │                                          │
    │ Supplier: FPT Shop                        │
    │ Quarter: 2026 Q2                          │
    │ Calculation Date: 2026-04-13              │
    │                                          │
    │ 🤖 EventEmitter.emit('payment.completed')│
    │    → KPICalculatorService.calculate()     │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ 1️⃣ ON-TIME DELIVERY (Weight: 25%)        │
    │                                          │
    │ Formula:                                  │
    │ (POs delivered on time / Total POs) × 100│
    │                                          │
    │ Data for Q2:                              │
    │  • Total POs: 10                          │
    │  • On-Time: 9                             │
    │  • Late: 1                                │
    │                                          │
    │ Score: (9/10) × 100 = 90%                 │
    │ Points: 90% × 25% = 22.5 points           │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ 2️⃣ QUALITY SCORE (Weight: 20%)            │
    │ (3-Way Matching Success Rate)             │
    │                                          │
    │ Formula:                                  │
    │ (Perfect GRNs / Total GRNs) × 100         │
    │                                          │
    │ Data for Q2:                              │
    │  • Total GRNs: 10                         │
    │  • MATCHED: 9                             │
    │  • EXCEPTION_REVIEW: 1                    │
    │                                          │
    │ Score: (9/10) × 100 = 90%                 │
    │ Points: 90% × 20% = 18.0 points           │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ 3️⃣ PRICE COMPETITIVENESS (Weight: 20%)   │
    │                                          │
    │ Formula:                                  │
    │ (Market Avg Price / Supplier Avg) × 100  │
    │                                          │
    │ Data for Q2:                              │
    │  • Supplier Avg Price/Item: 35,000,000   │
    │  • Market Avg Price/Item: 36,500,000     │
    │  • Ratio: (36.5M / 35M) × 100 = 104%    │
    │                                          │
    │ Score: Cap at 100% = 100%                 │
    │ Points: 100% × 20% = 20.0 points          │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ 4️⃣ INVOICE ACCURACY (Weight: 15%)         │
    │                                          │
    │ Formula:                                  │
    │ (Approved on 1st review / Total) × 100   │
    │                                          │
    │ Data for Q2:                              │
    │  • Total Invoices: 10                     │
    │  • 1st Review Approved: 9                 │
    │  • Exception Review: 1                    │
    │                                          │
    │ Score: (9/10) × 100 = 90%                 │
    │ Points: 90% × 15% = 13.5 points           │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ 5️⃣ RESPONSIVENESS (Weight: 10%)           │
    │ (RFQ Response Time - SLA: 24 hours)       │
    │                                          │
    │ Formula:                                  │
    │ (Quotes within SLA / Total Quotes) × 100 │
    │                                          │
    │ Data for Q2:                              │
    │  • Total RFQs: 5                          │
    │  • Within 24h: 5                          │
    │  • Late: 0                                │
    │                                          │
    │ Score: (5/5) × 100 = 100%                 │
    │ Points: 100% × 10% = 10.0 points          │
    └──────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────┐
    │ 6️⃣ ORDER FULFILLMENT (Weight: 10%)        │
    │                                          │
    │ Formula:                                  │
    │ (Items Fulfilled / Total Items) × 100    │
    │                                          │
    │ Data for Q2:                              │
    │  • Total Items: 50                        │
    │  • Fulfilled: 49                          │
    │  • Partial/Missing: 1                     │
    │                                          │
    │ Score: (49/50) × 100 = 98%                │
    │ Points: 98% × 10% = 9.8 points            │
    └──────────────────────────────────────────┘
         │
         ↓ (CALCULATE TOTAL SCORE)
    ┌──────────────────────────────────────────┐
    │ 📊 WEIGHTED SCORE CALCULATION             │
    │                                          │
    │ On-Time Delivery:        22.5 points      │
    │ + Quality Score:         18.0 points      │
    │ + Price Competitiveness: 20.0 points      │
    │ + Invoice Accuracy:      13.5 points      │
    │ + Responsiveness:        10.0 points      │
    │ + Order Fulfillment:      9.8 points      │
    │ ─────────────────────────────────────     │
    │ TOTAL SCORE:             93.8 points      │
    │ = 93.8% ✨                                │
    └──────────────────────────────────────────┘
         │
         ↓ (ASSIGN TIER)
    ┌──────────────────────────────────────────┐
    │ 🏆 SUPPLIER TIER ASSIGNMENT               │
    │                                          │
    │ Score: 93.8%                              │
    │                                          │
    │ Tier Scale:                               │
    │ • GOLD: ≥ 85% ✅ ← ASSIGNED              │
    │ • SILVER: 70-85%                          │
    │ • BRONZE: < 70%                           │
    │                                          │
    │ 🥇 Assigned Tier: GOLD                    │
    │ 🎖️  Performance: EXCELLENT                │
    └──────────────────────────────────────────┘
         │
         ↓ (SAVE & NOTIFY)
    ┌──────────────────────────────────────────┐
    │ 🏆 SUPPLIER EVALUATION COMPLETED          │
    │                                          │
    │ Status: COMPLETED                         │
    │ Period: 2026 Q2                           │
    │ Final Score: 93.8%                        │
    │ Assigned Tier: GOLD 🥇                    │
    │ Saved at: 2026-04-13 16:00                │
    │                                          │
    │ 📧 Email sent to Supplier (Congratulations)│
    │ 📊 Dashboard updated                      │
    │ 📋 Report generated                       │
    └──────────────────────────────────────────┘
```

---

## 📊 SO SÁNH FLOW 1 vs FLOW 2

```
┌──────────────────────────────────────────────────┐
│          FLOW 1: STABLE PRODUCTS                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  Input           Auto Process      Output        │
│  ┌────────┐      ┌────────┐        ┌────────┐   │
│  │5 Laptop│      │       │        │5 Laptop│   │
│  │35M each├─────►│ PO    ├───────►│35M each│   │
│  │Auto    │      │Direct │        │SAME    │   │
│  └────────┘      └────────┘        └────────┘   │
│                                                  │
│  Result: INPUT = OUTPUT (No Change)             │
│  Advantage: Fast, predictable                   │
│                                                  │
└──────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────┐
│        FLOW 2: MODERATE/VOLATILE PRODUCTS        │
├──────────────────────────────────────────────────┤
│                                                  │
│ Input          RFQ Request    Supplier Reply    │
│ ┌──────────┐   ┌────────┐     ┌────────────┐   │
│ │20 iPhone │   │FLEXIBLE│     │Option 1:20 │   │
│ │~42M each ├──►│FLEXIBLE├────►│Option 2:25 │   │
│ │Estimate  │   │Message │     │+AppleCare  │   │
│ └──────────┘   └────────┘     │Option 3:15 │   │
│                                │+10 Standard│   │
│                                └────────────┘   │
│                                      │          │
│                                      ↓          │
│                                New PR from     │
│                                Quote Selected  │
│                                      │          │
│                                      ↓          │
│  New PR       Auto Process      Final Output   │
│  ┌───────┐    ┌────────┐        ┌────────┐    │
│  │25 Pro │    │       │        │25 Pro  │    │
│  │+AppleCare│─►│ PO    ├───────►│+Apple  │    │
│  │900M   │    │From   │        │Care    │    │
│  │OFFICIAL│   │NewPR  │        │900M    │    │
│  └───────┘    └────────┘        └────────┘    │
│                                                  │
│  Result: INPUT ≠ OUTPUT (Changed by negotiation)│
│  Advantage: Optimized, tailored solution       │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 📚 TÓMLẠI TRẠNG THÁI DOCUMENT

```
┌────────────┬─────────────┬──────────┬────────────┐
│  Document  │ Start State │Processing│ End State  │
├────────────┼─────────────┼──────────┼────────────┤
│ PR         │ DRAFT       │ Manual   │ APPROVED   │
│ PO (S)     │ DRAFT       │ Auto     │ CONFIRMED  │
│ PO (M/V)   │ DRAFT       │ Manual   │ CONFIRMED  │
│ RFQ        │ DRAFT       │ Manual   │ SENT       │
│ Quote      │ PENDING     │ Manual   │ SELECTED   │
│ GRN        │ CREATED     │ Auto/Man │ MATCHED    │
│ Invoice    │ RECEIVED    │ Auto/Man │ APPROVED   │
│ Payment    │ SCHEDULED   │ Auto     │ COMPLETED  │
│ KPI        │ CALCULATING │ Auto     │ COMPLETED  │
│ Evaluation │ PENDING     │ Auto     │ COMPLETED  │
└────────────┴─────────────┴──────────┴────────────┘

Legend:
S = STABLE
M/V = MODERATE/VOLATILE
Auto = Tự động (hệ thống xử lý)
Manual = Thủ công (người dùng xác nhận)
```

---

## ✅ AUTO vs MANUAL PROCESSING

### 🤖 Những gì HỆ THỐNG làm TỰ ĐỘC (AUTO)

```
✅ 1. Create PO từ PR (STABLE only)
   - AutomationService.checkAndCreatePO()
   - Tự động tạo Draft PO

✅ 2. Confirm PO (STABLE only)
   - AutomationService.confirmPOForStable()
   - Tự động chuyển CONFIRMED

✅ 3. Validate 3-Way Matching
   - ReceivingService.validate3WayMatch()
   - Kiểm tra Qty ±2%, Price ±1%

✅ 4. Auto Approve GRN (STABLE + PASS)
   - Nếu pass tolerance → status MATCHED
   - Trigger invoice auto-approval

✅ 5. Auto Approve Invoice (Match GRN)
   - InvoiceService.autoApproveInvoice()
   - Nếu match với GRN/PO → APPROVED

✅ 6. Schedule & Execute Payment
   - PaymentService.schedulePayment()
   - BullMQ job execute khi đến date

✅ 7. Calculate KPI
   - KPICalculatorService.calculate()
   - Tính 6 metrics tự động

✅ 8. Assign Supplier Tier
   - Dựa trên KPI score
   - GOLD/SILVER/BRONZE tự động assign
```

### 👤 Những gì NGƯỜI DÙNG phải làm (MANUAL)

```
👤 1. Approve PR (Manager/Director)
   - Review PR reason, budget
   - Phê duyệt hoặc từ chối

👤 2. Send RFQ to Suppliers (Procurement)
   - Choose suppliers to quote
   - Gửi yêu cầu

👤 3. Select Winning Quote (Procurement)
   - Compare supplier options
   - Select best value/quality
   - Create new PR if needed

👤 4. Confirm PO (MODERATE/VOLATILE)
   - Manual confirmation for negotiated items
   - Verify final price/qty

👤 5. Override GRN Exception (Manager)
   - If 3-way matching fails
   - Investigate & approve/reject
   - Adjust if necessary

👤 6. Override Invoice Exception (Finance)
   - If invoice doesn't match GRN/PO
   - Investigate discrepancy
   - Approve with notes

👤 7. Review KPI Results (Management)
   - See supplier performance
   - Verify tier assignment
   - Plan supplier development
```

---

**Tài liệu được phát triển bởi:** Nguyễn Đình Nam  
**Liên hệ:** nguyendinhnam241209@gmail.com | 0908651852  
**Ngày cập nhật:** April 5, 2026
