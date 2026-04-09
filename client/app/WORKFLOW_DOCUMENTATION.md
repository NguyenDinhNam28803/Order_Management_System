# 📊 BÁO CÁO FLOW DỮ LIỆU - PROCUREMENT SYSTEM

## Tổng quan hệ thống

Hệ thống ProcureSmart ERP quản lý quy trình mua hàng từ yêu cầu nội bộ đến thanh toán nhà cung cấp, với 3 nhóm người dùng chính:
- **Người yêu cầu (REQUESTER)**: Tạo PR, theo dõi đơn hàng
- **Bộ phận phê duyệt (APPROVER)**: Phê duyệt ngân sách
- **Bộ phận Procurement (PROCUREMENT)**: Tạo RFQ, đánh giá báo giá, tạo PO
- **Nhà cung cấp (SUPPLIER)**: Nhận RFQ, gửi báo giá, xử lý PO

---

## 1️⃣ FLOW YÊU CẦU MUA HÀNG (Purchase Request)

### 📍 Trang: `/pr` (PR Page)

**Người thực hiện:** REQUESTER (nhân viên các phòng ban)

| Bước | Hành động | Trạng thái dữ liệu | Người thực hiện |
|------|-----------|-------------------|-----------------|
| 1 | Tạo PR mới | `status: "DRAFT"` | REQUESTER |
| 2 | Lưu nháp | `status: "DRAFT"` | REQUESTER |
| 3 | Gửi phê duyệt | `status: "PENDING_APPROVAL"` | REQUESTER |
| 4 | Chờ duyệt | `status: "PENDING_APPROVAL"` | - |
| 5 | Phê duyệt/Từ chối | `status: "APPROVED"` hoặc `"REJECTED"` | DEPT_APPROVER/DIRECTOR |

### 📍 Trang: `/approvals` (Approvals Page)

**Người thực hiện:** DEPT_APPROVER, DIRECTOR

| Bước | Hành động | Trạng thái dữ liệu | API Endpoint |
|------|-----------|-------------------|--------------|
| 1 | Xem danh sách PR chờ duyệt | Workflow status: `"PENDING"` | `GET /approvals` |
| 2 | Phê duyệt PR | `action: "APPROVE"` | `POST /approvals/:id/action` |
| 3 | Từ chối PR | `action: "REJECT"` | `POST /approvals/:id/action` |
| 4 | Yêu cầu thêm thông tin | `action: "MORE_INFO"` | `POST /approvals/:id/action` |

**Dữ liệu đi qua:**
- PR ID → Workflow ID → Approval Action → PR Status Update

---

## 2️⃣ FLOW REQUEST FOR QUOTATION (RFQ)

### 📍 Trang: `/procurement/rfq/create` (Create RFQ Page)

**Người thực hiện:** PROCUREMENT, PLATFORM_ADMIN

| Bước | Hành động | Trạng thái dữ liệu | API Endpoint |
|------|-----------|-------------------|--------------|
| 1 | Chọn PR đã duyệt | PR `status: "APPROVED"` | - |
| 2 | Chọn nhà cung cấp | Suppliers selected | `GET /organizations` |
| 3 | AI gợi ý nhà cung cấp | `matchScore, reasons` | `POST /ai/rag-query` |
| 4 | Thiết lập deadline | `deadline: Date` | - |
| 5 | Tạo và gửi RFQ | `status: "SENT"` | `POST /rfq` |

**Dữ liệu đi qua:**
```
PR (APPROVED) 
  → RFQ Creation (DRAFT)
    → Select Suppliers
      → AI Suggestions (RAG Query)
        → Send RFQ (SENT to suppliers)
```

### 📍 Trang: `/supplier/rfq` (Supplier RFQ Page)

**Người thực hiện:** SUPPLIER

| Bước | Hành động | Trạng thái dữ liệu | API Endpoint |
|------|-----------|-------------------|--------------|
| 1 | Nhận RFQ mới | `status: "SENT"` | `GET /rfq/my-supplier` |
| 2 | Xem chi tiết RFQ | Items, quantities | - |
| 3 | Nhập giá và lead time | Quote data | - |
| 4 | Gửi báo giá (Quotation) | `status: "SUBMITTED"` | `POST /quotations` |

