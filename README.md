# Smart E-Procurement & Order Management System (OMS)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)

Hệ thống **E-Procurement** và **Order Management** chuẩn Enterprise cho doanh nghiệp Việt Nam. Quản lý toàn bộ chu trình **Procure-to-Pay** — từ yêu cầu mua hàng, phê duyệt đa cấp, đấu thầu, phát hành đơn hàng, nhập kho, đối soát hóa đơn đến thanh toán — tích hợp AI (Google Gemini) và RAG (Retrieval-Augmented Generation) để tự động hóa và hỗ trợ ra quyết định.

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Luồng nghiệp vụ chính](#3-luồng-nghiệp-vụ-chính)
   - 3.1 [Procure-to-Pay (P2P) — Luồng tổng quát](#31-procure-to-pay-p2p--luồng-tổng-quát)
   - 3.2 [Tạo và phê duyệt Purchase Requisition (PR)](#32-tạo-và-phê-duyệt-purchase-requisition-pr)
   - 3.3 [Quy trình RFQ và lựa chọn nhà cung cấp](#33-quy-trình-rfq-và-lựa-chọn-nhà-cung-cấp)
   - 3.4 [Tạo Purchase Order và hợp nhất PR (PO Consolidation)](#34-tạo-purchase-order-và-hợp-nhất-pr-po-consolidation)
   - 3.5 [Nhập kho và kiểm tra chất lượng (GRN/QC)](#35-nhập-kho-và-kiểm-tra-chất-lượng-grnqc)
   - 3.6 [Đối soát 3 chiều và thanh toán](#36-đối-soát-3-chiều-và-thanh-toán)
   - 3.7 [Tự động hóa qua Email (AI Email Processor)](#37-tự-động-hóa-qua-email-ai-email-processor)
   - 3.8 [Phê duyệt đa cấp và SLA Escalation](#38-phê-duyệt-đa-cấp-và-sla-escalation)
   - 3.9 [Kiểm soát ngân sách](#39-kiểm-soát-ngân-sách)
4. [Các tính năng nổi bật](#4-các-tính-năng-nổi-bật)
5. [Công nghệ sử dụng](#5-công-nghệ-sử-dụng)
6. [Cấu trúc dự án](#6-cấu-trúc-dự-án)
7. [Hướng dẫn cài đặt](#7-hướng-dẫn-cài-đặt)
8. [Biến môi trường](#8-biến-môi-trường)
9. [Phân quyền người dùng (RBAC)](#9-phân-quyền-người-dùng-rbac)
10. [API Overview](#10-api-overview)

---

## 1. Tổng quan hệ thống

OMS giải quyết bài toán mua sắm doanh nghiệp phức tạp bằng cách số hóa và tự động hóa toàn bộ chuỗi giá trị:

| Vấn đề truyền thống | Giải pháp OMS |
|---|---|
| PR/PO làm thủ công qua email/Excel | Tạo PR/PO trực tuyến, tích hợp phê duyệt số |
| Phê duyệt chậm, không có SLA | Phê duyệt đa cấp tự động, escalation khi quá hạn |
| Không kiểm soát được ngân sách thực | Committed/Spent tracking real-time theo Cost Center |
| Chọn nhà cung cấp cảm tính | AI chấm điểm báo giá, KPI nhà cung cấp tự động |
| Đối soát hóa đơn thủ công, hay nhầm | 3-Way Matching tự động (PO vs GRN vs Invoice) |
| Không có lịch sử thay đổi | Audit trail đầy đủ mọi chứng từ |
| Email mua hàng bị bỏ sót | AI đọc email, tự động tạo PR nháp |

---

## 2. Kiến trúc tổng thể

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js 16)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │Procurement│ │ Finance  │ │Warehouse │ │   Supplier   │  │
│  │  Portal  │ │Dashboard │ │  Portal  │ │    Portal    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└───────────────────────┬────────────────────────────────────┘
                        │ REST API / WebSocket
┌───────────────────────▼────────────────────────────────────┐
│                   SERVER (NestJS 11)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │PR Module │ │PO Module │ │RFQ Module│ │Approval Mod. │  │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────┤  │
│  │GRN Module│ │ Invoice  │ │ Payment  │ │Budget Module │  │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────┤  │
│  │AI Service│ │RAG/Vector│ │Email Proc│ │Notification  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└──────┬────────────┬──────────────┬──────────────┬──────────┘
       │            │              │              │
┌──────▼───┐  ┌─────▼──────┐ ┌───▼────┐  ┌──────▼────────┐
│PostgreSQL│  │   Redis    │ │Gemini  │  │  SMTP / IMAP  │
│+ pgvector│  │  (BullMQ)  │ │  API   │  │  / Twilio SMS │
└──────────┘  └────────────┘ └────────┘  └───────────────┘
```

---

## 3. Luồng nghiệp vụ chính

### 3.1 Procure-to-Pay (P2P) — Luồng tổng quát

```mermaid
flowchart TD
    A([Bắt đầu: Nhu cầu mua hàng]) --> B[Tạo Purchase Requisition - PR]
    B --> C{Hàng catalog\ncó sẵn?}

    C -->|Có - Direct PO| D[Tạo PO trực tiếp]
    C -->|Không - Non-catalog| E[Tạo RFQ\nMời nhà cung cấp báo giá]

    E --> F[Nhà cung cấp nộp Quotation]
    F --> G[AI chấm điểm báo giá\n1-5 sao + Recommend/Reject]
    G --> H[Chọn nhà cung cấp thắng thầu]
    H --> D

    D --> I{Cần hợp nhất\nnhiều PR?}
    I -->|Có - Consolidate| J[PO Consolidation\nGom theo SKU / Category]
    I -->|Không| K[PO đơn lẻ]
    J --> L[Phê duyệt PO đa cấp]
    K --> L

    L -->|Từ chối| M([Reject - Trả về])
    L -->|Phê duyệt| N[PO ISSUED\nGửi cho nhà cung cấp]

    N --> O[Nhà cung cấp xác nhận\nACKNOWLEDGED]
    O --> P[Giao hàng - Tạo GRN nháp]
    P --> Q[Warehouse nhận hàng\n& QC kiểm tra]
    Q --> R{QC kết quả}
    R -->|Pass| S[GRN CONFIRMED]
    R -->|Fail| T[Return to Vendor - RTV]

    S --> U[Nhà cung cấp\nnộp Hóa đơn]
    U --> V[3-Way Matching\nPO vs GRN vs Invoice]
    V --> W{Kết quả đối soát}
    W -->|Khớp tự động| X[AUTO_APPROVED\nChuyển thanh toán]
    W -->|Sai lệch nhỏ| Y[Manual Review\nBộ phận Finance xem xét]
    W -->|Sai lệch lớn| Z[Dispute\nMở tranh chấp]

    X --> AA[Payment COMPLETED\nCập nhật ngân sách: Committed → Spent]
    Y --> AA
    Z --> AB([Giải quyết tranh chấp\nEscrow Release])

    AA --> AC([Kết thúc: Đánh giá KPI nhà cung cấp])
```

---

### 3.2 Tạo và phê duyệt Purchase Requisition (PR)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Requester tạo PR\n(nhập items, estimate price)

    DRAFT --> DRAFT : Kiểm tra ngân sách\n(Cost Center / Category)
    DRAFT --> PENDING_APPROVAL : Submit PR\n(Budget committed tạm thời)

    PENDING_APPROVAL --> APPROVED : Tất cả cấp phê duyệt\nchấp thuận

    PENDING_APPROVAL --> REJECTED : Bất kỳ cấp nào\ntừ chối

    REJECTED --> DRAFT : Requester chỉnh sửa\nvà submit lại

    APPROVED --> IN_SOURCING : Chuyển sang quy trình\nRFQ / tìm NCC

    APPROVED --> PO_CREATED : Tạo PO trực tiếp\n(hàng catalog)

    IN_SOURCING --> PO_CREATED : RFQ kết thúc\nPO được tạo

    PO_CREATED --> [*]
```

**Ngưỡng phê duyệt mặc định:**

| Giá trị PR | Cấp phê duyệt |
|---|---|
| < 10 triệu VND | Dept Approver |
| 10 – 50 triệu VND | Dept Approver → Director |
| 50 – 100 triệu VND | Director → CFO |
| > 100 triệu VND | CFO → CEO |

---

### 3.3 Quy trình RFQ và lựa chọn nhà cung cấp

```mermaid
sequenceDiagram
    participant P as Procurement
    participant S1 as Nhà cung cấp A
    participant S2 as Nhà cung cấp B
    participant AI as Gemini AI
    participant SYS as System

    P->>SYS: Tạo RFQ từ PR đã duyệt
    SYS->>AI: Gợi ý danh sách NCC phù hợp
    AI-->>SYS: Trả về top NCC theo category/history
    SYS->>S1: Gửi email mời báo giá
    SYS->>S2: Gửi email mời báo giá

    S1->>SYS: Nộp Quotation (giá, thời gian, điều khoản)
    S2->>SYS: Nộp Quotation (giá, thời gian, điều khoản)

    Note over S1,S2: Q&A Thread: NCC hỏi,\nProcurement trả lời

    P->>AI: Phân tích báo giá
    AI-->>P: Điểm 1-5 sao, Pros/Cons,\nRECOMMEND/CONSIDER/REJECT

    P->>SYS: Award RFQ → Chọn NCC thắng
    SYS->>P: Tạo PO từ Quotation thắng
```

**AI phân tích quotation dựa trên:**
- Giá so với thị trường và lịch sử mua
- Thời gian giao hàng vs. yêu cầu
- Điều khoản thanh toán
- KPI lịch sử của NCC (OTD, Quality Score)

---

### 3.4 Tạo Purchase Order và hợp nhất PR (PO Consolidation)

```mermaid
flowchart LR
    subgraph PRs["PRs đã được phê duyệt"]
        PR1["PR-001\nA4 paper × 50\nBút × 100"]
        PR2["PR-002\nA4 paper × 30\nStapler × 10"]
        PR3["PR-003\nBút × 50\nFolder × 20"]
    end

    subgraph Consolidate["PO Consolidation Engine"]
        direction TB
        M1["Mode: SKU_MATCH\nGom theo mã SKU"] 
        M2["Mode: CATEGORY_MATCH\nGom theo danh mục"]
    end

    subgraph PO["PO duy nhất (gửi 1 NCC)"]
        I1["A4 paper: 80 hộp\n(50 + 30 từ PR1, PR2)"]
        I2["Bút: 150 cái\n(100 + 50 từ PR1, PR3)"]
        I3["Stapler: 10 cái"]
        I4["Folder: 20 cái"]
    end

    subgraph Trace["PoItemSource — Truy vết"]
        T1["PO Item A4 ← PR1 (50) + PR2 (30)"]
        T2["PO Item Bút ← PR1 (100) + PR3 (50)"]
    end

    PRs --> Consolidate
    Consolidate --> PO
    PO --> Trace
```

**Lợi ích Consolidation:**
- Giảm số lượng PO gửi đến NCC (đơn lớn hơn = giá tốt hơn)
- Truy vết từng item PO về PR gốc để kiểm toán
- Tự động reserve budget theo từng Cost Center của từng PR

---

### 3.5 Nhập kho và kiểm tra chất lượng (GRN/QC)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : PO được NCC xác nhận\n(Auto-tạo GRN nháp)

    DRAFT --> CONFIRMED : Warehouse nhận hàng\nCập nhật số lượng thực nhận

    CONFIRMED --> QC_IN_PROGRESS : Bắt đầu kiểm tra chất lượng

    QC_IN_PROGRESS --> QC_PASSED : Tất cả items\nQC PASS

    QC_IN_PROGRESS --> QC_PARTIAL : Một số items\nQC FAIL / HOLD

    QC_PASSED --> RECEIVED : Hoàn tất nhập kho
    QC_PARTIAL --> RECEIVED : Nhập hàng đạt\nMở RTV cho hàng lỗi

    RECEIVED --> [*] : PO status → GRN_CREATED\nTrigger: Nhà cung cấp nộp Invoice
```

**QC kết quả per item:** `PASS` | `FAIL` | `HOLD` (cần kiểm tra thêm)

Khi có item FAIL → Tự động tạo **Return to Vendor (RTV)** để trả hàng và tính vào KPI nhà cung cấp.

---

### 3.6 Đối soát 3 chiều và thanh toán

```mermaid
flowchart TD
    INV["Hóa đơn NCC\n(SupplierInvoice)"] --> M["3-Way Matching Engine"]
    PO["Purchase Order\n(Giá, Số lượng đặt)"] --> M
    GRN["Goods Receipt Note\n(Số lượng thực nhận, QC Pass)"] --> M

    M --> C1{"PO Qty vs GRN Qty\n±2% tolerance"}
    M --> C2{"PO Price vs Invoice Price\n±1% tolerance"}
    M --> C3{"GRN Qty vs Invoice Qty\nExact match"}

    C1 -->|OK| R1[Pass]
    C2 -->|OK| R2[Pass]
    C3 -->|OK| R3[Pass]

    R1 & R2 & R3 --> OK["AUTO_APPROVED\nStatus: PAYMENT_APPROVED"]

    C1 -->|Lệch < ngưỡng| EX1[Exception]
    C2 -->|Lệch < ngưỡng| EX2[Exception]
    EX1 & EX2 --> MR["MANUAL_REVIEW\nFinance xem xét thủ công"]

    C1 -->|Lệch lớn| F1[Fail]
    C2 -->|Lệch lớn| F2[Fail]
    C3 -->|Không khớp| F3[Fail]
    F1 & F2 & F3 --> DSP["DISPUTE\nMở tranh chấp\nEscrow tạm giữ tiền"]

    OK --> PAY["Payment COMPLETED\nBudget: Committed → Spent"]
    MR --> PAY
    DSP --> RES["Giải quyết tranh chấp\n→ Release / Clamback Escrow"]
```

---

### 3.7 Tự động hóa qua Email (AI Email Processor)

Hệ thống lắng nghe hộp thư đến qua IMAP. Khi có email mua hàng gửi đến mailbox hệ thống:

```mermaid
sequenceDiagram
    participant EMP as Nhân viên
    participant MB as Mailbox (IMAP)
    participant EP as Email Processor
    participant RAG as RAG / Vector DB
    participant AI as Gemini AI
    participant DB as Database

    EMP->>MB: Gửi email: "Cần mua 100 hộp A4..."
    MB->>EP: Email Listener polling phát hiện email mới
    EP->>RAG: Bước 1: Ingest email vào Vector DB\n(lưu embedding để tìm kiếm sau)
    EP->>AI: Bước 2: Phân tích nội dung email
    AI-->>EP: intent: CREATE_PR\nitem: A4 paper, qty: 100, price: 150k\nconfidence: 0.92

    alt confidence >= 0.7
        EP->>DB: Bước 3: Tìm user theo email người gửi
        DB-->>EP: User: Nguyễn Văn A, dept: Sales, org: ABC Corp
        EP->>DB: Bước 4: Tạo PR nháp tự động\nstatus: DRAFT
        EP-->>EMP: Thông báo: PR đã được tạo,\nvui lòng kiểm tra và submit
    else confidence < 0.7
        EP-->>EMP: Không thể xử lý tự động\n(email không rõ yêu cầu mua hàng)
    end
```

**Các intent AI có thể nhận diện:**

| Intent | Hành động |
|---|---|
| `CREATE_PR` | Tự động tạo PR nháp với items trích xuất từ email |
| `UPDATE_PO` | Ghi nhận yêu cầu cập nhật PO (thông báo cho Procurement) |
| `GENERAL_INQUIRY` | Ingest vào RAG để tìm kiếm sau, không tạo chứng từ |

---

### 3.8 Phê duyệt đa cấp và SLA Escalation

```mermaid
flowchart TD
    SUB["Document Submitted\n(PR / PO / Invoice / Payment)"] --> RULE["Lookup ApprovalMatrixRule\ntheo: DocType + Amount + Org"]

    RULE --> STEPS["Tạo workflow steps\ntheo thứ tự cấp (level 1, 2, 3...)"]

    STEPS --> L1["Level 1: DEPT_APPROVER\nSLA: 24h"]
    L1 -->|Duyệt| L2["Level 2: DIRECTOR\nSLA: 48h"]
    L1 -->|Từ chối| REJ["Document → REJECTED\nThông báo Requester"]
    L2 -->|Duyệt| L3["Level 3: CFO/CEO\nSLA: 72h"]
    L2 -->|Từ chối| REJ
    L3 -->|Duyệt| APR["Document → APPROVED\nTrigger automation"]
    L3 -->|Từ chối| REJ

    L1 -->|Quá SLA| ESC1["Escalate lên Manager\nThông báo SMS + Email"]
    L2 -->|Quá SLA| ESC2["Escalate lên CFO\nThông báo SMS + Email"]

    subgraph Delegation["Delegation (Ủy quyền)"]
        D["Nếu Approver vắng mặt\n→ UserDelegate kích hoạt\n→ Delegate thực hiện thay"]
    end

    APR --> AUTO["AutomationService:\nPR APPROVED → Route sang RFQ hoặc trực tiếp PO\nPO APPROVED → Reserve budget\nInvoice APPROVED → Trigger payment"]
```

---

### 3.9 Kiểm soát ngân sách

```mermaid
flowchart LR
    subgraph Budget["BudgetAllocation (per Cost Center + Category + Period)"]
        ALL["Allocated\n100,000,000 VND"]
        COM["Committed\n(PR/PO đã duyệt, chưa thanh toán)"]
        SPE["Spent\n(Đã thanh toán)"]
        AVA["Available = Allocated − Committed − Spent"]
    end

    subgraph Events["Sự kiện cập nhật ngân sách"]
        E1["PR Submit\n→ Check Available ≥ PR Total"]
        E2["PO Approved\n→ Committed += PO Total"]
        E3["Invoice Paid\n→ Committed -= Amount\nSpent += Amount"]
        E4["PR Rejected / PO Cancelled\n→ Committed -= Amount (hoàn trả)"]
        E5["Budget Override Request\n→ CFO/CEO duyệt tăng Allocated"]
    end

    E1 -->|Pass| ALL
    E2 --> COM
    E3 --> SPE
    E4 --> COM
    E5 --> ALL
```

**Cảnh báo ngân sách tự động:**
- Khi `Committed + Spent >= 80% Allocated` → Cảnh báo Manager
- Khi `Committed + Spent >= 100% Allocated` → Block submit PR mới
- Requester có thể tạo **Budget Override Request** để xin phép vượt ngân sách

---

## 4. Các tính năng nổi bật

### Mua sắm (Procurement)
- Tạo PR với kiểm tra ngân sách real-time theo Cost Center và Category
- Luồng kép: **Catalog** (tạo PO trực tiếp) vs **Non-catalog** (qua RFQ/đấu thầu)
- **PO Consolidation**: Gom nhiều PR từ nhiều phòng ban thành 1 PO gửi NCC, hỗ trợ SKU_MATCH và CATEGORY_MATCH
- Sửa đổi PO (Amendment) với lịch sử thay đổi
- Hợp đồng tự động cho PO > 50 triệu (ký số + milestone payment)

### AI & Tự động hóa
- **AI Email Processor**: Đọc email hộp thư → tự động tạo PR nháp
- **AI Quotation Scoring**: Chấm điểm 1–5 sao kèm phân tích Pros/Cons, Recommend/Reject
- **AI Supplier Recommendation**: Gợi ý NCC phù hợp khi tạo RFQ
- **RAG Chat**: Truy vấn ngôn ngữ tự nhiên ("Tháng này IT đã chi bao nhiêu?")
- **RAG PR Generator**: Tạo PR nháp từ mô tả ngôn ngữ tự nhiên

### Tài chính & Kiểm soát
- Ngân sách 3 trạng thái: Allocated / Committed / Spent per Cost Center × Category × Period
- 3-Way Matching tự động với ngưỡng dung sai có thể cấu hình
- Budget Override Request với quy trình phê duyệt riêng
- Escrow account cho tranh chấp

### Nhà cung cấp
- Cổng NCC riêng biệt (xem PO, acknowledge, upload invoice)
- KPI tự động: OTD %, Quality %, Price Score → Tier: GOLD / SILVER / BRONZE
- Q&A thread trong RFQ (hỏi đáp real-time giữa NCC và Procurement)
- Counter-offer / đàm phán giá

### Vận hành
- Audit Trail đầy đủ mọi thay đổi (ai, khi nào, giá trị trước/sau)
- Thông báo Email + SMS (Twilio) tại mọi bước quan trọng
- Real-time notifications qua WebSocket
- Phân quyền RBAC chi tiết theo vai trò

---

## 5. Công nghệ sử dụng

| Layer | Công nghệ | Mục đích |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19 | SSR/SSG, UI |
| **Styling** | TailwindCSS 4, Lucide Icons | UI components |
| **Forms** | react-hook-form 7, Zod 4 | Validation |
| **Charts** | Recharts 3 | Dashboard biểu đồ |
| **Backend** | NestJS 11, TypeScript 5.7 | API server |
| **ORM** | Prisma 7.5 | DB access, migrations |
| **Database** | PostgreSQL 16 + pgvector | Relational data + vector embeddings |
| **Cache / Queue** | Redis + BullMQ 4 | Job queue, caching |
| **Real-time** | Socket.io 4 | Live notifications |
| **AI** | Google Gemini Flash (gemini-3.1-flash-lite) | Email analysis, quotation scoring, RAG |
| **Email** | Nodemailer (SMTP) + imap-simple (IMAP) | Gửi/nhận email |
| **SMS** | Twilio | Thông báo SMS |
| **Auth** | JWT + Passport.js + bcrypt | Authentication |
| **Security** | Helmet, throttler, class-validator | Security hardening |
| **API Docs** | Swagger / OpenAPI | Auto-generated API docs |

---

## 6. Cấu trúc dự án

```
Order_management_system/
├── server/                          # NestJS Backend (port 3001)
│   ├── src/
│   │   ├── prmodule/               # Purchase Requisition
│   │   ├── pomodule/               # Purchase Order + PO Consolidation
│   │   ├── rfqmodule/              # RFQ & Quotation management
│   │   ├── grnmodule/              # Goods Receipt Note & QC
│   │   ├── invoice-module/         # Supplier Invoice & 3-Way Matching
│   │   ├── payment-module/         # Payment execution & Escrow
│   │   ├── approval-module/        # Approval workflow & SLA escalation
│   │   ├── budget-module/          # Budget allocation & override
│   │   ├── ai-service/             # Gemini AI integration
│   │   ├── rag/                    # RAG: ingest, query, PR generator
│   │   ├── email-processor/        # IMAP listener + AI email parser
│   │   ├── notification-module/    # Email/SMS notifications
│   │   ├── auth-module/            # JWT authentication
│   │   ├── user-module/            # Users & delegation
│   │   ├── supplier-kpimodule/     # Supplier KPI & tier evaluation
│   │   ├── contract-module/        # Contract & milestone payment
│   │   ├── audit-module/           # Audit trail
│   │   ├── organization-module/    # Multi-tenant org management
│   │   ├── budget-module/          # Budget periods & allocations
│   │   ├── dispute-module/         # Dispute resolution
│   │   ├── report-module/          # Spend analytics & reports
│   │   └── prisma/                 # PrismaService
│   ├── prisma/
│   │   ├── schema.prisma           # 58+ models
│   │   └── migrations/
│   └── package.json
│
├── client/                          # Next.js Frontend (port 3000)
│   ├── app/
│   │   ├── (auth)/                 # Login, Register
│   │   ├── procurement/            # PR, PO, RFQ, Quotation pages
│   │   ├── finance/                # Budget, Invoice, Matching, Payment
│   │   ├── warehouse/              # GRN, QC dashboard
│   │   ├── approvals/              # Pending approvals queue
│   │   ├── supplier/               # Supplier portal
│   │   ├── admin/                  # Admin: orgs, users, products, audit
│   │   ├── manager/                # Manager: spend tracking, alerts
│   │   └── reports/                # Analytics & AI reports
│   ├── components/                 # Shared UI components
│   ├── hooks/                      # Custom React hooks
│   ├── services/                   # API client services
│   └── package.json
│
└── README.md
```

---

## 7. Hướng dẫn cài đặt

### Yêu cầu hệ thống

- Node.js >= 20
- PostgreSQL 16 với pgvector extension
- Redis >= 7
- Tài khoản Google Cloud (Gemini API key)

### 1. Clone và cài đặt dependencies

```bash
git clone <repo-url>
cd Order_management_system

# Cài server dependencies
cd server && npm install

# Cài client dependencies
cd ../client && npm install
```

### 2. Cấu hình PostgreSQL với pgvector

```sql
-- Kết nối PostgreSQL với quyền superuser
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### 3. Cấu hình biến môi trường

```bash
# Server
cp server/.env.example server/.env
# Điền các giá trị cần thiết (xem mục 8)

# Client
cp client/.env.example client/.env.local
```

### 4. Khởi tạo database

```bash
cd server

# Chạy migrations
npx prisma migrate deploy

# Seed dữ liệu mẫu (nếu có)
npx prisma db seed
```

### 5. Khởi động development

```bash
# Terminal 1: Backend
cd server && npm run start:dev

# Terminal 2: Frontend
cd client && npm run dev
```

Server chạy tại `http://localhost:3001`  
Client chạy tại `http://localhost:3000`  
Swagger API Docs: `http://localhost:3001/api`

---

## 8. Biến môi trường

### Server (`server/.env`)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/oms_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Email (gửi thông báo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email (nhận email mua hàng — AI Email Processor)
IMAP_HOST=imap.gmail.com
IMAP_USER=procurement@yourcompany.com
IMAP_PASS=your-imap-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_FROM_NUMBER=+84xxxxxxxxx

# App
PORT=3001
NODE_ENV=development
```

### Client (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 9. Phân quyền người dùng (RBAC)

| Role | Quyền chính |
|---|---|
| `REQUESTER` | Tạo/edit PR của mình, xem trạng thái |
| `DEPT_APPROVER` | Duyệt PR của phòng ban, xem budget phòng |
| `DIRECTOR` | Duyệt PR/PO cấp Giám đốc, xem toàn org |
| `CFO` | Duyệt mọi chứng từ tài chính, quản lý budget |
| `CEO` | Duyệt PO/PR cấp cao nhất |
| `PROCUREMENT` | Tạo/quản lý PO, RFQ, chọn NCC |
| `FINANCE` | Duyệt Invoice, Payment, 3-Way Matching |
| `WAREHOUSE` | Tạo/xác nhận GRN, nhập QC kết quả |
| `SUPPLIER` | Xem PO gửi đến, nộp Quotation/Invoice |
| `ADMIN` | Quản lý Users, Departments, Products, Templates |
| `PLATFORM_ADMIN` | Super admin toàn hệ thống |

---

## 10. API Overview

API đầy đủ có tại Swagger: `http://localhost:3001/api`

| Module | Endpoint gốc | Chức năng chính |
|---|---|---|
| Auth | `/auth` | Login, Register, Refresh token |
| Purchase Requisition | `/pr` | CRUD PR, submit, AI suggest |
| RFQ | `/rfq` | Tạo RFQ, mời NCC, award, Q&A |
| Purchase Order | `/po` | CRUD PO, consolidate PRs, amendments |
| GRN | `/grn` | Nhận hàng, QC, confirm |
| Invoice | `/invoice` | Nộp hóa đơn, trigger 3-way matching |
| Payment | `/payment` | Tạo/hoàn thành thanh toán, escrow |
| Approval | `/approval` | Pending list, approve/reject, delegate |
| Budget | `/budget` | Allocation, override request, utilization |
| AI Service | `/ai` | Analyze email, quotation, supplier |
| RAG | `/rag` | Ingest docs, natural language query |
| Email Processor | `/email` | Trigger email processing manually |
| Supplier KPI | `/kpi` | Evaluate supplier, get scores |
| Contract | `/contract` | Create, sign, milestone payment |
| Audit | `/audit` | Audit log by document |
| Notification | `/notification` | Send email/SMS, templates |
| Organization | `/organization` | Register org, KYC |
| User | `/user` | CRUD users, assign roles |
| Report | `/report` | Spend analytics, performance |

---

## Giấy phép

Dự án nội bộ — All rights reserved.
