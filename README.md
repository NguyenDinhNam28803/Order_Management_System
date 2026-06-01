# Smart E-Procurement & Order Management System (OMS)

Hệ thống quản trị mua sắm tập trung (E-Procurement) toàn diện, tích hợp Trí tuệ nhân tạo (AI) để tối ưu hóa quy trình từ yêu cầu mua sắm đến thanh toán (**Procure-to-Pay / P2P**). Dự án thiết kế theo kiến trúc module mạnh mẽ, khả năng tự động hóa cao và giao diện người dùng hiện đại theo chuẩn Enterprise ERP.

---

## Mục lục

1. [Kiến trúc Dự án](#kiến-trúc-dự-án)
2. [Công nghệ Sử dụng](#công-nghệ-sử-dụng)
3. [Luồng Nghiệp vụ Tổng thể (P2P)](#luồng-nghiệp-vụ-tổng-thể-p2p)
4. [Sơ đồ Chuyển trạng thái Chứng từ](#sơ-đồ-chuyển-trạng-thái-chứng-từ)
5. [Vòng đời Ngân sách](#vòng-đời-ngân-sách)
6. [Hai Luồng Thu mua (Flow 1 & 2)](#hai-luồng-thu-mua-flow-1--flow-2)
7. [Ma trận Phê duyệt Động](#ma-trận-phê-duyệt-động)
8. [Danh mục Module Backend](#danh-mục-module-backend)
9. [Vai trò Người dùng & Quyền hạn](#vai-trò-người-dùng--quyền-hạn)
10. [Tính năng AI & Tự động hóa](#tính-năng-ai--tự-động-hóa)
11. [Cài đặt & Phát triển](#cài-đặt--phát-triển)
12. [Triển khai với Docker](#triển-khai-với-docker)
13. [Biến môi trường](#biến-môi-trường)
14. [Cấu trúc Frontend](#cấu-trúc-frontend)

---

## Kiến trúc Dự án

```
Order_management_system/
├── client/              # Frontend — Next.js 16 (React 19) + Tailwind CSS 4
│   ├── app/
│   │   ├── context/     # ProcurementContext — global state + API layer
│   │   ├── components/  # Shared UI (ERPTable, StatsCard, Charts, ...)
│   │   ├── types/       # api-types.ts — tất cả interface TypeScript
│   │   ├── utils/       # formatVND, formatDate, formatDateTime, ...
│   │   ├── finance/     # Pages: dashboard, matching, invoices, budgets
│   │   ├── manager/     # Pages: po-approvals, spend-tracking, budget-planning
│   │   ├── warehouse/   # Pages: dashboard, grn
│   │   ├── procurement/ # Pages: prs (procurement officer view)
│   │   ├── supplier/    # Pages: dashboard, po, invoice, rfq
│   │   ├── reports/     # Pages: spend analytics
│   │   ├── po/          # Purchase Order list & detail
│   │   ├── pr/          # Purchase Request list
│   │   ├── payments/    # Payment management
│   │   └── sourcing/    # RFQ creation & management
│   └── public/
└── server/              # Backend — NestJS + Prisma + PostgreSQL
    ├── src/
    │   ├── common/      # Guards, decorators, automation service, pipes
    │   ├── prisma/      # PrismaService + schema.prisma
    │   └── [modules]/   # 38 business modules (xem bên dưới)
    └── prisma/
        └── schema.prisma
```

---

## Công nghệ Sử dụng

### Frontend
| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| Next.js | 16 | App Router, SSR/CSR hybrid |
| React | 19 | UI framework |
| Tailwind CSS | 4 | Utility-first styling |
| Lucide React | latest | Icon system |
| React Hook Form + Zod | latest | Form validation |
| js-cookie | latest | JWT token management |

### Backend
| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| NestJS | 10 | Module-based Node.js framework |
| Prisma | 5 | ORM — type-safe DB queries |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Cache & BullMQ queue backend |
| BullMQ | latest | Background job processing |
| Socket.io | latest | Real-time notifications |
| Google Generative AI | Gemini 1.5 | AI analysis & NL queries |
| Passport.js + JWT | latest | Authentication |
| Nodemailer | latest | Email notifications |
| Twilio | latest | SMS notifications |
| Bcrypt | latest | Password hashing |

---

## Luồng Nghiệp vụ Tổng thể (P2P)

### Sơ đồ tổng quan (Mermaid)

```mermaid
flowchart TD
    A([Requester tạo PR]) --> B{Kiểm tra ngân sách\ntheo Category + Cost Center}
    B -- Không đủ --> C[PR bị từ chối\nGiải phóng committedAmount]
    B -- Đủ ngân sách --> D[Soft Commit\ncộng vào committedAmount]
    D --> E[PR → PENDING_APPROVAL\nGửi cho Approver]

    E --> F{Phê duyệt đa cấp\nDept Approver → Director → CEO}
    F -- Bị từ chối --> G[PR → REJECTED\nGiải phóng committedAmount]
    F -- Tất cả duyệt --> H[PR → APPROVED]

    H --> I{Price Volatility\nRouting}
    I -- STABLE\nFlow 1 --> J[Tạo RFQ trực tiếp\nGửi email mời báo giá]
    I -- VOLATILE\nFlow 2 --> K[Tạo QuoteRequest\nThu thập giá thị trường]
    K --> K2[Tạo PR mới từ\ngiá đã thu thập]
    K2 --> J

    J --> L[Nhà cung cấp nộp\nQuotation qua Portal]
    L --> M[AI chấm điểm báo giá\nGiá 40% · Lead Time 30% · KPI 30%]
    M --> N[Buyer chọn Award\nNhà cung cấp thắng thầu]

    N --> O[Tạo PO\nCập nhật committedAmount]
    O --> P{Giá trị PO\n≥ 50 triệu?}
    P -- Có --> Q[Tự động tạo Contract]
    P -- Không --> R[Phát hành PO\nPO → ISSUED]
    Q --> R

    R --> S[Nhà cung cấp xác nhận\nPO → ACKNOWLEDGED]
    S --> T[AutomationService\nTạo GRN DRAFT tự động]

    T --> U[Warehouse nhận hàng\nKiểm tra QC]
    U --> V[GRN → CONFIRMED → POSTED]

    V --> W[Nhà cung cấp nộp\nInvoice]
    W --> X{3-Way Matching\nPO ↔ GRN ↔ Invoice}
    X -- Khớp hoàn toàn --> Y[Invoice → AUTO_APPROVED]
    X -- Có sai lệch --> Z[Invoice → EXCEPTION\nFinance xử lý thủ công]
    Y --> AA[Finance phê duyệt\nPayment]
    Z --> AA

    AA --> AB[Thực hiện thanh toán\nPayment → COMPLETED]
    AB --> AC[Hard Commit\ncommittedAmount → spentAmount]
    AC --> AD[Ghi AuditLog\nKhép kín vòng đời P2P]
```

### Mô tả từng bước

| Bước | Actor | Hành động | Kết quả tự động |
|------|-------|-----------|----------------|
| 1 | Requester | Tạo PR với danh sách items | Budget check by category + cost center |
| 2 | System | Ceiling check (L1/L2/L3) | Xác định cấp phê duyệt |
| 3 | Dept Approver / Director / CEO | Phê duyệt/từ chối | Nếu từ chối → giải phóng budget |
| 4 | AutomationService | Route PR → RFQ | Email mời báo giá gửi đến NCC |
| 5 | Supplier | Nộp quotation | AI scoring tự động |
| 6 | Procurement (Buyer) | Award quotation | PO tạo, budget cập nhật |
| 7 | Supplier | Xác nhận PO | GRN DRAFT tạo tự động |
| 8 | Warehouse | Nhận hàng + QC | GRN CONFIRMED |
| 9 | Supplier | Nộp Invoice | 3-way match tự động |
| 10 | Finance | Duyệt thanh toán | Hard commit, AuditLog |

---

## Sơ đồ Chuyển trạng thái Chứng từ

### Purchase Request (PR)

```
DRAFT
  └─► PENDING_APPROVAL  (khi submit)
        ├─► APPROVED          (tất cả cấp phê duyệt đồng ý)
        │     ├─► IN_SOURCING     (RFQ được tạo)
        │     ├─► PO_CREATED      (PO được tạo từ quotation)
        │     └─► COMPLETED       (PO được nhận hàng xong)
        └─► REJECTED          (bất kỳ cấp nào từ chối)
```

### Purchase Order (PO)

```
DRAFT
  └─► APPROVED        (Manager duyệt)
        └─► ISSUED    (Phát hành cho Supplier)
              └─► ACKNOWLEDGED  (Supplier xác nhận)
                    └─► SHIPPED     (Hàng đã gửi)
                          └─► INVOICED   (Invoice đã nộp)
                                └─► COMPLETED (3-way match OK, thanh toán xong)
```

### Goods Receipt Note (GRN)

```
DRAFT
  └─► INSPECTING   (Warehouse bắt đầu QC)
        └─► CONFIRMED  (QC pass, số lượng xác nhận)
              └─► POSTED     (Cập nhật vào tồn kho, khớp sổ sách)
```

### Invoice

```
SUBMITTED
  └─► AUTO_APPROVED   (3-way match tự động khớp)
  └─► EXCEPTION       (Có sai lệch → Finance xử lý)
        └─► PAYMENT_APPROVED   (Finance duyệt thủ công)
              └─► PAID         (Thanh toán hoàn thành)
```

### Payment

```
PENDING
  └─► PROCESSING   (Đang giải ngân)
        └─► COMPLETED  (Xác nhận thành công)
        └─► FAILED     (Lỗi → retry hoặc manual)
```

---

## Vòng đời Ngân sách

Hệ thống kiểm soát ngân sách 3 tầng theo chu kỳ (năm/quý):

```
BudgetAllocation (theo Category + CostCenter + Period)
│
├── allocatedAmount    ← Ngân sách được cấp ban đầu (kế hoạch)
│
├── committedAmount    ← SOFT COMMIT: cộng khi PR được duyệt
│   ↑ Tăng: PR/PO được duyệt, cộng giá trị PO
│   ↓ Giảm: PR bị từ chối, PO bị hủy → giải phóng
│
└── spentAmount        ← HARD COMMIT: cộng khi Payment COMPLETED
    ↑ Tăng: Thanh toán thực tế hoàn thành
    (committedAmount giảm tương ứng)

Công thức:
  Remaining = allocatedAmount - committedAmount - spentAmount
  Available = allocatedAmount - spentAmount  (toàn bộ đã chi)
```

### Budget Override

Khi `committedAmount + spentAmount > allocatedAmount`, hệ thống tạo `BudgetOverride` request:
- `PENDING` → `APPROVED` (Director/CEO duyệt) → Tiếp tục flow
- `PENDING` → `REJECTED` → PR không thể tiến hành

---

## Hai Luồng Thu mua (Flow 1 & Flow 2)

`AutomationService` định tuyến dựa trên thuộc tính `priceVolatility` của Category:

### Flow 1 — Giá ổn định (STABLE)

```
PR (APPROVED)
    │
    ▼
RFQ (OPEN) ──────── email invite ──────► Supplier Portal
    │
    ▼
Quotation submitted
    │
    ▼  [AI Scoring: Price 40% + Lead Time 30% + KPI 30%]
Buyer chọn Award
    │
    ▼
PO (ISSUED) ──────── email ──────────► Supplier
```

### Flow 2 — Giá biến động (VOLATILE)

```
PR (APPROVED)
    │
    ▼
QuoteRequest (thăm dò thị trường)
    │  Supplier báo giá sơ bộ
    ▼
PR mới được tạo với giá thực tế
    │  (restart từ bước Budget Check)
    ▼
[tiếp tục như Flow 1]
```

---

## Ma trận Phê duyệt Động

Ngưỡng phê duyệt mặc định (có thể cấu hình qua `system-config-module`):

| Mức | Ngưỡng giá trị PR | Approver |
|-----|-------------------|----------|
| L1 | ≤ 10,000,000 VND | Department Approver (Trưởng phòng) |
| L2 | ≤ 30,000,000 VND | + Director (Giám đốc) |
| L3 | ≤ 100,000,000 VND | + CEO |
| L4 | > 100,000,000 VND | CEO + Board |

**Luồng phê duyệt:**
1. `ApprovalModuleService.initiateWorkflow()` truy vấn `ApprovalMatrixRule`
2. Tạo `ApprovalStep` theo thứ tự cấp bậc
3. Mỗi Approver nhận notification (web + email)
4. Nếu tất cả approve → trigger `routePrApprovalFlow()`
5. Nếu bất kỳ reject → dừng workflow, giải phóng budget

**Delegation:** Người dùng có thể ủy quyền (`UserDelegation`) với thời hạn cụ thể khi vắng mặt.

---

## Danh mục Module Backend

### Nhóm Core & Admin

| Module | Chức năng |
|--------|-----------|
| `auth-module` | JWT auth, RBAC, login/refresh token |
| `user-module` | Quản lý hồ sơ người dùng, delegation |
| `organization-module` | Cấu trúc tổ chức: phòng ban, chi nhánh |
| `system-config-module` | Cấu hình toàn hệ thống, approval thresholds |
| `audit-module` | Ghi log mọi thay đổi dữ liệu |
| `external-token-module` | Token cho supplier portal (JWT riêng) |
| `admin-module` | Admin panel: seed data, config |

### Nhóm Procurement & Sourcing

| Module | Chức năng |
|--------|-----------|
| `prmodule` | Purchase Request CRUD, budget check, approval routing |
| `rfqmodule` | RFQ lifecycle, mời thầu, so sánh báo giá |
| `pomodule` | Purchase Order, PO consolidation |
| `po-automation` | Tự động hoá PO → GRN khi supplier ACKNOWLEDGE |
| `product-module` | Danh mục sản phẩm, SKU, giá tham chiếu |
| `supplier-vetting-module` | Thẩm định NCC mới: KYC, tài liệu pháp lý |
| `supplier-discovery` | Tìm kiếm NCC mới qua AI và external data |
| `supplier-kpimodule` | Đánh giá KPI NCC: on-time, quality, response |
| `contract-module` | Hợp đồng tự động (≥ 50 triệu VND) |

### Nhóm Finance & Compliance

| Module | Chức năng |
|--------|-----------|
| `budget-module` | BudgetPeriod, BudgetAllocation, Override workflow |
| `cost-center-module` | Trung tâm chi phí theo bộ phận |
| `approval-module` | Approval matrix, workflow engine |
| `invoice-module` | Invoice CRUD, 3-way matching |
| `payment-module` | Lên kế hoạch và thực hiện thanh toán |
| `report-module` | Spend analytics, supplier spend, category spend |

### Nhóm Operations & Logistics

| Module | Chức năng |
|--------|-----------|
| `grnmodule` | Goods Receipt Note: nhận hàng, QC |
| `quality-module` | Kiểm định chất lượng chi tiết |
| `dispute-module` | Khiếu nại, xử lý tranh chấp hàng hóa lỗi |
| `review-module` | Đánh giá NCC sau khi nhận hàng |

### Nhóm Intelligence & Communication

| Module | Chức năng |
|--------|-----------|
| `ai-service` | Gemini AI: phân tích báo giá, gợi ý NCC, NL query |
| `rag` | Retrieval-Augmented Generation: truy vấn tài liệu nội bộ |
| `notification-module` | Web notification, email, SMS (Twilio) |
| `email-processor` | Xử lý hàng đợi email qua BullMQ |
| `gateway` | WebSocket gateway cho Socket.io real-time |

---

## Vai trò Người dùng & Quyền hạn

| Role | Trang chính | Quyền chính |
|------|------------|------------|
| `REQUESTER` | `/pr`, `/po` | Tạo PR, xem PO của mình |
| `DEPT_APPROVER` | `/manager/po-approvals` | Duyệt PR cấp L1 |
| `DIRECTOR` | `/manager/po-approvals`, `/manager/spend-tracking` | Duyệt PR L2, xem spend report |
| `CEO` | `/manager/po-approvals`, `/manager/budget-planning` | Duyệt PR L3/L4, phê duyệt budget override |
| `PROCUREMENT` | `/sourcing`, `/po`, `/procurement/prs` | Quản lý RFQ, PO, NCC |
| `FINANCE` | `/finance/dashboard`, `/finance/matching`, `/finance/invoices`, `/payments` | 3-way match, phê duyệt thanh toán |
| `WAREHOUSE` | `/warehouse/dashboard`, `/grn` | Nhận hàng, QC, GRN |
| `SUPPLIER` | `/supplier/dashboard`, `/supplier/po`, `/supplier/invoice`, `/supplier/rfq` | Nộp quotation, xác nhận PO, nộp Invoice |
| `PLATFORM_ADMIN` | Tất cả | Toàn quyền hệ thống |

---

## Tính năng AI & Tự động hóa

### 1. Chấm điểm Báo giá (Quotation Scoring)

```
Score = (Price Score × 40%) + (Lead Time Score × 30%) + (Supplier KPI × 30%)

Price Score    = (Giá thấp nhất / Giá NCC) × 100
Lead Time Score= (Lead time ngắn nhất / Lead time NCC) × 100
KPI Score      = Trung bình: on_time_delivery + quality_rate + response_rate
```

AI sinh bản tóm tắt Ưu/Nhược điểm bằng ngôn ngữ tự nhiên cho từng báo giá.

### 2. Tìm kiếm Nhà cung cấp (Supplier Discovery)

- Tìm NCC trong database theo category, location, KYC status
- Tích hợp external search để tìm NCC mới
- AI gợi ý dựa trên lịch sử giao dịch và đánh giá KPI

### 3. Natural Language Query (CPO Virtual Assistant)

Người quản lý có thể hỏi bằng tiếng Việt:
- "Liệt kê NCC có tỷ lệ giao hàng trễ cao nhất tháng này"
- "Tổng chi phí theo danh mục IT trong Q1"
- "Các PO đang chờ duyệt quá 3 ngày"

Hệ thống dùng **RAG (Retrieval-Augmented Generation)** với `rag` module để trả lời dựa trên dữ liệu thực tế.

### 4. Tự động hóa Chứng từ (AutomationService)

| Trigger | Hành động tự động |
|---------|-------------------|
| PR `APPROVED` (Flow 1) | Tạo RFQ, gửi email mời thầu |
| PR `APPROVED` (Flow 2) | Tạo QuoteRequest, thu thập giá |
| PO `ACKNOWLEDGED` | Tạo GRN ở trạng thái DRAFT |
| Invoice matched | Cập nhật PO status → INVOICED |
| Payment `COMPLETED` | Hard commit budget, ghi AuditLog |

### 5. Contract Auto-Creation

Khi giá trị PO ≥ `CONTRACT_THRESHOLD` (mặc định: **50,000,000 VND**), hệ thống tự động khởi tạo Contract draft với đầy đủ terms và milestones từ PO.

---

## Cài đặt & Phát triển

### Yêu cầu hệ thống

- **Node.js** 18+
- **PostgreSQL** 16
- **Redis** 7
- **Google Gemini API Key** (từ Google AI Studio)

### Cài đặt Backend

```bash
cd server
npm install

# Sao chép và cấu hình biến môi trường
cp .env.example .env
# Chỉnh sửa .env với thông tin kết nối của bạn

# Tạo Prisma client
npx prisma generate

# Chạy database migration
npx prisma migrate dev --name init

# (Tuỳ chọn) Seed dữ liệu mẫu
npx prisma db seed

# Khởi động development server
npm run start:dev
```

### Cài đặt Frontend

```bash
cd client
npm install

# Sao chép biến môi trường
cp .env.example .env.local
# Cấu hình NEXT_PUBLIC_API_URL=http://localhost:3001

npm run dev
```

Ứng dụng chạy tại: `http://localhost:3000`  
API server chạy tại: `http://localhost:3001`

---

## Triển khai với Docker

Toàn bộ hệ thống có thể chạy với một lệnh duy nhất:

```bash
# Tạo file .env từ .env.example
cp server/.env.example server/.env
# Chỉnh sửa các biến bắt buộc: GEMINI_API_KEY, JWT_SECRET, EMAIL_*

docker compose up -d
```

### Các service trong Docker Compose

| Service | Image | Port | Mô tả |
|---------|-------|------|-------|
| `postgres` | `postgres:16-alpine` | 5432 | Primary database |
| `redis` | `redis:7-alpine` | 6379 | Cache + BullMQ |
| `server` | Build từ `./server` | 3001 | NestJS API |
| `client` | Build từ `./client` | 3000 | Next.js Frontend |

### Kiểm tra trạng thái

```bash
docker compose ps
docker compose logs server --tail=50
docker compose logs client --tail=50
```

---

## Biến môi trường

### Server (`server/.env`)

| Biến | Bắt buộc | Mô tả | Ví dụ |
|------|----------|-------|-------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/oms` |
| `REDIS_HOST` | ✅ | Redis host | `localhost` |
| `REDIS_PORT` | ✅ | Redis port | `6379` |
| `JWT_SECRET` | ✅ | JWT signing secret | `your-secret-key-min-32chars` |
| `JWT_EXPIRES_IN` | | Token expiry | `7d` |
| `GEMINI_API_KEY` | ✅ | Google Generative AI key | `AIza...` |
| `GEMINI_MODEL` | | Model name | `gemini-1.5-flash` |
| `EMAIL_HOST` | | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | | SMTP port | `587` |
| `EMAIL_USER` | | SMTP username | `noreply@company.com` |
| `EMAIL_PASS` | | SMTP password / app password | `xxxx xxxx xxxx xxxx` |
| `EMAIL_FROM` | | Sender display name | `OMS System <noreply@company.com>` |
| `TWILIO_ACCOUNT_SID` | | Twilio Account SID | `ACxxx...` |
| `TWILIO_AUTH_TOKEN` | | Twilio Auth Token | `xxx...` |
| `TWILIO_PHONE_NUMBER` | | Twilio From number | `+1234567890` |
| `SUPPLIER_PORTAL_URL` | | URL portal NCC | `http://localhost:3000/supplier` |
| `CONTRACT_THRESHOLD` | | Ngưỡng tạo contract (VND) | `50000000` |
| `PORT` | | API server port | `3001` |
| `NODE_ENV` | | Environment | `development` / `production` |

### Client (`client/.env.local`)

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `NEXT_PUBLIC_API_URL` | URL của NestJS API | `http://localhost:3001` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:3001` |

---

## Cấu trúc Frontend

### ProcurementContext

Toàn bộ state và API calls được quản lý tập trung qua `app/context/ProcurementContext.tsx`. Mọi component đều truy cập qua hook:

```typescript
const { 
    fetchPRs, createPR, fetchPOs, fetchPayments,
    fetchSpendOverview, fetchSpendBySupplier, fetchSpendByCategory,
    notify, // toast notifications
    // ... 40+ functions
} = useProcurement();
```

### Shared Components

| Component | Path | Mô tả |
|-----------|------|-------|
| `ERPTable<T>` | `components/shared/ERPTable.tsx` | Generic sortable table với empty state |
| `StatsCard` | `components/charts.tsx` | KPI card với trend indicator |
| `SimpleBarChart` | `components/charts.tsx` | Bar chart dựa trên SVG |
| `DonutChart` | `components/charts.tsx` | Donut chart cho phân tích tỉ trọng |
| `Pagination` | `components/shared/Pagination.tsx` | Page navigation |

### Shared Utilities

```typescript
// app/utils/formatUtils.ts
formatVND(value, includeSymbol?: boolean)  // "1.500.000" hoặc "1.500.000 ₫"
formatDate(dateString?)                     // "01/06/2026" hoặc "—"
formatDateTime(dateString?)                 // "01/06/2026 14:30" hoặc "—"
getStatusLabel(status)                      // "Đã phê duyệt", "Chờ duyệt", ...
```

### Tổ chức Pages theo Role

```
/finance/
  ├── dashboard/    → Invoice queue + KPI stats
  ├── matching/     → 3-way match (PO ↔ GRN ↔ Invoice)
  ├── invoices/     → Danh sách invoice đầy đủ
  └── budgets/      → Quản lý ngân sách, cost centers

/manager/
  ├── po-approvals/     → Duyệt PO chờ phê duyệt
  ├── spend-tracking/   → Theo dõi chi tiêu theo phòng ban
  ├── approval-history/ → Lịch sử duyệt
  └── budget-planning/  → Lập kế hoạch ngân sách năm

/warehouse/
  ├── dashboard/    → Lịch giao hàng + GRN draft cần xử lý
  └── grn/          → Tạo/cập nhật GRN, nhập QC

/supplier/
  ├── dashboard/    → Tổng quan RFQ, PO, Invoice
  ├── rfq/          → Danh sách RFQ đã mời thầu
  ├── po/           → Xác nhận PO, cập nhật shipping
  └── invoice/      → Nộp và theo dõi Invoice

/reports/
  └── spend/        → Spend analytics: by supplier, by category

/sourcing/
  ├── page.tsx              → RFQ management
  └── rfq-create/           → Tạo RFQ mới
```

---

## Scripts hữu ích

```bash
# Frontend
cd client
npm run dev        # Dev server
npm run build      # Production build (kiểm tra lỗi TypeScript)
npm run lint       # ESLint check

# Backend
cd server
npm run start:dev  # Dev với hot reload
npm run build      # Compile TypeScript
npm run lint       # ESLint check + auto-fix

# Prisma
npx prisma studio            # GUI quản lý database
npx prisma migrate dev       # Tạo migration mới
npx prisma migrate deploy    # Apply migration (production)
npx prisma db push           # Sync schema không tạo migration
```

---

*Tài liệu cập nhật theo cấu trúc mã nguồn thực tế — 2026-06-01*