**Dữ liệu đi qua:**
```
RFQ (SENT)
  → Supplier Portal
    → View RFQ
      → Input Prices
        → Create Quotation (SUBMITTED)
```

---

## 3️⃣ FLOW QUOTATION & AI ANALYSIS

### 📍 Trang: `/procurement/quotations` (Quotation Management)

**Người thực hiện:** PROCUREMENT, PLATFORM_ADMIN

| Bước | Hành động | Trạng thái dữ liệu | API Endpoint |
|------|-----------|-------------------|--------------|
| 1 | Xem RFQ và báo giá | `rfqs[]`, `quotations[]` | `GET /rfq`, `GET /quotations/:rfqId` |
| 2 | AI phân tích báo giá | `aiScore`, `aiAnalysis` | `POST /quotations/:id/analyze` |
| 3 | Xem đánh giá AI | `score`, `assessment`, `pros[]`, `cons[]` | - |
| 4 | Chọn nhà thắng thầu | `status: "AWARDED"` | `POST /quotations/:id/award` |
| 5 | Từ chối các báo giá khác | `status: "REJECTED"` | Auto-reject |

**Dữ liệu AI Analysis:**
```typescript
interface AIAnalysisResult {
  score: number;           // 0-100
  assessment: string;      // Đánh giá tổng quan
  pros: string[];          // Ưu điểm
  cons: string[];          // Nhược điểm
  recommendation: "ACCEPT" | "REJECT" | "NEGOTIATE";
}
```

**Flow dữ liệu:**
```
Multiple Quotations (SUBMITTED)
  → Auto AI Analysis
    → Compare Scores
      → Award Winner (AWARDED)
        → Others Rejected
```

---

## 4️⃣ FLOW PURCHASE ORDER (PO)

### 📍 Trang: `/po` (PO Page) - Procurement Side

**Người thực hiện:** PROCUREMENT

| Bước | Hành động | Trạng thái dữ liệu | API Endpoint |
|------|-----------|-------------------|--------------|
| 1 | Tạo PO từ báo giá thắng | `status: "DRAFT"` | `POST /po` |
| 2 | Review PO chi tiết | Terms, items, pricing | - |
| 3 | Gửi PO cho nhà cung cấp | `status: "SENT"` | `PATCH /po/:id/status` |

### 📍 Trang: `/supplier/po` (Supplier PO Page)

**Người thực hiện:** SUPPLIER

| Bước | Hành động | Trạng thái dữ liệu | API Endpoint |
|------|-----------|-------------------|--------------|
| 1 | Nhận PO mới | `status: "SENT"` | `GET /po/my-supplier` |
| 2 | Xác nhận PO | `status: "ACKNOWLEDGED"` | `PATCH /po/:id/acknowledge` |
| 3 | Giao hàng | `status: "SHIPPED"` | `PATCH /po/:id/ship` |
| 4 | Xác nhận hoàn thành | `status: "DELIVERED"` | `PATCH /po/:id/deliver` |
| 5 | Từ chối PO (nếu cần) | `status: "REJECTED"` | `PATCH /po/:id/reject` |

**Flow dữ liệu PO:**
```
Quotation (AWARDED)
  → Create PO (DRAFT)
    → Send to Supplier (SENT)
      → Supplier Acknowledge (ACKNOWLEDGED)
        → Ship (SHIPPED)
          → Deliver (DELIVERED)
            → Invoice Created
```

---

## 5️⃣ FLOW INVOICE & PAYMENT

### 📍 Trang: `/supplier/invoice` (Supplier Invoice)

**Người thực hiện:** SUPPLIER

| Bước | Hành động | Trạng thái dữ liệu | API Endpoint |
|------|-----------|-------------------|--------------|
| 1 | Tạo hóa đơn từ PO đã giao | `status: "PENDING"` | `POST /invoices` |
| 2 | Upload chứng từ | Attachments | `POST /upload` |
| 3 | Gửi hóa đơn | `status: "SUBMITTED"` | `PATCH /invoices/:id/submit` |

### 📍 Trang: `/finance/invoices` hoặc `/invoices`

**Người thực hiện:** FINANCE, PROCUREMENT

