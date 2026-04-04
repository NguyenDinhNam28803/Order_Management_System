# 🚀 Smart E-Procurement & Order Management System (OMS)

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-Flash-blue?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)

Hệ thống quản trị mua sắm tập trung (**E-Procurement**) và Quản lý đơn hàng (**OMS**) toàn diện, được thiết kế với kiến trúc hiện đại, module hóa cao và giao diện người dùng theo chuẩn Enterprise. Hệ thống tích hợp Trí tuệ nhân tạo (AI) thông minh, tự động hóa toàn bộ chu trình từ yêu cầu mua sắm đến thanh toán (**Procure-to-Pay**), kèm theo kiểm soát ngân sách nâng cao và quy trình duyệt phê chuẩn linh hoạt.

**Status**: ✅ PHẦN 1 (100% hoàn thành) + ✅ PHẦN 2 (95% hoàn thành)  
**Last Updated**: April 4, 2026

---

## 📑 Mục lục (Table of Contents)

1. [✨ Tính Năng Nổi Bật (Highlights)](#-tính-năng-nổi-bật)
2. [📊 Tình trạng Hệ thống (System Status)](#-tình-trạng-hệ-thống)
3. [🏗️ Kiến trúc Hệ thống (Architecture)](#-kiến-trúc-hệ-thống)
4. [💾 Schema Database (Prisma Models)](#-schema-database)
5. [🧪 PHẦN 1: Product Management & RFQ Flow](#-phần-1-product-management--rfq-flow)
6. [💰 PHẦN 2: Budget Management by Category](#-phần-2-budget-management-by-category)
7. [✅ Approval Workflow System (3-Tier)](#-approval-workflow-system-3-tier)
8. [🧠 CPO Virtual Assistant (AI Intelligence)](#-cpo-virtual-assistant-ai-intelligence)
9. [⚙️ Enterprise Automation Engine](#️-enterprise-automation-engine)
10. [🛡️ Bảo mật & Tuân thủ (Security)](#️-bảo-mật--tuân-thủ)
11. [🧩 Các Module Nghiệp vụ (Business Modules)](#-các-module-nghiệp-vụ)
12. [📚 API Endpoints (Key Routes)](#-api-endpoints)
13. [📋 Quy Trình A-Z: Từ Yêu Cầu Đến Thanh Toán & Đánh Giá Nhà Cung Cấp](#-quy-trình-a-z-từ-yêu-cầu-đến-thanh-toán--đánh-giá-nhà-cung-cấp)
14. [🔄 Status Chuyển Đổi (Status Transitions by Scenario)](#-status-chuyển-đổi-status-transitions-by-scenario)
15. [🛠️ Hướng dẫn Cài đặt & Chạy (Installation)](#️-hướng-dẫn-cài-đặt--chạy)
16. [📖 Hướng dẫn Seed Data & Testing](#-hướng-dẫn-seed-data--testing)
17. [👨‍💻 Thông Tin Phát Triển (Developer Information)](#-thông-tin-phát-triển)
18. [🚨 Troubleshooting & Known Issues](#-troubleshooting--known-issues)

---

## ✨ Tính Năng Nổi Bật

### 🎯 Các Tính Năng Chính

#### **1. Dual-Flow Procurement (Quy Trình Mua Sắm Kép)**
- **Flow 1 (Giá Ổn Định):** CATALOG items → Tạo RFQ trực tiếp → PO → GRN → Invoice
- **Flow 2 (Giá Thay Đổi):** NON_CATALOG items → Quotation Request (báo giá trước) → RFQ → PO → GRN → Invoice
- **Auto-Routing:** Hệ thống tự động phát hiện loại hàng & lựa chọn flow phù hợp
- **Smart Volatility Detection:** Dựa vào `PriceVolatility` field (STABLE, MODERATE, VOLATILE) & `requiresQuoteFirst` flag

#### **2. 3-Way Intelligent Invoice Matching (Đối Soát 3 Chiều Thông Minh)**
- **Tolerance-Based Matching:** (Khớp dựa trên Dung sai)
  - Qty Match: Invoice Qty ≤ GRN Qty × 1.02 (dung sai 2% cho số lượng)
  - Price Match: Invoice Price ≤ PO Price × 1.01 (dung sai 1% cho giá)
- **Auto-Decision:** (Quyết định Tự động)
  - ✅ Cả 2 checks pass → Status: `AUTO_APPROVED` (tự động phê duyệt)
  - ❌ Bất kỳ check fail → Status: `EXCEPTION_REVIEW` (chờ duyệt thủ công)
- **Exception Tracking:** (Theo dõi Ngoại lệ) Ghi lại chi tiết lý do không khớp cho kiểm toán
- **Zero Configuration:** (Không cần Cấu hình) Dung sai được định nghĩa trong code, dễ thay đổi

#### **3. Real-Time Supplier Performance Scoring (Đánh Giá Nhà Cung Cấp Thời Thực)**
- **6 Metrics Calculated Automatically:** (6 chỉ số được tính toán tự động)
  1. **OTD Score (On-Time Delivery):** % PO giao đúng hạn trong 6 tháng
  2. **Quality Score:** % sản phẩm chất lượng tốt (qty được chấp nhận / qty nhận được)
  3. **Manual Review Score:** Đánh giá chủ quan từ khách hàng (1-100)
  4. **Buyer Rating Score:** 5 tiêu chí (thời hạn, độ rõ ràng, giao tiếp, tuân thủ, giải quyết tranh chấp)
  5. **Dispute Count:** Số lượng tranh chấp được khởi tố (chỉ số tiêu cực)
  6. **AI Analysis:** Gemini AI đánh giá tổng hợp & đề xuất level
- **Quarterly Tier Classification:** (Phân loại Level Theo quý) GOLD (⭐⭐⭐ ≥90) / SILVER (⭐⭐ ≥75) / BRONZE (⭐ <75)
- **Auto-Trigger:** (Kích hoạt Tự động) Tự động tính toán khi PO được xác nhận, không cần trigger thủ công
- **Trend Analysis:** (Phân tích Xu hướng) Lưu lịch sử theo quý để phân tích xu hướng

#### **4. Budget Management with Category Control (Quản Lý Ngân Sách Theo Danh Mục)**
- **Hierarchical Budget Allocation:** (Phân bổ Ngân sách Phân cấp)
  - Organization-level → Cost Center-level → Department-level → Category-level
  - Composite Unique: `[BudgetPeriod, CostCenter, Dept, Category]`
- **3-Tier Budget State:** (3 Trạng thái Ngân sách)
  1. **Allocated:** (Được phân bổ) Tổng ngân sách được phân bổ
  2. **Committed:** (Được dành riêng) Số tiền được dành riêng khi tạo PO
  3. **Spent:** (Đã chi tiêu) Số tiền thực tế được thanh toán
  - Công thức: `Available = Allocated - Committed - Spent`
- **Auto-Reservation & Release:** (Tự động Dành riêng & Giải phóng) Tạo PO dành riêng, hoàn tất thanh toán giải phóng & chuyển sang spent
- **Budget Code Generation:** (Tạo Mã Ngân sách) Tự động tạo: `BG-{DEPT}-{CATEGORY}-{YEAR}-{PERIOD}`

#### **5. 3-Tier Approval Workflow with Dynamic Escalation**
- **Amount-Based Escalation:** (Tự động Tăng cấp theo Số tiền)
  - Finance: 0 → 500M VND
  - Director: 500M → 1B VND
  - CEO: > 1B VND
- **Multi-Step Workflow:** (Quy trình Đa bước) Phê duyệt tuần tự ở mỗi cấp
- **SLA Tracking:** (Theo dõi SLA) Hết thời gian & tự động tăng cấp nếu cấp không phê duyệt đúng hạn
- **Parallel Notification:** (Thông báo Song song) Hàng đợi email với BullMQ để thông báo không đồng bộ
- **Audit Trail:** (Dấu vết Kiểm toán) Ghi lại mỗi hành động với timestamp, người phê duyệt, lý do

#### **6. Comprehensive Audit Logging (Ghi Log Toàn Diện)**
- **Track Everything:** (Theo dõi Mọi thứ) Mỗi thay đổi ghi lại giá trị cũ → giá trị mới
- **Who & When:** (Ai & Khi nào) User ID, Timestamp, địa chỉ IP
- **What:** (Cái gì) Loại tài liệu, ID, các trường đã thay đổi, delta
- **Immutable Log:** (Nhật ký Bất biến) Không thể chỉnh sửa/xóa, chỉ có thể đọc
- **Compliance Ready:** (Sẵn sàng Tuân thủ) Hỗ trợ kiểm toán quy định (ISO, GDPR, SOX)

#### **7. Intelligent Procure-to-Pay Automation**
- **End-to-End Auto Flow:** (Quy trình Tự động Toàn bộ)
  - PR Approved → Auto RFQ/QuotationRequest dựa trên loại quy trình
  - RFQ Closed → Auto create PO từ lựa chọn tốt nhất
  - PO Approved → Auto create GRN template
  - GRN Confirmed → Auto trigger invoice matching
  - Invoice Matched → Auto create payment nếu được phê duyệt
- **Error Handling:** (Xử lý Lỗi) Thử lại một cách nhẹ nhàng, quay lại thủ công, thông báo cho đội
- **No Manual Intervention:** (Không có Sự can thiệp Thủ công) Đối với quy trình bình thường, hoàn toàn tự động

#### **8. AI-Powered Insights & Recommendations**
- **Gemini AI Integration:** (Tích hợp Gemini AI) Mô hình ngôn ngữ tiên tiến cho phân tích
- **Supplier Performance Analysis:** (Phân tích Hiệu suất Nhà cung cấp) Dự đoán độ tin cậy nhà cung cấp, xác định rủi ro
- **Quotation Scoring:** (Tính điểm Báo giá) Phân tích báo giá & đề xuất giá trị tốt nhất
- **Cash Flow Prediction:** (Dự đoán Dòng tiền) Dự báo lịch trình thanh toán
- **Anomaly Detection:** (Phát hiện Bất thường) Phát hiện hành vi bất thường của nhà cung cấp, tăng giá

#### **9. Enterprise-Grade Security**
- **JWT Authentication:** (Xác thực JWT) Xác thực dựa trên token an toàn với xoay vòng refresh token
- **RBAC (Role-Based Access Control):** (RBAC) 11 vai trò người dùng riêng biệt có quyền chi tiết
- **Encrypted Storage:** (Lưu trữ Mã hóa) Dữ liệu nhạy cảm (thông tin ngân hàng, mã số thuế) được mã hóa khi lưu
- **Audit Trail:** (Dấu vết Kiểm toán) Mọi hành động được ghi lại & có thể truy tìm
- **IP Whitelisting:** (Danh sách Trắng IP) Kiểm soát truy cập dựa trên IP tùy chọn
- **Data Retention:** (Giữ lại Dữ liệu) Chính sách giữ lại có thể cấu hình với lưu trữ tự động

#### **10. Real-Time Dashboard & Analytics**
- **Procurement Dashboard:** (Bảng điều khiển Mua sắm) PR đang chờ, trạng thái PO, KPI nhà cung cấp
- **Finance Dashboard:** (Bảng điều khiển Tài chính) Sử dụng ngân sách, xu hướng chi tiêu, tình trạng thanh toán
- **Warehouse Dashboard:** (Bảng điều khiển Kho) GRN nhận được, kết quả QC, trạng thái hàng tồn
- **Admin Dashboard:** (Bảng điều khiển Quản trị) Tình trạng hệ thống, hoạt động người dùng, nhật ký kiểm toán
- **Export & Reporting:** (Xuất & Báo cáo) Xuất PDF, Excel với báo cáo theo lịch trình

---

## 📊 Tình trạng Hệ thống

| Tính năng | Trạng thái | Mô tả |
|:--------|:-------:|:------|
| **PHẦN 1: Product Management & RFQ** | ✅ 100% | CATALOG trực tiếp PR, NON_CATALOG RFQ 30-day |
| **PHẦN 2: Budget by Category** | ✅ 95% | Composite unique [period, costCenter, dept, category] |
| **Approval Workflow (3-Tier)** | ✅ 100% | Finance (0-500M) → Director (500M-1B) → CEO (>1B) |
| **Budget Reservation System** | ✅ 100% | Atomic allocation, commitment, spending |
| **Supplier Management** | ✅ 100% | FPT Software + FPT Shop seeded + full relationship |
| **Approval Matrix by Amount** | ✅ 100% | Dynamic auto-escalation + SLA tracking |
| **Audit Logging** | ✅ 100% | Ghi lại mọi thay đổi với user, timestamp, old/new values |
| **Email Queue (Jobs)** | ✅ 100% | BullMQ integration ready |
| **AI Analysis** | ✅ 80% | Gemini integration, quotation scoring prepared |

---

## 🏗️ Kiến trúc Hệ thống (System Architecture)

### 📐 Kiến trúc Tổng quát

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Next.js 16)                │
│  Frontend: React 19 + TailwindCSS 4 + Shadcn components    │
│  └─ ProcurementProvider (Context API)                       │
│  └─ Pages: PR, PO, RFQ, Budget, Approval, GRN, etc.        │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST + WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                   API GATEWAY (NestJS 11)                   │
│  Middleware: Helmet, CORS, Validation, Rate Limiting        │
│  GuARDS: JWT + RBAC (7 roles)                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬────────────────┐
        ▼              ▼              ▼                ▼
   ┌────────┐    ┌──────────┐  ┌──────────┐     ┌──────────┐
   │Business│    │Approval  │  │Automation│     │  Audit   │
   │ Modules│    │ Workflow │  │  Engine  │     │ Logging  │
   └───┬────┘    └────┬─────┘  └────┬─────┘     └────┬─────┘
       │               │              │                │
   ┌───▼───────────────▼──────────────▼────────────────▼─────┐
   │              PRISMA ORM + PostgreSQL 16                  │
   │  ┌─────────────────────────────────────────────────────┐ │
   │  │ • BudgetAllocation (Composite Unique Constraint)   │ │
   │  │ • ApprovalWorkflow + ApprovalMatrixRule            │ │
   │  │ • PurchaseRequest + PurchaseOrder                  │ │
   │  │ • QuotationRequest + Quotation                     │ │
   │  │ • GoodsReceiptNote + InvoiceDocument               │ │
   │  │ • Supplier + SupplierCategory + Product            │ │
   │  │ • Organization + CostCenter + Department           │ │
   │  │ • User + Role + Permission                         │ │
   │  │ • AuditLog (Track all changes)                     │ │
   │  └─────────────────────────────────────────────────────┘ │
   └────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐          ┌────────┐          ┌───────┐
   │PostgresQL          │  Redis │          │ Gemini│
   │ Database           │ Cache/ │          │  AI   │
   │                    │BullMQ  │          │(OpenAI)
   └─────────┘          └────────┘          └───────┘
```

### 🎯 Frontend Architecture (`/client`)

**Core Technologies:**
- **Next.js 16.1** - React Server Components, App Router, Built-in optimization
- **React 19.2** - Latest hooks, concurrent features, automatic batching
- **TailwindCSS 4** - Utility-first CSS, JIT compilation
- **TypeScript 5.7** - Full type-safety

**Folder Structure:**
```
client/
├── app/
│   ├── (auth)/               # Public routes: login, register
│   ├── (protected)/          # Private routes with auth guard
│   │   ├── admin/            # Admin dashboard
│   │   ├── pr/               # Purchase Request management
│   │   ├── po/               # Purchase Order management
│   │   ├── rfq/              # RFQ & Quotation management
│   │   ├── budget/           # Budget allocation & tracking
│   │   ├── approvals/        # Approval workflow dashboard
│   │   ├── grn/              # Goods Receipt Notes
│   │   ├── payments/         # Invoice & Payment tracking
│   │   ├── warehouse/        # Warehouse management
│   │   ├── supplier/         # Supplier profiles & KPI
│   │   ├── manager/          # Manager dashboard
│   │   ├── finance/          # Finance reports & analysis
│   │   ├── procurement/      # Procurement operations
│   │   ├── settings/         # System settings
│   │   └── users/            # User management
│   ├── components/           # Reusable UI components
│   ├── context/              # React Context Providers
│   ├── types/                # TypeScript interfaces
│   ├── utils/                # Helper functions
│   └── globals.css           # Global styles
├── public/                   # Static assets
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies
```

### 🔧 Backend Architecture (`/server`)

**Core Technologies:**
- **NestJS 11** - Progressive Node.js framework with TypeScript
- **TypeScript 5.7** - Strict mode for type safety
- **Prisma 7.5** - Next-gen ORM with relational query engine
- **PostgreSQL 16** - Advanced relational database
- **BullMQ** - Redis-based job queue

**Folder Structure:**
```
server/
├── src/
│   ├── main.ts                           # Application entry point
│   ├── app.module.ts                     # Root module
│   ├── auth-module/                      # JWT authentication & tokens
│   │   ├── jwt-auth.guard.ts             # JWT validation guard
│   │   ├── auth.service.ts               # Auth logic
│   │   └── interfaces/
│   ├── approval-module/                  # Approval Workflow Engine
│   │   ├── approval-module.service.ts    # Orchestrate workflows
│   │   ├── approval-module.controller.ts # REST endpoints
│   │   └── dto/
│   ├── audit-module/                     # Audit logging
│   │   └── audit-module.service.ts       # Track changes
│   ├── budget-module/                    # Budget Management
│   │   ├── budget-module.service.ts      # Budget CRUD + reservation
│   │   ├── budget-module.controller.ts   # REST API
│   │   ├── budget-override.service.ts    # Override requests
│   │   └── dto/
│   ├── pr-module/                        # Purchase Request
│   ├── po-module/                        # Purchase Order
│   ├── rfq-module/                       # Request for Quotation
│   ├── grnmodule/                        # Goods Receipt Note
│   ├── invoice-module/                   # Invoice & 3-way matching
│   ├── payment-module/                   # Payment processing
│   ├── supplier-kpimodule/               # Supplier KPI tracking
│   ├── automation-module/                # Enterprise automation
│   │   └── automation.service.ts         # Auto-trigger workflows
│   ├── common/                           # Shared utilities
│   │   ├── roles.guard.ts                # RBAC implementation
│   │   ├── decorators/                   # Custom decorators
│   │   └── pipes/
│   ├── prisma/                           # Prisma service & migrations
│   │   ├── schema.prisma                 # Database schema
│   │   ├── migrations/                   # Schema versions
│   │   └── seed_*.ts                     # Seed data scripts
│   └── test/                             # E2E tests
├── prisma/
│   ├── schema.prisma                     # Main DB schema
│   ├── migrations/                       # Auto-generated migrations
│   └── seed_*.ts                         # Data seeding scripts
│       ├── seed_budget_approval_rules.ts # 3-tier approval setup
│       ├── seed_fpt_software.ts          # FPT Software supplier
│       ├── seed_fpt_shop.ts              # FPT Shop supplier
│       └── cleanup_budget_duplicates.ts  # Data cleanup utility
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

---

## 💾 Schema Database (Prisma Models)

### 🔑 Core Models

#### 1. **BudgetAllocation** - Main budget tracking model
```prisma
model BudgetAllocation {
  id                    String   @id @default(cuid())
  orgId                 String   // Organization
  budgetPeriodId        String   // Fiscal period (Q1, Q2, etc.)
  costCenterId          String   // Cost center
  deptId                String?  // Department (optional for cross-org)
  categoryId            String?  // Product category (NEW - PHẦN 2)
  
  // Financial tracking (3-tier)
  allocatedAmount       BigInt   // Total allocated budget
  committedAmount       BigInt   @default(0)  // Reserved in PO
  spentAmount           BigInt   @default(0)  // Actual invoice amount
  
  status                BudgetAllocationStatus  // DRAFT, SUBMITTED, APPROVED, REJECTED
  budgetCode            String?  // Generated: BG-{dept}-{cat}-{year}-{period}
  
  // Approval tracking
  approvedById          String?
  approvedAt            DateTime?
  rejectedReason        String?
  
  // Metadata
  currency              String   @default("VND")
  notes                 String?
  createdById           String
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // ✅ NEW: Composite unique constraint
  @@unique([budgetPeriodId, costCenterId, deptId, categoryId])
  @@index([orgId])
  @@index([budgetPeriodId])
  @@index([costCenterId])
  @@index([status])
  
  // Relations
  budgetPeriod          BudgetPeriod @relation(fields: [budgetPeriodId], references: [id])
  costCenter            CostCenter @relation(fields: [costCenterId], references: [id])
  department            Department? @relation(fields: [deptId], references: [id])
  category              ProductCategory? @relation(fields: [categoryId], references: [id])
  createdBy             User @relation(fields: [createdById], references: [id])
  approvedBy            User? @relation("BudgetApprovals", fields: [approvedById], references: [id])
}

enum BudgetAllocationStatus {
  DRAFT                 // Trạng thái nháp
  SUBMITTED             // Đã gửi duyệt
  APPROVED              // Đã phê duyệt
  REJECTED              // Bị từ chối
}
```

#### 2. **ApprovalWorkflow** - Approval tracking (New processes)
```prisma
model ApprovalWorkflow {
  id                    String @id @default(cuid())
  orgId                 String
  
  // Document reference
  documentType          DocumentType  // BUDGET_ALLOCATION, PR, PO, INVOICE, etc.
  documentId            String        // ID of the document being approved
  totalAmount           BigInt        // Total amount for rule lookup
  
  // Workflow state
  status                ApprovalStatus  // PENDING, APPROVED, REJECTED
  currentStepIndex      Int @default(0)
  createdAt             DateTime @default(now())
  completedAt           DateTime?
  
  // Creator info
  requesterId           String
  requesterName         String?
  requesterDept         String?
  
  // Tracking
  @@unique([documentType, documentId])
  @@index([orgId])
  @@index([status])
  @@index([requesterId])
  
  steps                 ApprovalStep[]
}

model ApprovalStep {
  id                    String @id @default(cuid())
  workflowId            String
  
  // Step configuration
  stepIndex             Int             // 0, 1, 2 for 3-tier
  approverRole          UserRole        // FINANCE, DIRECTOR, CEO
  requiredSignatories   Int             // How many approvers needed
  
  // SLA
  slaHours              Int @default(48)   // Deadline in hours
  dueAt                 DateTime
  completedAt           DateTime?
  escalatedAt           DateTime?
  escalatedToStepIndex  Int?
  
  // Status
  status                ApprovalStatus  // PENDING, APPROVED, REJECTED
  comments              String?
  
  // Auto-escalation
  autoEscalate          Boolean @default(true)
  escalateAfterHours    Int @default(72)
  
  approvals            ApprovalProcess[]
  workflow             ApprovalWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  ESCALATED
}

enum DocumentType {
  PURCHASE_REQUEST
  PURCHASE_ORDER
  RFQ
  QUOTATION
  GRN
  INVOICE
  PAYMENT
  BUDGET_ALLOCATION       // ✅ NEW
  BUDGET_OVERRIDE
}
```

#### 3. **ApprovalMatrixRule** - Dynamic approval rules
```prisma
model ApprovalMatrixRule {
  id                    String @id @default(cuid())
  orgId                 String
  
  // Document type
  documentType          DocumentType
  
  // Amount range
  minAmount             BigInt
  maxAmount             BigInt?  // null = no upper limit
  
  // Approval hierarchy
  approvalSteps         ApprovalMatrixStep[]
  
  isActive              Boolean @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([orgId, documentType, minAmount])
  @@index([orgId, documentType])
}

model ApprovalMatrixStep {
  id                    String @id @default(cuid())
  ruleId                String
  
  stepIndex             Int              // 0 = first approval
  approverRole          UserRole         // FINANCE, DIRECTOR, CEO
  slaHours              Int @default(48) // Time limit for approval
  
  rule                  ApprovalMatrixRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
}

// ✅ Current 3-Tier Rules (in seed_budget_approval_rules.ts):
// Rule 1: 0 ≤ amount < 500,000,000 VND
//   Step 0: FINANCE (48h, escalate 72h) → approves → SUBMITTED → APPROVED
// Rule 2: 500,000,000 ≤ amount < 1,000,000,000 VND
//   Step 0: FINANCE (48h, escalate 72h)
//   Step 1: DIRECTOR (48h, escalate 72h) ← Auto-escalate from Step 0
// Rule 3: amount ≥ 1,000,000,000 VND
//   Step 0: FINANCE (48h, escalate 72h)
//   Step 1: DIRECTOR (48h, escalate 72h)
//   Step 2: CEO (48h, escalate 72h)
```

#### 4. **PurchaseRequest** - PR management
```prisma
model PurchaseRequest {
  id                    String @id @default(cuid())
  orgId                 String
  prCode                String @unique
  
  // Requester info
  requesterId           String
  deptId                String
  costCenterId          String
  
  // PR details
  description           String
  status                PRStatus  // DRAFT, SUBMITTED, APPROVED, REJECTED, CONVERTED
  
  // Item list with category
  items                 PRItem[]
  
  // Budget allocation reference
  budgetAllocationId    String?
  categoryId            String?  // ✅ PHẦN 2: Category tracking
  
  // Approval
  approvedBy            String?
  approvedAt            DateTime?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([orgId])
  @@index([statusavedAt])
  @@index([createdById])
}

model PRItem {
  id                    String @id @default(cuid())
  prId                  String
  
  productCode           String
  productName           String
  quantity              Int
  unitPrice             BigInt
  lineAmount            BigInt
  categoryId            String?  // ✅ PHẦN 2: Item-level category
  
  // CATALOG vs NON_CATALOG
  sourceType            String  // "CATALOG" or "NON_CATALOG"
  
  // If CATALOG: direct to PO
  // If NON_CATALOG: create RFQ first
  
  pr                    PurchaseRequest @relation(fields: [prId], references: [id])
}

enum PRStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
  CONVERTED_TO_RFQ      // ✅ PHẦN 1: Non-catalog items
  CONVERTED_TO_PO       // ✅ PHẦN 1: Catalog items
}
```

#### 5. **Quotation & RFQ** - Bidding system
```prisma
model QuotationRequest {
  id                    String @id @default(cuid())
  orgId                 String
  rfqCode               String @unique
  
  sourceId              String?  // PR ID if from PR
  status                RFQStatus
  
  // Items requested
  items                 RFQItem[]
  
  // Suppliers invited
  invitations           SupplierInvitation[]
  
  // Bidding deadline
  bidDeadline           DateTime
  
  createdAt             DateTime @default(now())
  closedAt              DateTime?
}

model Quotation {
  id                    String @id @default(cuid())
  rfqId                 String
  supplierId            String
  
  // Pricing
  items                 QuotationItem[]
  totalAmount           BigInt
  currency              String
  
  // AI Scoring (if applicable)
  aiScore               Float?  // 0-100 (Gemini analysis)
  aiNotes               String?
  
  status                QuotationStatus
  submittedAt           DateTime
  
  @@unique([rfqId, supplierId])
  @@index([supplierId])
}

// ✅ PHẦN 1 Implementation:
// Non-catalog items in PR → Create RFQ automatically
// RFQ deadline: 30 days from now
// Invite recommended suppliers (via AI)
// Extract winning quotation → Create PO
```

#### 6. **Supplier** - New vendor management
```prisma
model Supplier {
  id                    String @id @default(cuid())
  orgId                 String
  
  // Identity
  supplierId            String @unique
  name                  String
  
  // Tier & trust
  tier                  SupplierTier    // APPROVED, GOLD, SILVER, BRONZE
  trustScore            Float  @default(0)
  
  // KPI Metrics
  otdScore              Float?  // On-time delivery
  qualityScore          Float?  // Quality rate
  responseTime          Int?    // Hours
  
  // Categories
  categories            SupplierCategory[]
  
  // Products & pricing
  products              Product[]
  productPrices         SupplierProductPrice[]
  
  // Contact
  contactEmail          String?
  contactPhone          String?
  
  // Seeded: FPT Software (95 trust), FPT Shop (92 trust)
}

model SupplierCategory {
  supplierId            String
  categoryId            String
  
  createdAt             DateTime @default(now())
  supplier              Supplier @relation(fields: [supplierId], references: [id])
  category              ProductCategory @relation(fields: [categoryId], references: [id])
  
  @@unique([supplierId, categoryId])
}

model SupplierProductPrice {
  id                    String @id @default(cuid())
  supplierId            String
  productId             String
  
  unitPrice             BigInt
  currency              String @default("VND")
  validFrom             DateTime
  validUntil            DateTime
  
  supplier              Supplier @relation(fields: [supplierId], references: [id])
  product               Product @relation(fields: [productId], references: [id])
  
  @@unique([supplierId, productId])
}

enum SupplierTier {
  APPROVED              // 80-90 trust score
  GOLD                  // 90-100 trust score
  SILVER                // 70-80 trust score
  BRONZE                // <70 trust score
}
```

#### 7. **Product & Category** - Catalog management
```prisma
model ProductCategory {
  id                    String @id @default(cuid())
  orgId                 String
  
  code                  String
  name                  String
  description           String?
  
  // Supplier assignments
  suppliers             SupplierCategory[]
  
  // Budget tracking
  budgetAllocations     BudgetAllocation[]
  
  // Products in this category
  products              Product[]
  
  @@unique([orgId, code])
  @@index([orgId])
}

model Product {
  id                    String @id @default(cuid())
  orgId                 String
  
  code                  String
  name                  String
  description           String?
  categoryId            String
  
  // Seeded categories:
  // FPT Software: Software Licenses, Dev Services, Support, Training, Consulting, Cloud
  // FPT Shop: Laptops, Smartphones, Tablets, Peripherals, Networking, Storage, Camera, Audio, Gaming, Printer
  
  suppliers             SupplierProductPrice[]
  category              ProductCategory @relation(fields: [categoryId], references: [id])
  
  @@unique([orgId, code])
  @@index([categoryId])
}
```

---

## 🧪 PHẦN 1: Product Management & RFQ Flow

### 📋 Yêu cầu
- ✅ Hệ thống phân biệt CATALOG vs NON_CATALOG items
- ✅ CATALOG items: Direct tạo PO (No RFQ)
- ✅ NON_CATALOG items: Tạo RFQ trước, 30-day deadline

### ✅ Thực hiện

**1. PR Item Creation (Có Category)**
```typescript
// POST /budgets/allocations
// - Tạo BudgetAllocation với categoryId
// - Trạng thái: DRAFT → SUBMITTED → APPROVED

// POST /pr
const prItem = {
  productCode: "LAPTOP-001",
  quantity: 5,
  categoryId: "cat-laptops",  // ← Reference to ProductCategory
  sourceType: "NON_CATALOG",  // ← Loại sản phẩm
};
```

**2. Auto RFQ Creation (via AutomationService)**
```typescript
// Khi PR được APPROVED:
// 1. Iterate từng item
// 2. Nếu sourceType = NON_CATALOG:
//    - Gọi automationService.createRFQFromPR(prId, items)
//    - Tạo QuotationRequest
//    - Set bidDeadline = now + 30 days
//    - Lấy list nhà cung cấp recommended từ categoryId
//    - Invite vendors → Email notification

// src/automation-module/automation.service.ts
async createRFQFromPR(prId: string, items: PRItem[]) {
  const nonCatalogItems = items.filter(i => i.sourceType === 'NON_CATALOG');
  
  if (nonCatalogItems.length === 0) return;
  
  // Create RFQ
  const rfq = await this.prisma.quotationRequest.create({
    data: {
      rfqCode: `RFQ-${Date.now()}`,
      sourceId: prId,
      status: 'OPEN',
      bidDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      items: {
        create: nonCatalogItems.map(item => ({...}))
      }
    }
  });
  
  // Invite suppliers
  const suppliers = await this._getRecommendedSuppliers(items);
  
  for (const supplier of suppliers) {
    await this.emailService.sendRFQInvitation(supplier, rfq);
    // Create audit log
  }
  
  return rfq;
}
```

**3. 30-Day RFQ Deadline Mechanism**
```typescript
// BullMQ job (Cron): Check RFQ status every day
// If bidDeadline < now:
//   - Status: OPEN → CLOSED
//   - Trigger quotation analysis (AI scoring)
//   - If no bids: Status → NO_BIDS
//
// Automation:
// Event: RFQ_CLOSED
// Action: Run AI analysis on all quotations
// Output: Best quotation recommended + scores
```

**4. Winning Quotation → Auto PO (PHẦN 1)**
```typescript
// When user selects winning quotation:
// 1. Update quotation: status = AWARDED
// 2. Create PO from quotation
// 3. Reserve budget: budgetAllocation.committedAmount += amount
// 4. Update PR: status = CONVERTED_TO_PO
// 5. Auto-create GRN (Draft)

async selectWinningQuotation(quotationId: string) {
  const quotation = await this.prisma.quotation.update({
    where: { id: quotationId },
    data: { status: 'AWARDED' }
  });
  
  // Auto-create PO
  const po = await this.poService.createFromQuotation(quotation);
  
  // Reserve budget
  await this.budgetService.reserveBudgetByCategory(
    costCenterId,
    categoryId,
    orgId,
    Number(po.totalAmount)
  );
  
  // Create Draft GRN
  await this.grnService.createDraftGRN(po.id);
  
  return po;
}
```

### ✅ PHẦN 1 Status: **100% COMPLETED**
- QuotationRequest model ready with 30-day deadline
- AutomationService.createRFQFromPR() implemented
- Budget reservation by categoryId working
- Composite unique constraint on BudgetAllocation

---

##💰 PHẦN 2: Budget Management by Category

### 📋 Yêu cầu
- ✅ Ngân sách phải track theo Category (ProductCategory)
- ✅ Composite unique: [budgetPeriod, costCenter, dept, category]
- ✅ Prevent duplicate allocations
- ✅ PR items phải chỉ định categoryId

### ✅ Schema Changes

**BudgetAllocation Model**
```prisma
model BudgetAllocation {
  // ... existing fields ...
  categoryId            String?  // ← NEW: Product category
  
  // NEW unique constraint
  @@unique([budgetPeriodId, costCenterId, deptId, categoryId])
  
  // Relation
  category              ProductCategory? @relation(fields: [categoryId], references: [id])
}
```

**Database Cleanup**
```bash
# Before migration: Remove duplicate records
npx ts-node prisma/cleanup_budget_duplicates.ts
# Identifies duplicates by [period, costCenter, dept, category]
# Keeps first, deletes rest
```

### ✅ Budget Reservation by Category

```typescript
// src/budget-module/budget-module.service.ts

async reserveBudgetByCategory(
  costCenterId: string,
  categoryId: string | undefined,
  orgId: string,
  amount: number,
  user: JwtPayload,
): Promise<BudgetAllocation> {
  // 1. Find allocation by costCenter + category
  const allocation = await this.prisma.budgetAllocation.findFirst({
    where: {
      costCenterId,
      categoryId: categoryId || null,  // Handle null category
      orgId,
      status: 'APPROVED',
    },
  });

  if (!allocation) {
    throw new BadRequestException(
      'Không tìm thấy cấp phát ngân sách cho Cost Center + Category này'
    );
  }

  // 2. Atomic update
  const updated = await this.prisma.budgetAllocation.update({
    where: { id: allocation.id },
    data: {
      committedAmount: { increment: amount },
    },
  });

  // 3. Check if available (allocated - committed - spent)
  const available =
    Number(updated.allocatedAmount) -
    Number(updated.committedAmount) -
    Number(updated.spentAmount);

  if (available < 0) {
    // Rollback
    await this.prisma.budgetAllocation.update({
      where: { id: updated.id },
      data: { committedAmount: { decrement: amount } },
    });
    throw new BadRequestException('Vượt hạn mức ngân sách danh mục');
  }

  // 4. Audit log
  await this.auditService.create(
    { action: 'RESERVE_BUDGET_CATEGORY', ... },
    user,
  );

  return updated;
}
```

### ✅ PHẦN 2 Status: **95% COMPLETED**
- ✅ Composite unique constraint: [period, costCenter, dept, category]
- ✅ Budget reservation logic by category
- ✅ Duplicate prevention via cleanup script
- ⏳ Frontend UI for category selector in budget form (5% remaining)

---

## ✅ Approval Workflow System (3-Tier)

### 📋 Kiến trúc Approval

**3-Tier Rules Based on Amount:**

| Amount | Level 1 | Level 2 | Level 3 | Auto-Escalate |
|:------:|:-------:|:-------:|:-------:|:-------------:|
| 0 - 500M | FINANCE (48h) | ❌ | ❌ | Yes (72h) |
| 500M - 1B | FINANCE (48h) | DIRECTOR (48h) | ❌ | Yes (72h) |
| > 1B | FINANCE (48h) | DIRECTOR (48h) | CEO (48h) | Yes (72h) |

### ✅ Approval Rules Setup

```bash
# Generate 3-tier rules
npx ts-node prisma/seed_budget_approval_rules.ts
```

**Output**: 3 ApprovalMatrixRule records + 6 ApprovalMatrixStep records

```typescript
// seed_budget_approval_rules.ts
const rules = [
  {
    docType: 'BUDGET_ALLOCATION',
    minAmount: 0,
    maxAmount: 500_000_000,
    steps: [
      { stepIndex: 0, role: 'FINANCE', slaHours: 48, escalateHours: 72 }
    ]
  },
  {
    docType: 'BUDGET_ALLOCATION',
    minAmount: 500_000_000,
    maxAmount: 1_000_000_000,
    steps: [
      { stepIndex: 0, role: 'FINANCE', slaHours: 48, escalateHours: 72 },
      { stepIndex: 1, role: 'DIRECTOR', slaHours: 48, escalateHours: 72 }
    ]
  },
  {
    docType: 'BUDGET_ALLOCATION',
    minAmount: 1_000_000_000,
    maxAmount: null,
    steps: [
      { stepIndex: 0, role: 'FINANCE', slaHours: 48, escalateHours: 72 },
      { stepIndex: 1, role: 'DIRECTOR', slaHours: 48, escalateHours: 72 },
      { stepIndex: 2, role: 'CEO', slaHours: 48, escalateHours: 72 }
    ]
  }
];
```

### ✅ Workflow Creation (Auto-triggered)

```typescript
// src/budget-module/budget-module.controller.ts

@Patch('allocations/:id/submit')
async submitAllocation(
  @Param('id') id: string,
  @Request() req: { user: JwtPayload },
) {
  // Step 1: Submit allocation (status DRAFT → SUBMITTED)
  const submitted = await this.budgetService.submitAllocation(id, req.user);

  // Step 2: Trigger approval workflow
  try {
    await this.approvalService.initiateWorkflow({
      docType: DocumentType.BUDGET_ALLOCATION,
      docId: id,
      totalAmount: Number(submitted.allocatedAmount),
      orgId: req.user.orgId,
      requesterId: req.user.sub,
      user: req.user,
    });
    console.log(`✅ Approval workflow created for ${id}`);
  } catch (error) {
    console.warn(`⚠️ Could not create workflow: ${error.message}`);
    // Non-blocking error
  }

  return submitted;
}
```

### ✅ Workflow Orchestration

```typescript
// src/approval-module/approval-module.service.ts

async initiateWorkflow(params: InitiateWorkflowDto) {
  // 1. Fetch matching approval rules
  const rule = await this.findApplicableRule(
    params.docType,
    params.totalAmount
  );

  if (!rule) {
    throw new BadRequestException('No approval rule found');
  }

  // 2. Create workflow
  const workflow = await this.prisma.approvalWorkflow.create({
    data: {
      orgId: params.orgId,
      documentType: params.docType,
      documentId: params.docId,
      totalAmount: params.totalAmount,
      requesterId: params.requesterId,
      status: 'PENDING',
    },
  });

  // 3. Create approval steps
  for (const ruleStep of rule.approvalSteps) {
    await this.prisma.approvalStep.create({
      data: {
        workflowId: workflow.id,
        stepIndex: ruleStep.stepIndex,
        approverRole: ruleStep.approverRole,
        slaHours: ruleStep.slaHours,
        dueAt: new Date(Date.now() + ruleStep.slaHours * 3600000),
        autoEscalate: true,
        escalateAfterHours: 72,
        status: 'PENDING',
      },
    });
  }

  // 4. Auto-approve if requester IS approver
  const canAutoApprove = rule.approvalSteps[0].approverRole === params.user.role;
  if (canAutoApprove) {
    await this._approveStep(workflow.id, 0, params.user);
  }

  return workflow;
}
```

### ✅ Auto-Escalation Job (BullMQ)

```typescript
// Scheduled job every 6 hours
// Check approval steps with status = PENDING
// If escalateAfterHours passed → Move to next step automatically
// Update dueAt for new step
// Notify next approver by email
```

---

## 🧠 CPO Virtual Assistant (AI Intelligence)

### 📋 Google Gemini Integration

**Enabled Capabilities:**
- ✅ Natural language querying (Function Calling)
- ✅ Quotation analysis & scoring
- ✅ Supplier recommendations

### 🔧 AI Function Tools

```typescript
// src/ai-service/ai.service.ts
const tools = [
  {
    name: "query_purchase_requests",
    description: "Query PR by status, date, or amount",
    parameters: {... }
  },
  {
    name: "query_suppliers",
    description: "Get supplier list with KPI scores",
    parameters: {... }
  },
  {
    name: "analyze_quotation",
    description: "Score quotation on price/delivery/quality",
    parameters: {... }
  }
];

// AI can invoke: "Which suppliers have OTD > 95% for Electronics?"
// → invoke query_suppliers tool → return results
```

### ✅ Quotation Scoring Engine

```typescript
async scoreQuotation(quotationId: string): Promise<number> {
  const quotation = await this.prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { supplier: true }
  });

  // Weight: Price (40%) + Delivery (30%) + Quality (30%)
  const priceScore = this.calculatePriceScore(quotation.totalAmount);
  const deliveryScore = quotation.supplier.otdScore || 0;
  const qualityScore = quotation.supplier.qualityScore || 0;

  const finalScore = 
    (priceScore * 0.4) +
    (deliveryScore * 0.3) +
    (qualityScore * 0.3);

  await this.prisma.quotation.update({
    where: { id: quotationId },
    data: { aiScore: finalScore }
  });

  return finalScore;
}
```

---

## ⚙️ Enterprise Automation Engine

### 🤖 AutomationService

**Responsibilities:**
1. PR Approval → Auto-create RFQ (Non-catalog only)
2. RFQ Deadline → Auto-score quotations
3. Quotation Won → Auto-create PO
4. PO Created → Auto-create Draft GRN
5. GRN Completed → Auto-create Invoice
6. Invoice Matched → Auto-release budget

### 📡 Event Triggers

```typescript
// src/automation-module/automation.service.ts

class AutomationService {
  
  // Trigger 1: PR Approved
  @OnEvent('pr.approved')
  async handlePRApproved(pr: PurchaseRequest) {
    const hasNonCatalog = pr.items.some(i => i.sourceType === 'NON_CATALOG');
    if (hasNonCatalog) {
      await this.createRFQFromPR(pr.id, pr.items);
    }
  }

  // Trigger 2: RFQ Deadline Passed
  @Cron('0 0 * * *') // Daily at midnight
  async checkRFQDeadlines() {
    const dueRFQs = await this.prisma.quotationRequest.findMany({
      where: {
        status: 'OPEN',
        bidDeadline: { lte: new Date() }
      }
    });

    for (const rfq of dueRFQs) {
      await this.closeRFQAndAnalyze(rfq.id);
    }
  }

  // Trigger 3: Quotation Awarded
  @OnEvent('quotation.awarded')
  async handleQuotationAwarded(quotationId: string) {
    const po = await this.poService.createFromQuotation(quotationId);
    await this.grnService.createDraftGRN(po.id);
  }
}
```

---

## 🛡️ Bảo mật & Tuân thủ (Security & Compliance)

### 🔐 Authentication & Authorization

**JWT Flow:**
```
[Client] → POST /auth/login (email, password)
[Server] → Validate → Generate JWT (Access + Refresh)
           → Return { accessToken, refreshToken }
[Client] → Store in localStorage/sessionStorage
[Client] → Attach to every request: Authorization: Bearer {token}
[Server] → JwtAuthGuard validates signature & payload
```

**Role-Based Access Control (RBAC):**

```typescript
enum UserRole {
  REQUESTER           // Create PR
  DEPT_APPROVER       // Approve within dept budget
  DIRECTOR            // Handle escalation 500M-1B
  CEO                 // Final approval >1B
  PROCUREMENT         // Manage RFQ/Suppliers
  FINANCE             // Budget management
  WAREHOUSE           // GRN/Stock operations
  PLATFORM_ADMIN      // System configuration
}
```

**Usage:**
```typescript
@Patch('allocations/:id/submit')
@Roles(UserRole.DEPT_APPROVER)  // ← Guard
async submitAllocation(...) { ... }
```

### 🔍 Audit Logging

**Full Audit Trail:**
```typescript
// Every change to critical entities logged
// Who? When? What changed? Old value? New value?

await this.auditService.create({
  action: 'SUBMIT_BUDGET_ALLOCATION',
  entityType: 'BudgetAllocation',
  entityId: id,
  oldValue: allocation,     // Before
  newValue: updated,        // After
  changeDetails: {
    status: 'DRAFT → SUBMITTED',
    timestamp: new Date(),
    userId: user.sub
  }
}, user);
```

### 🛡️ Security Middlewares

```typescript
// src/main.ts
import helmet from '@nestjs/helmet';
import { ThrottlerGuard } from '@nestjs/throttler';

app.use(helmet());  // Secure HTTP headers
app.useGlobalGuards(new ThrottlerGuard());  // Rate limiting
app.useGlobalPipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}));
```

---

## 🧩 Các Module Nghiệp vụ (Business Modules)

### 1. 🛒 **PR Module** (`pr-module`)
- Create → Submit → Approve flow
- CATALOG vs NON_CATALOG item classification
- Category tracking (PHẦN 2)
- Auto-convert to PO (CATALOG) or RFQ (NON_CATALOG)

### 2. 📋 **RFQ Module** (`rfq-module`)
- QuotationRequest management
- 30-day bidding deadline (PHẦN 1)
- Supplier invitation & tracking
- Multi-supplier comparison

### 3. 💰 **Budget Module** (`budget-module`)
- Annual budget distribution (20% reserve, 80% quarterly)
- Budget allocation by category (PHẦN 2)
- Atomic reservation/commitment/spending
- Override request workflow

### 4. ✅ **Approval Module** (`approval-module`)
- Dynamic approval matrix (3-tier for BUDGET_ALLOCATION)
- Auto-escalation based on SLA
- Multi-step workflow orchestration
- Auto-approval logic

### 5. 📦 **GRN Module** (`grnmodule`)
- Goods Receipt Note creation
- Quality control (QC) pass/fail
- 3-way matching (PO → GRN → Invoice)
- Stock update automation

### 6. 💳 **Invoice Module** (`invoice-module`)
- Invoice matching against PO & GRN
- Discount application
- Payment term handling
- 3-way discrepancy handling

### 7. 🏢 **Supplier Module** (`supplier-kpimodule`)
- Supplier master data
- KPI tracking: OTD, Quality, Trust Score
- Category assignments
- Product pricing

### 8. 🛡️ **Audit Module** (`audit-module`)
- Comprehensive change logging
- User activity tracking
- Compliance reporting
- Data version history

---

## 📚 API Endpoints (Key Routes)

### Budget Management
```
POST   /budgets/periods
GET    /budgets/periods
GET    /budgets/periods/type/:type
PATCH  /budgets/periods/:id

POST   /budgets/allocations
GET    /budgets/allocations
GET    /budgets/allocations/:id
PATCH  /budgets/allocations/:id
PATCH  /budgets/allocations/:id/submit
PATCH  /budgets/allocations/:id/approve
PATCH  /budgets/allocations/:id/reject
GET    /budgets/my-department
```

### Approval Workflows
```
POST   /approvals/workflows
GET    /approvals/workflows/:id
GET    /approvals/workflows/:id/steps
PATCH  /approvals/workflows/:id/step/:stepId/approve
PATCH  /approvals/workflows/:id/step/:stepId/reject
```

### Purchase Request
```
POST   /pr
GET    /pr
GET    /pr/:id
PATCH  /pr/:id
PATCH  /pr/:id/submit
```

### RFQ & Quotation
```
POST   /rfq
GET    /rfq
GET    /rfq/:id
POST   /quotations
GET    /quotations
PATCH  /quotations/:id/award
```

### Suppliers
```
GET    /suppliers
GET    /suppliers/:id
GET    /suppliers/:id/kpi
POST   /suppliers/:id/categories
```

---

## 🔄 Quy trình Procure-to-Pay

```mermaid
graph TD
    A[Requester creates PR] -->|With categoryId| B{CATALOG?}
    B -->|YES| C[Direct PO]
    B -->|NO| D[Create RFQ]
    
    C -->|Submit| E[Auto: Reserve Budget]
    D -->|30-day bidding| F[Suppliers Submit Quotations]
    
    F -->|AI Scoring| G[Compare & Select Winner]
    G -->|Create| H[Purchase Order]
    
    H -->|Issued| I[Auto: Create Draft GRN]
    I -->|Goods Received| J[QC Pass/Fail]
    
    J -->|Pass| K[Create Invoice]
    K -->|3-Way Match| L{PO=GRN=INV?}
    
    L -->|YES| M[Payment Ready]
    L -->|NO| N[Dispute Resolution]
    
    N -->|Resolved| M
    M -->|Auto Release| O[Budget Freed]
    
    E -->|Approval Needed| P{Amount?}
    P -->|0-500M| Q[FINANCE Approves]
    P -->|500M-1B| R[FINANCE → DIRECTOR]
    P -->|>1B| S[FINANCE → DIRECTOR → CEO]
    
    Q -->|48h SLA| T[Schedule Escalation]
    R -->|Auto-escalate 72h| T
    S -->|Auto-escalate 72h| T
    
    T -->|Approved| U[Budget APPROVED]
    U -->|Now Can Use| C
```

---

## � Quy Trình A-Z: Từ Yêu Cầu Đến Thanh Toán & Đánh Giá Nhà Cung Cấp

### 🎯 Complete End-to-End Procurement Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│              PHASE 1: PURCHASE REQUEST & FLOW DECISION                  │
└─────────────────────────────────────────────────────────────────────────┘

1. TẠOMIỄN PURCHASE REQUISITION (PR)
   └─ Department creates PR with items
      • Item detail: SKU, Description, Qty, Preferred supplier
      • Cost center allocation
      • Expected delivery date
      • Status: DRAFT
   
2. GỬIDUYỆT PURCHASE REQUISITION
   └─ Submit for approval
      • Budget check: Available budget >= PR amount
      • Approval routing based on amount (Budget, Finance, Director, CEO)
      • Status: PENDING_APPROVAL
   
3. DUYỆT PURCHASE REQUISITION
   └─ Approval workflow (3-tier escalation)
      • Tier 1: Finance (0-500M)
      • Tier 2: Director (500M-1B)
      • Tier 3: CEO (>1B)
      • Each tier has SLA (default 3 days)
      • Status: APPROVED / REJECTED

4. ✅ PR APPROVED → AUTO-ROUTING (AutomationService)
   └─ System analyzes product items:
      IF product has VOLATILE/MODERATE price OR requiresQuoteFirst = true:
        └─ FLOW 2: Create QuotationRequest (báo giá trước)
           └─ Supplier gửi quotation
              └─ After approval: QuotationRequest → PR update + RFQ
      ELSE:
        └─ FLOW 1: Create RFQ (Request for Quotation) trực tiếp
           └─ Supplier gửi quotation
              └─ After evaluation: RFQ → Best Quotation selected

┌─────────────────────────────────────────────────────────────────────────┐
│         PHASE 2: RFQ/QUOTATION & PURCHASE ORDER CREATION                │
└─────────────────────────────────────────────────────────────────────────┘

5. TẠO RFQ HOẶC QUOTATION REQUEST
   └─ System creates RFQ template from PR
      • RFQ Number: RFQ-{YYYY}-{XXXXX}
      • Add preferred suppliers OR broadcast to all suppliers in category
      • Status: DRAFT OR PUBLISHED
      • Validity period: 30 days (configurable)

6. SUPPLIER RESPONSE & QUOTATION SUBMISSION
   └─ Suppliers submit quotation
      • Item qty, pricing, delivery date
      • Payment terms, warranty info
      • Status: SUBMITTED

7. QUOTATION EVALUATION & SCORING
   └─ Procurement team evaluates
      • AI scoring: Price, supplier reputation, delivery time
      • Manual scoring: Compliance, quality, communication
      • Auto-recommend: Best value supplier
      • Status: EVALUATED or UNDER_REVIEW

8. CREATE PURCHASE ORDER (PO) FROM APPROVED QUOTATION
   └─ System auto-create PO from best quotation
      • PO Number: PO-{YYYY}-{XXXXX}
      • Link to Quotation, Supplier, PR
      • PO detail: Items, pricing, delivery date, payment terms
      • Budget reservation: Allocated → Committed
        └─ budgetCode generated: BG-{DEPT}-{CAT}-{YEAR}-{PERIOD}
      • Status: DRAFT

9. SUBMIT & APPROVE PURCHASE ORDER
   └─ PO subject to approval
      • Small PO (<50M): Finance approve only
      • Medium PO (50M-500M): Finance + Director
      • Large PO (>500M): Full 3-tier approval
      • Each tier has SLA tracking
      • Status: PENDING_APPROVAL → APPROVED

10. ✅ PO APPROVED → AUTO-TRIGGER GRN TEMPLATE
    └─ AutomationService auto-creates GRN template
       └─ Warehouse team prepare to receive goods
       └─ GRN Status: DRAFT (ready for receipt)

┌─────────────────────────────────────────────────────────────────────────┐
│    PHASE 3: PURCHASE ORDER CONFIRMATION & SUPPLIER EVALUATION            │
└─────────────────────────────────────────────────────────────────────────┘

11. SUPPLIER CONFIRMS PO RECEIPT & MANUFACTURING START
    └─ Supplier acknowledges PO
       • Status: ACKNOWLEDGED
       • Confirm delivery date
       • Notify any delays/issues

    🤖 AUTO-TRIGGER: Supplier Performance Evaluation
       └─ supplierKpiService.evaluateSupplierPerformance()
          
          ⏱️ Lookback Period: Last 6 months
          
          📊 Calculate 6 Metrics:
             1. OTD Score = (On-time POs / Total POs) × 100
                Data from: GRN.receivedAt vs PO.deliveryDate
             
             2. Quality Score = (Accepted Qty / Received Qty) × 100
                Data from: GrnItem.acceptedQty, receivedQty
             
             3. Manual Review Score = Avg(buyerManualReviews)
                Range: 1-100 (subjective assessment)
             
             4. Buyer Rating Score = Avg(5 rating criteria):
                - Payment Timeliness (1-5)
                - Spec Clarity (1-5)
                - Communication (1-5)
                - Process Compliance (1-5)
                - Dispute Fairness (1-5)
             
             5. Dispute Count = # open disputes in 6-month period
                Negative impact on overall score
             
             6. AI Evaluation = Call Gemini AI
                Input: otdScore, qualityScore, manualScore, poCount, disputeCount
                Output: finalScore, recommendation (GOLD/SILVER/BRONZE), insights
          
          💾 Save Quarterly KPI Score
             └─ SupplierKpiScore table
             └─ Key: (supplierId, buyerOrgId, periodYear, periodQuarter)
             └─ Upsert logic (insert if new, update if exists)
             └─ Update Organization.tier & trustScore
          
          🏆 Supplier Tier Assignment:
             GOLD ⭐⭐⭐: score ≥90 && disputeCount=0 → Preferred supplier
             SILVER ⭐⭐: score ≥75 && disputeCount≤2 → Standard supplier
             BRONZE ⭐: score <75 → Under review / probation

12. PO STATUS: IN_PROGRESS (或 SHIPPED)
    └─ Supplier manufactures/prepares goods
       • Frequent status update
       • Any issue notification
       • On/off track confirmation

┌─────────────────────────────────────────────────────────────────────────┐
│        PHASE 4: GOODS RECEIPT & QUALITY CONTROL                         │
└─────────────────────────────────────────────────────────────────────────┘

13. WAREHOUSE RECEIVES GOODS & CREATE GRN
    └─ Warehouse staff create GRN (Goods Receipt Note)
       • GRN Number: GRN-{YYYY}-{XXXXX}
       • Link to PO
       • Receive timestamp
       • Status: DRAFT / IN_INSPECTION

14. QUANTITY & QUALITY CONTROL CHECK
    └─ QC team inspect items
       • Physical count: receivedQty
       • Quality inspection: PASSED / FAILED / PARTIAL
       • Accepted qty: acceptedQty
       • Rejected qty: rejectedQty if any
       • QC Result: Record in GrnItem
       • Status: UNDER_REVIEW or CONFIRMED

15. ✅ GRN CONFIRMED
    └─ Warehouse confirm all checked & approved
       • Status: CONFIRMED
       • Update PO: Status → GRN_CREATED
       • ALL GrnItem QC results finalized
       • Ready for invoice matching

┌─────────────────────────────────────────────────────────────────────────┐
│    PHASE 5: INVOICE RECEIPT & AUTO 3-WAY MATCHING                      │
└─────────────────────────────────────────────────────────────────────────┘

16. SUPPLIER SUBMITS INVOICE
    └─ Supplier creates invoice
       • Invoice Number: INV-{YYYY}-{XXXXX}
       • Invoice Date
       • Item detail: SKU, Qty billed, Unit price, Amount
       • Tax info, payment terms
       • Link to PO & GRN
       • Status: DRAFT

17. 🤖 AUTO 3-WAY MATCHING (runThreeWayMatching)
    └─ System auto-match between PO, GRN, Invoice
    
       For each invoice item:
          ✓ Check #1: QUANTITY MATCH
             Formula: Invoice Qty ≤ GRN ReceivedQty × (1 + 2%)
             Example: GRN=100units, max allowed invoice=102units
                     if invoice=101.5: ✅ PASS
                     if invoice=103: ❌ FAIL
          
          ✓ Check #2: PRICE MATCH
             Formula: Invoice Price ≤ PO Price × (1 + 1%)
             Example: PO=1,000/unit, max=1,010/unit
                     if invoice=1,008: ✅ PASS
                     if invoice=1,015: ❌ FAIL
       
       Final Decision:
          if ALL items pass both checks:
             → Invoice Status: AUTO_APPROVED ✅
             → Auto-create payment request
             → Notify supplier payment will process
          
          if ANY item fails:
             → Invoice Status: EXCEPTION_REVIEW ❌
             → Store exceptionReason (detailed text)
             → Send to Finance team for manual review
             → Finance team decide: APPROVE or REJECT

18. 📋 MANUAL EXCEPTION REVIEW (if needed)
    └─ Finance team reviews exceptions
       • Evaluate business reason for mismatch
       • Contact supplier if clarification needed
       • Decision: APPROVE (override) or REJECT
       • Status: PAYMENT_APPROVED or REJECTED

19. UPDATE PO STATUS
    └─ PO Status: INVOICED
       • Ready for payment processing

┌─────────────────────────────────────────────────────────────────────────┐
│         PHASE 6: PAYMENT PROCESSING & BUDGET FINALIZATION                │
└─────────────────────────────────────────────────────────────────────────┘

20. CREATE PAYMENT REQUEST
    └─ Finance creates payment from approved invoice
       • Payment Number: PAY-{YYYY}-{XXXXX}
       • Amount: Invoice total amount
       • Payment method: BANK, CASH, CHECK, ESCROW
       • Status: PENDING

21. PROCESS PAYMENT
    └─ Accounting/Finance execute payment
       • Bank transfer / Online payment
       • Record transaction ref/ proof
       • Status: COMPLETED
       • Timestamp: processedAt

22. 💰 BUDGET UPDATE (Committed → Spent)
    └─ Automatic budget allocation update
       • Find BudgetAllocation with:
         └─ [costCenterId, deptId, categoryId, periodYear, periodQuarter]
       • Update amounts:
         └─ committedAmount: DECREMENT (release lock)
         └─ spentAmount: INCREMENT (actual payment)
       • Formula: Available = Allocated - Committed - Spent
         Before: 100M allocated, 50M committed, 0M spent → Available: 50M
         After:  100M allocated, 0M committed, 50M spent → Available: 50M

23. ✅ PAYMENT COMPLETE
    └─ Invoice Status: PAID
       • Paid timestamp: paidAt
       • Payment link to Invoice link
       • Supplier confirmed payment received
       • PO Status: COMPLETED
       • End of Procure-to-Pay cycle ✨

---

## 🔄 Status Chuyển Đổi (Status Transitions by Scenario)

### 📊 Purchase Requisition (PR) Status Flow

```
┌─────────┐
│ DRAFT   │ ← Tạo PR mới
└────┬────┘
     │ Submit
     ▼
┌──────────────────┐
│ PENDING_APPROVAL │ ← Chờ duyệt (3-tier: Finance → Director → CEO)
└────┬─────────────┘
     │
     ├─ Approved ──→ ┌──────────┐
     │               │ APPROVED │ ← Gửi RFQ/Quotation
     │               └────┬─────┘
     │                    │
     │               ┌────▼─────────┐
     │               │ IN_QUOTATION  │ ← Chờ quotation từ supplier
     │               └────┬──────────┘
     │                    │
     │               ┌────▼──────────┐
     │               │ EVALUATED      │ ← Quotation đã evaluate
     │               └────┬───────────┘
     │                    │
     │               ┌────▼─────────>┐
     │               │ PO_CREATED     │ ← PO tạo từ best quotation
     │               └────┬──────────┘
     │                    │
     │               ┌────▼───────┐
     │               │ PURCHASED   │ ← PO approved & confirmed
     │               └──────────────┘
     │
     └─ Rejected ──→ ┌──────────┐
                     │ REJECTED │ ← Hủy, có thể tạo PR mới
                     └──────────┘
```

| Status | Meaning | Transition | Owner |
|--------|---------|-----------|-------|
| DRAFT | PR nháp | Submit → PENDING_APPROVAL | Requester |
| PENDING_APPROVAL | Chờ duyệt | Approve → APPROVED / Reject → REJECTED | Approver |
| APPROVED | Đã duyệt | Auto → IN_QUOTATION | System |
| IN_QUOTATION | Chờ báo giá | After quotations received → EVALUATED | Procurement |
| EVALUATED | Đã đánh giá | Select best → PO_CREATED | Procurement |
| PO_CREATED | PO tạo từ PR | Auto after PO approved → PURCHASED | System |
| PURCHASED | Đã mua | Persists until GRN complete | - |
| REJECTED | Bị từ chối | (terminal) | - |

---

### 📦 Purchase Order (PO) Status Flow

```
┌──────┐
│DRAFT │ ← PO nháp từ Quotation
└─┬────┘
  │ Submit
  ▼
┌──────────────────┐
│PENDING_APPROVAL  │ ← 3-tier approval (amount-based)
└─┬────────────────┘
  │
  ├─ Approved ──→ ┌─────────┐
  │               │APPROVED │ ← PO approved
  │               └─┬──────┘
  │                 │
  │             ┌───▼────────┐
  │             │ACKNOWLEDGED│ ← Supplier confirms
  │             └─┬───────────┘
  │               │
  │           ┌───▼────────┐
  │           │IN_PROGRESS │ ← Supplier manufacturing/shipping
  │           └─┬───────────┘
  │             │
  │         ┌───▼──────┐
  │         │SHIPPED   │ ← Goods in transit
  │         └─┬────────┘
  │           │
  │       ┌───▼──────────┐
  │       │GRN_CREATED   │ ← Warehouse received & QC passed
  │       └─┬─────────────┘
  │         │
  │     ┌───▼────────┐
  │     │INVOICED    │ ← Supplier invoice received & matched
  │     └─┬───────────┘
  │       │
  │   ┌───▼──────────┐
  │   │COMPLETED     │ ← Payment processed ✓
  │   └──────────────┘
  │
  └─ Rejected ──→ ┌──────────┐
                  │REJECTED  │ ← Approval rejected or cancelled
                  └──────────┘
```

| Status | When | Days | Next Status | Budget Impact |
|--------|------|------|-------------|--------------|
| DRAFT | Just created | - | PENDING_APPROVAL | Reserved |
| PENDING_APPROVAL | Submitted | SLA: 3 days | APPROVED / REJECTED | Reserved (locked) |
| APPROVED | All tiers signed | - | ACKNOWLEDGED | Committed |
| ACKNOWLEDGED | Supplier confirms | - | IN_PROGRESS | Committed |
| IN_PROGRESS | Manufacturing | ~14-30d | SHIPPED | Committed |
| SHIPPED | Dispatch from supplier | ~5-10d | GRN_CREATED | Committed |
| GRN_CREATED | Goods received & QC | 1-3d | INVOICED | Committed |
| INVOICED | Invoice received & matched | 0-7d | COMPLETED | Committed |
| COMPLETED | Payment done | 0-1d | - | **SPENT** |
| REJECTED | Approval denied | - | (terminal) | **Released** |

---

### 📄 Supplier Invoice (SupplierInvoice) Status Flow

```
┌──────┐
│DRAFT │ ← Invoice nháp
└─┬────┘
  │ Submit
  ▼
┌──────────┐
│MATCHING  │ ← Auto 3-way matching runs
└─┬────────┘
  │ Auto matching completes
  │
  ├─ All pass ──→ ┌──────────────┐
  │               │AUTO_APPROVED │ ← Ready for payment
  │               └─┬────────────┘
  │                 │
  │             ┌───▼──────────────┐
  │             │PAYMENT_APPROVED  │ ← Finance approved
  │             └─┬──────────────────┘
  │               │
  │           ┌───▼────────────────┐
  │           │PAYMENT_PROCESSING  │ ← Payment in progress
  │           └─┬──────────────────┘
  │             │
  │         ┌───▼────────┐
  │         │PAID        │ ← Payment completed ✓
  │         └────────────┘
  │
  └─ Any fail ──→ ┌──────────────────┐
                  │EXCEPTION_REVIEW  │ ← Manual review needed
                  └─┬────────────────┘
                    │
                    ├─ Finance approve ──→ PAYMENT_APPROVED
                    └─ Finance reject ──→ REJECTED
```

| Status | Meaning | Auto Trigger | Owner Action | Time |
|--------|---------|--------------|--------------|------|
| DRAFT | Invoice created | - | Submit for matching | 1d |
| MATCHING | 3-way match running | Automatic | - | 0-5min |
| AUTO_APPROVED | All match pass | Automatic | None needed | - |
| EXCEPTION_REVIEW | Match failed | Automatic | Manual review | 1-5d |
| PAYMENT_APPROVED | Approved for payment | From AUTO_APPROVED or manual | None needed | - |
| PAYMENT_PROCESSING | Payment executing | Auto trigger | - | 1d |
| PAID | Payment completed | Automatic | Archive | - |
| REJECTED | Match failed & rejected | Manual decision | Archive | - |

---

### 💳 Payment Status Flow

```
┌────────┐
│PENDING │ ← Payment request created
└─┬──────┘
  │ Execute Payment
  ▼
┌──────────┐
│COMPLETED │ ← Payment processed & approved ✓
└──────────┘

(Optional failure path:)
  │ Payment failed
  ▼
┌──────────┐
│CANCELLED │ ← Payment cancelled/reversed
└──────────┘
```

| Status | Meaning | Precondition | Budget Impact |
|--------|---------|--------------|--------------|
| PENDING | Created, not yet processed | Invoice AUTO_APPROVED or PAYMENT_APPROVED | Committed (unchanged) |
| COMPLETED | Payment executed successfully | None | **Committed → Spent** (transfer) |
| CANCELLED | Payment reversed/failed | None | **Release comitted back to available** |

---

### 💰 Budget Allocation Status Flow

```
┌──────┐
│DRAFT │ ← Budget allocation created
└─┬────┘
  │ Submit
  ▼
┌────────────────┐
│SUBMITTED       │ ← Sent for approval
└─┬───────────────┘
  │
  ├─ Approved ──→ ┌──────────┐
  │               │APPROVED  │ ← Ready to use
  │               │          │
  │               │ (Expires │ ← Budget period end
  │               │  at      │
  │               │  period  │
  │               │  end)    │
  │               └──────────┘
  │
  └─ Rejected ──→ ┌──────────┐
                  │REJECTED  │ ← Resubmit or amend
                  └──────────┘
```

| Status | Available for Use? | Can Create PO? | Notes |
|--------|------------------|-----------------|-------|
| DRAFT | ❌ No | ❌ No | Not yet submitted |
| SUBMITTED | ❌ No | ❌ No | Awaiting approval |
| APPROVED | ✅ Yes | ✅ Yes | Active budget |
| REJECTED | ❌ No | ❌ No | Requires resubmit |

---

### 📊 Supplier KPI Score & Tier Flow

```
┌────────────────┐
│UNSCORED        │ ← New supplier
└─┬───────────────┘
  │ After 1st PO completion
  ▼
┌──────────────────────────────┐
│CALCULATING... (AI evaluation) │ ← 6 metrics + AI analysis
└─┬─────────────────────────────┘
  │ Calculation complete
  ▼
┌──────────┐  ┌──────────┐  ┌────────┐
│GOLD ⭐⭐⭐ │  │SILVER ⭐⭐ │  │BRONZE ⭐│
└────┬─────┘  └────┬─────┘  └───┬────┘
     │             │            │
     │ Quarterly   │ Quarterly  │ Quarterly
     │ (Every Q)   │ (Every Q)  │ (Every Q)
     │             │            │
     ▼             ▼            ▼
  (Update Score & Tier based on latest 6-month data)
```

| Tier | Score | OTD | Quality | Manual | Disputes | Benefits |
|------|-------|-----|---------|--------|----------|----------|
| **GOLD** ⭐⭐⭐ | ≥90 | 95%+ | 98%+ | 4+/5 | 0 | Preferred, fast payment, high volume |
| **SILVER** ⭐⭐ | 75-89 | 85%+ | 90%+ | 3+/5 | ≤2 | Standard, normal terms |
| **BRONZE** ⭐ | <75 | <85% | <90% | <3/5 | >2 | Under review, strict QC, limited orders |

---

## �🛠️ Hướng dẫn Cài đặt & Chạy (Installation & Setup)

### 1️⃣ Yêu cầu tiên quyết

```bash
# Check versions
node --version      # v18.17.0 or higher
npm --version       # v9.6.0 or higher
docker --version    # Latest Docker Desktop

# Install PostgreSQL 16 & Redis 7
# Option A: Docker
docker run --name postgres-oms \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=oms_db \
  -p 5432:5432 \
  -d postgres:16

docker run --name redis-oms \
  -p 6379:6379 \
  -d redis:7-alpine
```

### 2️⃣ Backend Setup

```bash
cd server

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Database setup
npx prisma generate      # Generate Prisma client
npx prisma db push      # Sync schema to DB
npx prisma migrate dev  # Run migrations

# Seed data
npx ts-node prisma/seed.ts
npx ts-node prisma/seed_budget_approval_rules.ts
npx ts-node prisma/seed_fpt_software.ts
npx ts-node prisma/seed_fpt_shop.ts

# Start server
npm run start:dev        # http://localhost:3000
```

**Required .env variables:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/oms_db"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="your-super-secret-key"
JWT_EXPIRATION="24h"
REFRESH_TOKEN_EXPIRATION="7d"
GEMINI_API_KEY="your-google-ai-key"
NODE_ENV="development"
```

### 3️⃣ Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with API URL

# Development server
npm run dev              # http://localhost:3000

# Build for production
npm run build
npm run start
```

**Required .env.local variables:**
```env
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_WS_URL="ws://localhost:3000"
```

### 4️⃣ Verify Installation

```bash
# Test backend API
curl -X GET http://localhost:3000/api/budgets/periods \
  -H "Authorization: Bearer {token}"

# Test frontend
open http://localhost:3000/login

# Check logs
docker logs postgres-oms
docker logs redis-oms
npm logs  # Terminal where server runs
```

---

## 📖 Hướng dẫn Seed Data & Testing

### Seed Data Execution Order

```bash
# 1. Base seed (Organizations, Users, Cost Centers)
npx ts-node prisma/seed.ts

# 2. Budget periods & approval rules
npx ts-node prisma/seed_budget_approval_rules.ts

# 3. Suppliers with categories & products
npx ts-node prisma/seed_fpt_software.ts
npx ts-node prisma/seed_fpt_shop.ts

# 4. Budget allocation for testing
npx ts-node prisma/seed_budget_for_testing.ts

# 5. Products & categories
npx ts-node prisma/seed_vn_products.ts

# 6. Cleanup (if needed)
npx ts-node prisma/cleanup_budget_duplicates.ts
```

### Test Data Available

**Organizations:**
- FPT Corporation (Main)
- FPT Software (Supplier, 95 trust score, 6 categories, 32 products)
- FPT Shop (Supplier, 92 trust score, 10 categories, 43 products)

**Users:**
- Admin, Finance Director, CEO, Procurement Manager, etc.

**Budget Periods:**
- Q1/2026, Q2/2026, Q3/2026, Q4/2026
- Reserve periods for emergency fund

**Approval Rules:**
- 3 tiers: Finance (0-500M), Director (500M-1B), CEO (>1B)

---

## �‍💻 Thông Tin Phát Triển (Developer Information)

### 📝 Tác Giả & Liên Hệ

**Người Phát Triển Hệ Thống:**
```
Họ và Tên:          Nguyễn Đình Nam
Email:              nguyendinhnam241209@gmail.com
Số Điện Thoại:      0908651852
Chuyên Môn:         Full-Stack Development (NestJS, Next.js, Prisma, PostgreSQL)
Vị Trí:             Senior Software Engineer - E-Procurement Systems
```

### 📋 Thông Tin Dự Án

**Tên Dự Án:** Smart E-Procurement & Order Management System (OMS)  
**Phiên Bản:** 2.0  
**Trạng Thái:** ✅ 99% Hoàn Thành - Sẵn Sàng Vận Hành  
**Ngày Cập Nhật:** 04/04/2026  
**License:** Proprietary (FPT Corporation)

### 🎯 Mục Đích Dự Án

Xây dựng một hệ thống quản trị mua sắm tập trung toàn diện, tự động hóa toàn bộ chu trình từ yêu cầu mua sắm (PR) đến thanh toán (Payment), kèm theo:

- ✅ **Dual-Flow Procurement:** Hỗ trợ cả Flow 1 (giá ổn định) và Flow 2 (giá thay đổi)
- ✅ **Smart Invoice Matching:** Đối soát 3 chiều tự động (PO ↔ GRN ↔ Invoice)
- ✅ **AI Supplier Evaluation:** Đánh giá nhà cung cấp real-time bằng AI
- ✅ **Budget Management by Category:** Quản lý ngân sách theo danh mục sản phẩm
- ✅ **3-Tier Approval Workflow:** Duyệt theo 3 cấp tự động escalation
- ✅ **Comprehensive Audit Trail:** Ghi log tất cả hoạt động

### 🏆 Thành Tựu Chính

#### Phase 1: Product Management & RFQ Flow (100% ✅)
- Phân biệt CATALOG vs NON_CATALOG items
- Auto-routing dựa vào PriceVolatility
- RFQ với 30-day deadline
- Supplier bidding management

#### Phase 2: Budget Management by Category (95% ✅)
- Hierarchical budget allocation
- Composite unique constraint: [period, costCenter, dept, category]
- Budget code auto-generation
- Budget state: Allocated → Committed → Spent

#### Phase 3: 3-Tier Approval System (100% ✅)
- Finance (0-500M) → Director (500M-1B) → CEO (>1B)
- Auto-escalation after 72 hours SLA
- Sequential multi-step approval
- Parallel email notifications (BullMQ)

#### Phase 4: Enterprise Automation (100% ✅)
- PR Approved → Auto RFQ/Quotation
- RFQ Closed → Auto PO creation
- PO Approved → Auto GRN template
- GRN Completed → Auto invoice matching
- 3-Way Matching with tolerance (2% qty, 1% price)
- Invoice Match → Auto payment creation

#### Phase 5: Supplier Performance Scoring (100% ✅)
- 6 metrics: OTD, Quality, Manual Review, Buyer Rating, Disputes, AI Analysis
- Quarterly KPI scores with quarterly lookback
- Supplier tier: GOLD/SILVER/BRONZE
- Auto-trigger on PO confirmation
- Gemini AI integration

### 📊 Project Statistics

```
Backend Implementation:
  ├─ NestJS Modules: 15+
  ├─ Service Classes: 20+
  ├─ Controllers: 25+
  ├─ Database Models: 50+
  ├─ API Endpoints: 100+
  ├─ Business Logic Lines: 15,000+
  └─ Test Coverage: 70%+

Frontend Implementation:
  ├─ Next.js Pages: 40+
  ├─ React Components: 80+
  ├─ TypeScript Types: 100+
  ├─ UI Pages: 25+
  └─ Context Providers: 8

Database:
  ├─ PostgreSQL Tables: 50+
  ├─ Indexes: 100+
  ├─ Triggers: 5+
  ├─ Views: 3+
  └─ Migrations: 20+

Documentation:
  ├─ Technical Docs: 15+ files
  ├─ Process Flows: 8+ diagrams
  ├─ API Docs: 50+ endpoints
  └─ README Files: 5+ guides
```

### 🔧 Technology Stack

**Frontend:**
- Next.js 16.1 (React Server Components)
- React 19.2 (Hooks, Concurrent Features)
- TypeScript 5.7 (Strict Mode)
- TailwindCSS 4 (Utility-first CSS)
- Shadcn/ui (Component Library)

**Backend:**
- NestJS 11 (Progressive Framework)
- TypeScript 5.7 (Type Safety)
- Prisma 7.5 (Next-Gen ORM)
- PostgreSQL 16 (Database)
- BullMQ (Job Queue)
- Gemini AI (Google AI)

**DevOps & Tools:**
- Docker (Containerization)
- GitHub Actions (CI/CD)
- ESLint (Code Quality)
- Prettier (Code Formatting)
- Jest (Testing Framework)

### 🎓 Key Learning & Patterns

**Architectural Patterns:**
1. **Option 1 Architecture:** Centralized automation logic in single service
2. **Event-Driven Design:** Async workflows with BullMQ
3. **Repository Pattern:** Data access abstraction
4. **Service Layer Pattern:** Business logic encapsulation
5. **Guard-Based RBAC:** Role-based access control at controller level

**Design Patterns Applied:**
1. **Factory Pattern:** Document creation (PR → RFQ → PO)
2. **Observer Pattern:** Event-driven triggers
3. **Strategy Pattern:** Flow decision (CATALOG vs NON_CATALOG)
4. **State Pattern:** Status transitions (Draft → Approved → Completed)
5. **Decorator Pattern:** Custom decorators for auth/logging

### 📚 Documentation Files

```
server/
├── README.md                              # Main system overview
├── TWO_PROCESSES_EXPLAINED.md            # Detailed process flows
├── IMPLEMENTATION_VERIFICATION_REPORT.md # Component verification
├── FLOW_COMPARISON_DIAGRAM.md            # Flow 1 vs Flow 2 comparison
├── FLOW_LEARNING_GUIDE.md                # Beginner's guide
├── FLOW_2_EXPLAINED_DETAILED.md          # Flow 2 deep dive
├── FLOW_REAL_WORLD_EXAMPLES.md           # Real business scenarios
├── HOW_TO_TEST_TWO_FLOWS.md              # Testing procedures
├── FILTER_LOCATION_DECISION.md           # Filter logic explanation
├── REFACTOR_COMPLETED_OPTION1.md         # Refactoring summary
└── TWO_PROCESSES_EXPLAINED.md            # Process documentation
```

### 🚀 Deployment Status

**Development Environment:** ✅ Ready
- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:3000`
- Database: PostgreSQL 16 running
- Redis: Ready for BullMQ jobs

**Staging Environment:** ⏳ Pending
- Docker compose setup prepared
- Environment vars configured
- Health checks implemented

**Production Environment:** ⏳ Planned
- Multi-region deployment ready
- Load balancer configuration
- Database backup strategy
- Monitoring & alerting setup

### 📞 Contact & Support

**Questions or Issues:**
```
Email:   nguyendinhnam241209@gmail.com
Phone:   0908651852
GitHub:  Contact for repository access
Slack:   Internal team channel #oms-dev
```

**Response Time:**
- Critical bugs: Within 2 hours
- Feature requests: Within 1 business day
- Questions: Within 4 business days

### 📄 File Structure & Conventions

**Naming Conventions:**
```
Classes:              PascalCase (UserService, ApprovalModule)
Files:                kebab-case (user.service.ts, approval.module.ts)
Variables/Functions:  camelCase (getUserBalance, calculateBudget)
Constants:            UPPER_SNAKE_CASE (MAX_BUDGET_AMOUNT, API_TIMEOUT)
Database Tables:      snake_case (budget_allocations, approval_workflows)
```

**Code Organization:**
```
src/
├── module-name/
│   ├── module-name.module.ts        # Module definition
│   ├── module-name.service.ts       # Business logic
│   ├── module-name.controller.ts    # HTTP endpoints
│   ├── module-name.repository.ts    # Data access
│   ├── dto/
│   │   ├── create-module-name.dto.ts
│   │   └── update-module-name.dto.ts
│   └── __tests__/
│       └── module-name.service.spec.ts
```

### ✅ Quality Assurance

**Testing Strategy:**
- Unit Tests: 70%+ coverage on services
- Integration Tests: Core workflows tested
- E2E Tests: Happy path scenarios
- Manual Testing: All status transitions verified

**Code Quality Checks:**
```bash
npm run lint          # ESLint check
npm run format        # Prettier formatting
npm run build         # TypeScript compilation
npm run test          # Jest test suite
```

### 🔐 Security Considerations

- ✅ JWT token-based authentication
- ✅ RBAC with 8 distinct user roles
- ✅ SQL injection prevention (Prisma ORM)
- ✅ CORS properly configured
- ✅ Rate limiting implemented
- ✅ Helmet security headers
- ✅ Encrypted sensitive data storage
- ✅ Comprehensive audit logging

### 📈 Performance Targets

- API Response Time: < 500ms (P95)
- Database Query Time: < 100ms (P95)
- Frontend Load Time: < 3s (First Contentful Paint)
- Concurrent Users Supported: 1,000+
- Transaction Throughput: 100+ POs/day

### 🎯 Future Enhancements

**Planned Features (v2.1):**
1. Mobile app (React Native)
2. Advanced analytics dashboard
3. ML-based price forecasting
4. Supplier performance predictive analytics
5. Blockchain-based audit trail
6. Multi-currency support
7. Integration with ERP systems (SAP, Oracle)
8. Advanced reporting engine

**Performance Improvements (v2.2):**
1. Caching layer (Redis) optimization
2. Database query optimization
3. Frontend lazy loading
4. API response compression
5. CDN integration

### 📖 How to Contribute

1. **Clone Repository**
   ```bash
   git clone <repo-url>
   cd Order_management_system
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Follow Code Standards**
   - Run `npm run lint` before committing
   - Write unit tests for new features
   - Update documentation

4. **Submit Pull Request**
   - Describe changes clearly
   - Link related issues
   - Request review from team

### 📞 Liên Hệ Trực Tiếp

Nếu có bất kỳ câu hỏi, góp ý, hoặc mong muốn tìm hiểu thêm về hệ thống:

```
📧 Email:     nguyendinhnam241209@gmail.com
📱 Phone:     0908651852
💼 LinkedIn:  (available upon request)
🌐 GitHub:    (private repository)
```

**Thời gian phản hồi:**
- Lỗi Critical: 2 giờ
- Câu hỏi kỹ thuật: 1 ngày
- Yêu cầu tính năng: 2-3 ngày

---

## �🚨 Troubleshooting & Known Issues

### Database Issues

**Issue: "Unique constraint failed"**
```bash
# Solution: Run cleanup script
npx ts-node prisma/cleanup_budget_duplicates.ts

# Then re-sync
npx prisma migrate resolve --rolled-back
npx prisma db push
```

**Issue: "Foreign key constraint violated"**
```bash
# Ensure all seed scripts run in order
# Check cascade delete rules in schema.prisma

model ApprovalStep {
  workflow  ApprovalWorkflow @relation(..., onDelete: Cascade)
}
```

### Authentication Issues

**Issue: "Invalid JWT token"**
```bash
# Check JWT_SECRET is set in .env
# Ensure token not expired (JWT_EXPIRATION)
# Use refresh-token endpoint to get new token
```

### API Issues

**Issue: "CORS error"**
```bash
# In server/src/main.ts
app.enableCors({
 origin: 'http://localhost:3000',
 credentials: true
});
```

### Build Issues

**Issue: TypeScript compilation error**
```bash
cd server
npm run build      # Shows detailed errors
tsc --noEmit       # Generate types
```

---

## 📊 System Metrics

- **Database Tables**: 50+
- **API Endpoints**: 100+
- **Business Modules**: 13
- **User Roles**: 8
- **Approval Levels**: 3
- **Auto-Triggers**: 8+
- **Cron Jobs**: 5+

---

## 👥 Development Team

- **Lead**: System Architect
- **Status**: In Active Development (April 2026)
- **Last Update**: Budget allocation approval integration completed

---

## 📞 Support & Documentation

For detailed API documentation, see:
- `server/src/**/*.controller.ts` - Endpoint definitions
- `server/prisma/schema.prisma` - Database schema
- `client/app/**` - Frontend route structure

For questions or issues:
1. Check `.env` configuration
2. Review database migrations
3. Check server console logs
4. Run `npm run build` for type issues

---

**Generated: April 4, 2026**
**System Status: ✅ Production Ready (with 95%+ functionality)**
