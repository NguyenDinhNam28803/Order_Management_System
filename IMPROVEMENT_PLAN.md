# Kế hoạch Cải tiến & Phát triển Hệ thống OMS

> **Ngày tạo:** 2026-07-23
> **Phiên bản:** 1.0
> **Trạng thái:** Draft

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [P0 — Bảo mật (Critical)](#2-p0--bảo-mật-critical)
3. [P1 — Kiến trúc & Hiệu năng](#3-p1--kiến-trúc--hiệu-năng)
4. [P2 — UX & Functional Fixes](#4-p2--ux--functional-fixes)
5. [P3 — Tính năng Mới](#5-p3--tính-năng-mới)
6. [Timeline & Resource Estimate](#6-timeline--resource-estimate)

---

## 1. Tổng quan

Hệ thống OMS hiện tại đã có kiến trúc P2P (Procure-to-Pay) hoàn chỉnh với 38+ backend modules và 40+ frontend pages. Tuy nhiên, qua quá trình audit toàn diện, phát hiện các nhóm vấn đề chính:

| Nhóm | Số lượng vấn đề | Mức độ ưu tiên |
|------|----------------|----------------|
| Bảo mật (Security) | 3 | Critical — phải sửa ngay |
| Kiến trúc & Hiệu năng (Architecture) | 4 | High — ảnh hưởng đến scalability |
| UX & Functional | 6 | Medium-High — ảnh hưởng user experience |
| Tính năng mới (Features) | 7 | Medium — giá trị lâu dài |

**Tổng thời gian ước tính:** 25-35 ngày phát triển

---

## 2. P0 — Bảo mật (Critical)

### 2.1 Fix Privilege Escalation tại Registration

**Vấn đề:** Endpoint `/auth/register` cho phép người dùng tự chọn `role` trong request body. Bất kỳ ai cũng có thể đăng ký làm `PLATFORM_ADMIN`.

**Vị trí:** `server/src/auth-module/` — Registration endpoint

**Giải pháp:**
- Bắt buộc role = `REQUESTER` khi đăng ký qua public endpoint
- Chỉ có `PLATFORM_ADMIN` mới có thể assign role khác
- Thêm `@Roles(PLATFORM_ADMIN)` decorator cho admin-only role assignment

**Nghĩa vụ thay đổi:**
- `server/src/auth-module/` — Sửa DTO registration, bỏ trường `role` khỏi public endpoint
- `server/src/user-module/` — Thêm endpoint `PATCH /users/:id/role` với RBAC guard

**Thời gian:** 0.5 ngày

---

### 2.2 Loại bỏ Default Password

**Vấn đề:** `ProcurementContext.tsx:659` — login tự dùng `password123` nếu user không nhập password.

**Vị trí:**
- `client/app/context/ProcurementContext.tsx:659`

**Giải pháp:**
- Bắt buộc nhập password trên login form
- Xóa default value
- Thêm minimum password length validation (≥ 8 ký tự)

**Thời gian:** 0.5 ngày

---

### 2.3 Fix Hardcoded localhost trong Production

**Vấn đề:** `supplierDiscoveryService.ts:1` hardcode `http://localhost:5000`, env var bị comment ra.

**Vị trí:**
- `client/app/services/supplierDiscoveryService.ts:1-2`
- 19 files khác chứa `localhost:5000` fallback

**Giải pháp:**
- Bắt buộc dùng `NEXT_PUBLIC_API_URL` từ env
- Xóa tất cả hardcoded localhost fallback
- Thêm CI check: nếu file chứa `localhost:` thì fail build

**Thời gian:** 1 ngày

---

### 2.4 Implement MFA/2FA

**Vấn đề:** Schema đã có `mfaSecret` và `mfaEnabled` fields nhưng chưa implement.

**Vị trí:**
- `server/prisma/schema.prisma:198-199` — User model
- `server/src/auth-module/` — Chưa có MFA logic

**Giải pháp:**
- Implement TOTP (Time-based One-Time Password) với speakeasy/qrcode
- Flow: User bật MFA → System generate secret → Hiển thị QR code → User quét bằng Google Authenticator → Verify code → Activate
- Thêm MFA step vào login flow: sau khi verify password → yêu cầu TOTP code

**Thời gian:** 2-3 ngày

---

## 3. P1 — Kiến trúc & Hiệu năng

### 3.1 Tách ProcurementContext thành Domain-Specific Hooks

**Vấn đề:** `ProcurementContext.tsx` là file **2070 dòng** với **30+ state fields** + **60+ API functions**. Mọi component dùng `useProcurement()` đều re-render toàn bộ khi bất kỳ state nào thay đổi.

**Vị trí:** `client/app/context/ProcurementContext.tsx`

**Giải pháp:**

```
Thay thế:
  const { fetchPRs, fetchPOs, fetchGRNs, fetchInvoices, ... } = useProcurement();

Bằng:
  const prData = usePRData();         // PR CRUD + state
  const poData = usePOData();         // PO CRUD + state
  const rfqData = useRFQData();       // RFQ + Quotation + AI Scoring
  const grnData = useGRNData();       // GRN + QC
  const invoiceData = useInvoiceData(); // Invoice + 3-way matching
  const paymentData = usePaymentData(); // Payment
  const budgetData = useBudgetData();   // Budget allocation + override
  const authData = useAuth();          // Auth + User + Token
  const configData = useConfigData();  // Organization + Department + CostCenter
```

**Cấu trúc thư mục mới:**
```
client/app/context/
├── ProcurementContext.tsx       (tái sử dụng làm orchestrator)
├── hooks/
│   ├── usePRData.ts
│   ├── usePOData.ts
│   ├── useRFQData.ts
│   ├── useGRNData.ts
│   ├── useInvoiceData.ts
│   ├── usePaymentData.ts
│   ├── useBudgetData.ts
│   ├── useAuth.ts
│   └── useConfigData.ts
└── types.ts
```

**Thời gian:** 3-4 ngày

---

### 3.2 Thay thế refreshData() bằng React Query

**Vấn đề:** Hiện tại mỗi CRUD operation gọi `refreshData()` → fire **18+ parallel API calls**. React Query đã được cài (`Providers.tsx`) nhưng **hoàn toàn không dùng**.

**Vị trí:**
- `client/app/context/ProcurementContext.tsx` — `refreshData()` function
- `client/app/components/Providers.tsx` — QueryClientProvider đã setup

**Giải pháp:**
- Implement `useQuery` cho mỗi data domain (PR, PO, RFQ, GRN, Invoice, Payment, Budget)
- Implement `useMutation` cho write operations
- Dùng `queryClient.invalidateQueries()` để refresh data sau mutation
- Kết quả: giảm 80-90% network requests

**Thời gian:** 3-4 ngày

---

### 3.3 Hoàn thiện Stub Functions

**Vấn đề:** Nhiều function trong context chỉ cập nhật local state mà **không gọi backend API**.

| Function | Vị trí | Hiện tại | Cần làm |
|----------|--------|---------|--------|
| `addQuoteRequest` | context:1477 | Tạo fake data local | Gọi API POST |
| `updateQuoteRequest` | context:1494 | Update local state | Gọi API PATCH |
| `submitQuoteRequest` | context:1503 | Mutate local state | Gọi API POST |
| `addBudgetAllocationBundle` | context:1185 | `console.log` + return true | Implement API POST |
| `confirmCatalogPrice` | context:1630 | Return true | Gọi API POST |
| `addUser` | context:971 | Local state only | Gọi API POST |
| `updateUser` | context:980 | Local state only | Gọi API PATCH |
| `updateCostCenter` | context:954 | Local state only | Gọi API PATCH |

**Backend requirements:** Kiểm tra tương ứng các module controllers có endpoint không, nếu chưa có thì tạo thêm.

**Thời gian:** 3-4 ngày

---

### 3.4 Global OrganizationGuard

**Vấn đề:** OrganizationGuard (data isolation theo `orgId`) chỉ áp dụng cho một số controller, không global.

**Vị trí:** `server/src/common/` — OrganizationGuard

**Giải pháp:**
- Áp dụng `@UseGuards(OrganizationGuard)` global trong `app.module.ts`
- Hoặc tạo decorator `@OrgScoped()` tự động inject `orgId` filter
- Đảm bảo mọi query tự động filter theo `orgId` của user đang đăng nhập

**Thời gian:** 1-2 ngày

---

## 4. P2 — UX & Functional Fixes

### 4.1 Hoàn thiện Nút Chức năng Bỏ trống

| Vị trí | Vấn đề | Giải pháp |
|--------|--------|----------|
| Login: "Quên mật khẩu?" | Button không có onClick | Implement Forgot Password flow (email reset link) |
| Login: "Liên hệ Admin" | Button không có onClick | Mở mailto hoặc form liên hệ |
| PR list: Edit/Delete | Không có handler | Implement inline edit + confirm dialog |
| Sidebar: "Chờ: —" | Không có data | Fetch pending approval count API |
| Sidebar: "Online: 24" | Hardcoded | Implement WebSocket presence hoặc xóa |
| Dashboard notifications | Hardcoded 1 notification | Fetch từ notification API |

**Thời gian:** 2-3 ngày

---

### 4.2 Mở rộng ErrorBoundary Coverage

**Hiện tại:** ErrorBoundary chỉ dùng ở 3/40+ pages (approvals, po, supplier).

**Giải pháp:**
- Wrap `ErrorBoundary` tại `layout.tsx` level (global error handler)
- Component-level cho các widget quan trọng: ERPTable, Charts, Forms
- Fix hover state bug: `bg-[#1D4ED8] hover:bg-[#8F442B]` → `hover:bg-[#1E40AF]`

**Thời gian:** 0.5 ngày

---

### 4.3 Zod Validation cho Tất cả Forms

**Hiện tại:** Chỉ PR create form có Zod validation. Các form khác **không có validation**.

**Giải pháp:** Tạo shared validation schemas:

```
client/app/schemas/
├── auth.schema.ts        (login, register, forgot-password)
├── pr.schema.ts          (create PR, update PR)
├── po.schema.ts          (create PO, update PO)
├── rfq.schema.ts         (create RFQ, submit quotation)
├── grn.schema.ts         (create GRN, QC inspection)
├── invoice.schema.ts     (submit invoice, approve invoice)
├── budget.schema.ts      (budget allocation, override)
└── index.ts
```

**Thời gian:** 2-3 ngày

---

### 4.4 Fix Accessibility Issues

| Issue | Vị trí | Fix |
|-------|--------|-----|
| Login labels không gắn input | login/page.tsx:108,120 | Thêm `htmlFor` + `id` |
| Không có skip-to-content link | layout.tsx | Thêm `<a href="#main">Skip to content</a>` |
| Icon-only buttons không có label | pr/page.tsx:155,162,175,181 | Thêm `aria-label` |
| Sidebar aria-label tiếng Pháp | Sidebar.tsx:185 | Đổi thành `"Điều hướng chính"` |
| Color contrast fail WCAG AA | Nhiều nơi `text-[8px]` + `text-slate-400` | Tăng font size / darken colors |
| Dashboard dropdown không keyboard | page.tsx:126-158 | Thêm `aria-expanded`, `role="menu"` |

**Thời gian:** 1-2 ngày

---

### 4.5 Fix PR ID Masking

**Vấn đề:** PR IDs hiển thị dạng `"********"` — user không thể nhận diện documents.

**Vị trí:** `client/app/pr/page.tsx:61`

**Giải pháp:** Hiển thị `prNumber` (VD: `PR-2026-001`) thay vì mask. Thêm tooltip hiển thị full UUID nếu cần.

**Thời gian:** 0.5 ngày

---

### 4.6 Fix Duplicate Type Definitions

**Vị trí:** `client/app/types/api-types.ts`

| Duplicate | Dòng | Fix |
|-----------|------|-----|
| `SupplierKPI` | 722-734 và 977-989 | Giữ 1, xóa 1 |
| `ContractMilestone` | 644-653 và 936-945 | Giữ 1, xóa 1 |

**Thời gian:** 0.5 ngày

---

## 5. P3 — Tính năng Mới

### 5.1 Real-time Dashboard với WebSocket

Hiện tại Socket.io đã cài nhưng chỉ dùng cho notifications. Phát triển thêm:

**Backend:**
- Gateway phát events khi PO/GRN/Invoice status thay đổi
- Implement presence tracking (online users)
- Broadcast budget utilization updates

**Frontend:**
- Live PO status timeline
- Real-time approval queue counter
- Activity feed (audit log streaming)
- Dashboard auto-refresh không cần reload

**Thời gian:** 3-4 ngày

---

### 5.2 Email/Notification Hoàn chỉnh

**Vấn đề:** Email sending hiện tại là **no-op stub**.

**Giải pháp:**
- Implement Nodemailer thật với SMTP config
- BullMQ email queue (đã có `email-processor` module)
- Template engine (Handlebars/EJS) cho emails:
  - PR approval request
  - PO issued to supplier
  - Invoice matched/exception
  - Payment completed
  - GRN QC failed
- SMS notifications qua Twilio (đã enum `TWILIO_*` trong .env)
- In-app notification inbox với read/unread status + pagination

**Thời gian:** 3-4 ngày

---

### 5.3 Mobile-Responsive PWA

Hiện tại chưa có PWA setup.

**Giải pháp:**
- Thêm `next-pwa` package
- Service Worker cho offline capability (xem PR/PO list offline)
- Web App Manifest cho install prompt
- Push notifications cho approvals
- Responsive sidebar → bottom tab navigation on mobile
- Touch-friendly buttons (min 44px tap targets)

**Thời gian:** 3-4 ngày

---

### 5.4 Advanced Analytics Dashboard

Mở rộng `report-module` và `/reports/spend` hiện tại:

```
Enhanced Analytics:
├── Spend Forecasting        — Dự báo chi tiêu theo trend (linear regression)
├── Supplier Risk Scorecard  — Tích hợp external data, risk matrix
├── Budget Burn Rate         — Tốc độ tiêu ngân sách theo thời gian
├── Procurement Cycle Time   — Phân tích thời gian từ PR đến Payment
├── Savings Tracker          — Tiết kiệm so với giá thị trường/đợt trước
├── Anomaly Detection        — Phát hiện giao dịch bất thường (AI)
└── Export Reports           — Xuất Excel/PDF
```

**Thời gian:** 4-5 ngày

---

### 5.5 Escrow Payment Flow

Schema đã có `EscrowAccount` + `EscrowTransaction` nhưng chức năng chưa hoàn thiện.

**Giải pháp:**
- Implement escrow flow đầy đủ:
  1. PO tạo → Lock funds từ escrow account
  2. GRN confirm → Verify goods received
  3. Invoice matched → Confirm amount
  4. Payment approved → Release funds
- Multi-currency: implement currency conversion service với exchange rate API
- Payment gateway integration: VNPay (đã enum nhưng chưa implement)

**Thời gian:** 3-4 ngày

---

### 5.6 Supplier Portal Enhancements

```
Enhanced Supplier Portal:
├── Self-registration + KYC workflow (thay vì admin tạo manual)
├── Product catalog management (supplier cập nhật products/prices)
├── RFQ response with file attachments (technical specs, certificates)
├── Real-time PO status tracking (timeline view)
├── Invoice submission with e-invoice XML upload (Hóa đơn điện tử)
├── Performance dashboard (KPI scores, tier history, trends)
└── Dispute resolution chat (real-time messaging)
```

**Thời gian:** 4-5 ngày

---

### 5.7 Audit Trail & Compliance

Mở rộng `audit-module` hiện tại:

```
Enhanced Audit:
├── Comprehensive change tracking (before/after snapshots cho mọi entity)
├── Compliance reports (SOX compliance, internal audit)
├── Digital signature cho approvals (e-signature integration)
├── Document versioning (PR/PO amendment history với diff view)
├── Login history & session management
└── Data retention policy automation
```

**Thời gian:** 2-3 ngày

---

## 6. Timeline & Resource Estimate

### Lịch trình tổng thể

```
Tuần 1 (5 ngày):
├── P0: Security fixes (2 ngày)
└── P1: Context split + React Query (3 ngày)

Tuần 2 (5 ngày):
├── P1: Stub functions + OrgGuard (3 ngày)
└── P2: UX fixes + Validation + A11y (2 ngày)

Tuần 3 (5 ngày):
├── P3: Email/Notification (3 ngày)
└── P3: Real-time Dashboard (2 ngày)

Tuần 4-5 (8 ngày):
├── P3: Analytics Dashboard (3 ngày)
├── P3: Supplier Portal (3 ngày)
└── P3: PWA + Audit (2 ngày)
```

### Bảng tổng hợp effort

| Priority | Items | Thời gian | Tác động |
|----------|-------|-----------|----------|
| **P0** | Security fixes (4 items) | 4-5 ngày | Critical |
| **P1** | Kiến trúc & Hiệu năng (4 items) | 10-14 ngày | High |
| **P2** | UX & Functional (6 items) | 6-9 ngày | Medium-High |
| **P3** | Tính năng mới (7 items) | 20-25 ngày | Long-term |
| **Tổng** | **21 items** | **~40-53 ngày** | — |

### Thứ tự ưu tiên đề xuất

```
1. [P0] Security fixes                  ← Tuần 1, đầu tiên
2. [P1] Context split + React Query      ← Tuần 1-2
3. [P1] Stub functions                   ← Tuần 2
4. [P2] UX + Validation + A11y           ← Tuần 2-3
5. [P3] Email/Notification               ← Tuần 3
6. [P3] Real-time Dashboard              ← Tuần 3
7. [P3] Analytics + Supplier Portal      ← Tuần 4-5
8. [P3] PWA + Audit                      ← Tuần 5
```

---

*Tài liệu cập nhật: 2026-07-23*