| Bước | Hành động | Trạng thái dữ liệu | API Endpoint |
|------|-----------|-------------------|--------------|
| 1 | Nhận hóa đơn chờ duyệt | `status: "SUBMITTED"` | `GET /invoices` |
| 2 | Kiểm tra 3-way matching | PO + GRN + Invoice | `GET /grn/:poId` |
| 3 | Phê duyệt hóa đơn | `status: "APPROVED"` | `PATCH /invoices/:id/approve` |
| 4 | Từ chối hóa đơn | `status: "REJECTED"` | `PATCH /invoices/:id/reject` |
| 5 | Lập kế hoạch thanh toán | `paymentSchedule: {}` | `POST /payments/schedule` |

**Flow 3-Way Matching:**
```
PO (DELIVERED)
  → GRN (Goods Received)
    → Invoice Created (SUBMITTED)
      → 3-Way Match Check
        → Approved (APPROVED)
          → Payment Scheduled
            → Paid (PAID)
```

---

## 6️⃣ FLOW SUPPLIER PORTAL (B2B)

### 📍 Trang: `/supplier` (Supplier Dashboard)

**Người thực hiện:** SUPPLIER

**Dữ liệu hiển thị:**

| Widget | Dữ liệu | API Source | Trạng thái |
|--------|---------|------------|------------|
| RFQ chờ báo giá | `count(status: "SENT")` | `GET /rfq/my-supplier` | Real-time |
| Đơn hàng đang xử lý | `count(status: "ACKNOWLEDGED", "SHIPPED")` | `GET /po/my-supplier` | Real-time |
| Tổng giá trị PO | `sum(total)` | `GET /po/my-supplier` | Real-time |
| Hóa đơn chờ thanh toán | `count(status: "APPROVED", not paid)` | `GET /invoices/my-supplier` | Real-time |
| Điểm hiệu suất | `overallScore` | `GET /supplier/:id/kpi-report` | AI/System |

**Flow dữ liệu vào Supplier Portal:**
```
Database
  → API Endpoints
    → ProcurementContext (fetch functions)
      → Supplier Portal (useEffect fetch)
        → State (kpiData, myRFQs, myPOs)
          → UI Render
```

---

## 7️⃣ FLOW KPI & SUPPLIER EVALUATION

### 📍 Trang: `/supplier/[id]/kpi-evaluation`

**Người thực hiện:** PROCUREMENT, AI System

| Bước | Hành động | Trạng thái dữ liệu | API Endpoint |
|------|-----------|-------------------|--------------|
| 1 | Fetch lịch sử đánh giá | `evaluations[]` | `GET /supplier/:id/kpi-report` |
| 2 | Chạy đánh giá mới | Calculating... | `POST /supplier/:id/evaluate-kpi` |
| 3 | AI phân tích hiệu suất | `metrics[]` | AI Analysis |
| 4 | Hiển thị kết quả | `overallScore`, `metrics[]` | - |

**Metrics được đánh giá:**
- Quality Score (Chất lượng)
- Delivery Score (Giao hàng đúng hạn)
- Price Score (Giá cả cạnh tranh)
- Response Score (Phản hồi nhanh)

---

## 📋 BẢNG TỔNG HỢP TRẠNG THÁI DỮ LIỆU

### Purchase Request (PR)
| Trạng thái | Ý nghĩa | Người thực hiện tiếp theo |
|------------|---------|---------------------------|
| `DRAFT` | Nháp, chưa gửi | REQUESTER |
| `PENDING_APPROVAL` | Chờ phê duyệt | DEPT_APPROVER/DIRECTOR |
| `APPROVED` | Đã duyệt, có thể tạo RFQ | PROCUREMENT |
| `REJECTED` | Bị từ chối | REQUESTER (sửa lại) |
| `PENDING_PROCUREMENT` | Chuyển cho procurement | PROCUREMENT |

### RFQ
| Trạng thái | Ý nghĩa | Người thực hiện tiếp theo |
|------------|---------|---------------------------|
| `DRAFT` | Đang tạo | PROCUREMENT |
| `SENT` | Đã gửi NCC | SUPPLIER |
| `OPEN` | Mở nhận báo giá | SUPPLIER |
| `CLOSED` | Đóng nhận báo giá | PROCUREMENT |
| `CANCELLED` | Đã hủy | - |

### Quotation
| Trạng thái | Ý nghĩa | Người thực hiện tiếp theo |
|------------|---------|---------------------------|
| `DRAFT` | Nháp báo giá | SUPPLIER |
| `SUBMITTED` | Đã gửi | PROCUREMENT |
| `UNDER_REVIEW` | Đang xem xét | PROCUREMENT |
| `AWARDED` | Thắng thầu | PROCUREMENT (tạo PO) |
| `REJECTED` | Bị từ chối | - |

### Purchase Order (PO)
| Trạng thái | Ý nghĩa | Người thực hiện tiếp theo |
|------------|---------|---------------------------|
| `DRAFT` | Nháp PO | PROCUREMENT |
| `SENT` | Đã gửi NCC | SUPPLIER |
| `ACKNOWLEDGED` | NCC đã xác nhận | SUPPLIER (giao hàng) |
| `SHIPPED` | Đã giao hàng | WAREHOUSE (nhận hàng) |
| `DELIVERED` | Đã nhận hàng | SUPPLIER (tạo invoice) |
| `COMPLETED` | Hoàn thành | FINANCE |
| `CANCELLED` | Đã hủy | - |
| `REJECTED` | Bị từ chối | PROCUREMENT |

### Invoice
| Trạng thái | Ý nghĩa | Người thực hiện tiếp theo |
|------------|---------|---------------------------|
| `PENDING` | Chờ gửi | SUPPLIER |
| `SUBMITTED` | Đã gửi | FINANCE |
| `UNDER_REVIEW` | Đang kiểm tra | FINANCE |
| `APPROVED` | Đã duyệt | FINANCE (thanh toán) |
| `REJECTED` | Bị từ chối | SUPPLIER (sửa lại) |
| `PAID` | Đã thanh toán | - |

---

## 🔄 TÓM TẮT LUỒNG DỮ LIỆU CHÍNH

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROCUREMENT FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

REQUESTER                    APPROVER                  PROCUREMENT
    │                           │                           │
    ▼                           ▼                           ▼
┌─────────┐              ┌──────────┐              ┌─────────────────┐
│ Create  │──────────────│ Approve  │──────────────│   Create RFQ    │
│   PR    │              │    PR    │              │  (Select NCC)   │
│ (DRAFT) │              │(APPROVED)│              │   AI Suggest    │
└────┬────┘              └──────────┘              └────────┬────────┘
     │                                                      │
     │                                                      ▼
     │                                              ┌─────────────────┐
     │                                              │   Send RFQ      │
     │                                              │  (SENT)         │
     │                                              └────────┬────────┘
     │                                                       │
     │                              SUPPLIER                 │
     │                                 │                     │
     │                                 ▼                     │
     │                         ┌──────────────┐              │
     │                         │  Receive RFQ │              │
     │                         │   (SENT)     │              │
     │                         └──────┬───────┘              │
     │                                │                    │
     │                                ▼                    │
     │                         ┌──────────────┐            │
     │                         │ Submit Quote │            │
     │                         │ (SUBMITTED)  │            │
     │                         └──────┬───────┘            │
     │                                │                    │
     │                                │                    ▼
     │                                │           ┌─────────────────┐
     │                                │           │  AI Analyze     │
     │                                │           │  Quotations     │
     │                                │           └────────┬────────┘
     │                                │                    │
     │                                │                    ▼
     │                                │           ┌─────────────────┐
     │                                │           │  Award Winner   │
     │                                │           │  (AWARDED)      │
     │                                │           └────────┬────────┘
     │                                │                    │
     │                                │                    ▼
     │                                │           ┌─────────────────┐
     │                                │           │   Create PO     │
     │                                │           │    (SENT)       │
     │                                │           └────────┬────────┘
     │                                │                    │
     │                                │                    │
     │                                │                    ▼
     │                                │           ┌─────────────────┐
     │                                │           │  Acknowledge    │
     │                                └──────────▶│   (ACKNOWLEDGED)│
     │                                            └────────┬────────┘
     │                                                     │
     │                                                     ▼
     │                                            ┌─────────────────┐
     │                                            │     Ship        │
     │                                            │   (SHIPPED)     │
     │                                            └────────┬────────┘
     │                                                     │
     │                                                     ▼
     │                                            ┌─────────────────┐
     │                                            │    Deliver      │
     │                                            │  (DELIVERED)    │
     │                                            └────────┬────────┘
     │                                                     │
     │                                                     │
     │                              SUPPLIER               │
     │                                 │                   │
     │                                 ▼                   │
     │                         ┌──────────────┐            │
     │                         │Create Invoice│            │
     │                         │  (SUBMITTED) │            │
     │                         └──────┬───────┘            │
     │                                │                    │
     │                                └────────────────────┤
     │                                                     │
     │                              FINANCE                │
     │                                 │                   │
     │                                 ▼                   │
     │                         ┌──────────────┐            │
     └────────────────────────▶│  3-Way Match │            │
                               │  (APPROVED)  │            │
                               └──────┬───────┘            │
                                      │                   │
                                      ▼                   │
                               ┌──────────────┐            │
                               │    Pay       │            │
                               │   (PAID)     │            │
                               └──────────────┘            │
                                                          │
                               WAREHOUSE                   │
                                  │                       │
                                  ▼                       │
                          ┌──────────────┐                │
                          │  GRN Create  │───────────────▶│
                          │  (DELIVERED) │                │
                          └──────────────┘                │
                                                          │
```

---

## 📝 GHI CHÚ QUAN TRỌNG

### Dữ liệu thật vs Mẫu:

| Component | Dữ liệu Thật | Dữ liệu Mẫu (Mock) |
|-----------|-------------|-------------------|
| PR List | ✅ API `/prs` | ❌ |
| RFQ List | ✅ API `/rfq` | ❌ |
| Quotations | ✅ API `/quotations` | ❌ |
| AI Analysis | ✅ AI Service | ❌ |
| PO List | ✅ API `/po` | ❌ |
| Invoice List | ✅ API `/invoices` | ❌ |
| **KPI Score** | ✅ API `/kpi-report` | ⚠️ Fallback 0 |
| **Activities** | ⚠️ Mock data | ✅ Local state |
| **Notifications** | ⚠️ Mock data | ✅ Local state |

### API Endpoints chính:

```typescript
// ProcurementContext.tsx
fetchMySupplierRFQs()    → GET /rfq/my-supplier
fetchSupplierKPIReport() → GET /supplier/:id/kpi-report
evaluateSupplierKPI()    → POST /supplier/:id/evaluate-kpi
fetchQuotationsByRfq()   → GET /quotations/rfq/:rfqId
analyzeQuotationWithAI() → POST /quotations/:id/analyze
awardQuotation()         → POST /quotations/:id/award
actionApproval()         → POST /approvals/:id/action
```

### Authentication Flow:
```
Login (/login)
  → POST /auth/login
    → Token saved to Cookie
      → User saved to Cookie
        → Redirect based on role:
          - SUPPLIER → /supplier
          - Others → /
```

---

## ✅ KIỂM TRA TÍNH ĐẦY ĐỦ

### Các trang đã có:
- ✅ `/pr` - Tạo và quản lý PR
- ✅ `/approvals` - Phê duyệt PR
- ✅ `/procurement/rfq/create` - Tạo RFQ
- ✅ `/procurement/quotations` - Quản lý báo giá + AI
- ✅ `/po` - Tạo và quản lý PO
- ✅ `/supplier` - Supplier Portal Dashboard
- ✅ `/supplier/rfq` - Supplier xem RFQ và gửi báo giá
- ✅ `/supplier/po` - Supplier xử lý PO
- ✅ `/supplier/invoice` - Supplier tạo hóa đơn
- ✅ `/grn` - Goods Receipt Note
- ✅ `/invoices` - Quản lý hóa đơn

### Các tính năng AI:
- ✅ AI gợi ý nhà cung cấp (RAG)
- ✅ AI phân tích báo giá
- ✅ AI đánh giá KPI nhà cung cấp

### Còn thiếu/Tiếp tục phát triển:
- ⚠️ Real-time notifications (WebSocket)
- ⚠️ Advanced reporting dashboard
- ⚠️ Multi-language support complete
- ⚠️ Mobile responsive optimization

---

*Document generated: 2024-01-09*
*System: ProcureSmart ERP*
*Version: 1.0*
