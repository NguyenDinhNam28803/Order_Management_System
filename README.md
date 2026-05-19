# Smart E-Procurement & Order Management System (OMS)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

Hệ thống **E-Procurement** và **Order Management** chuẩn Enterprise cho doanh nghiệp Việt Nam. Quản lý toàn bộ chu trình **Procure-to-Pay (P2P)** — từ yêu cầu mua hàng, phê duyệt đa cấp, đấu thầu, phát hành đơn hàng, nhập kho, đối soát hóa đơn đến thanh toán — tích hợp AI (Google Gemini, FPT Cloud NLP) và RAG (Retrieval-Augmented Generation) để tự động hóa và hỗ trợ ra quyết định.

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Luồng nghiệp vụ chính](#3-luồng-nghiệp-vụ-chính)
   - 3.1 [Procure-to-Pay — Luồng tổng quát](#31-procure-to-pay-p2p--luồng-tổng-quát)
   - 3.2 [Tạo và phê duyệt Purchase Requisition (PR)](#32-tạo-và-phê-duyệt-purchase-requisition-pr)
   - 3.3 [Quy trình RFQ và lựa chọn nhà cung cấp](#33-quy-trình-rfq-và-lựa-chọn-nhà-cung-cấp)
   - 3.4 [Tạo Purchase Order và hợp nhất PR (PO Consolidation)](#34-tạo-purchase-order-và-hợp-nhất-pr-po-consolidation)
   - 3.5 [Nhập kho và kiểm tra chất lượng (GRN/QC)](#35-nhập-kho-và-kiểm-tra-chất-lượng-grnqc)
   - 3.6 [Đối soát 3 chiều và thanh toán](#36-đối-soát-3-chiều-và-thanh-toán)
   - 3.7 [Khám phá & Xét duyệt nhà cung cấp (AI Supplier Discovery)](#37-khám-phá--xét-duyệt-nhà-cung-cấp-ai-supplier-discovery)
   - 3.8 [Tự động hóa qua Email (AI Email Processor)](#38-tự-động-hóa-qua-email-ai-email-processor)
   - 3.9 [Phê duyệt đa cấp và SLA Escalation](#39-phê-duyệt-đa-cấp-và-sla-escalation)
   - 3.10 [Kiểm soát ngân sách](#310-kiểm-soát-ngân-sách)
4. [Các tính năng nổi bật](#4-các-tính-năng-nổi-bật)
5. [Công nghệ sử dụng](#5-công-nghệ-sử-dụng)
6. [Cấu trúc dự án](#6-cấu-trúc-dự-án)
7. [Schema cơ sở dữ liệu](#7-schema-cơ-sở-dữ-liệu)
8. [Hướng dẫn cài đặt](#8-hướng-dẫn-cài-đặt)
9. [Biến môi trường](#9-biến-môi-trường)
10. [Phân quyền người dùng (RBAC)](#10-phân-quyền-người-dùng-rbac)
11. [API Overview](#11-api-overview)
12. [Kịch bản Test Luồng Nghiệp vụ](#12-kịch-bản-test-luồng-nghiệp-vụ)
13. [Load Testing với k6](#13-load-testing-với-k6)

---

## 1. Tổng quan hệ thống

OMS giải quyết bài toán mua sắm doanh nghiệp phức tạp bằng cách số hóa và tự động hóa toàn bộ chuỗi giá trị:

| Vấn đề truyền thống | Giải pháp OMS |
|---|---|
| PR/PO làm thủ công qua email/Excel | Tạo PR/PO trực tuyến, phê duyệt số hoàn toàn |
| Phê duyệt chậm, không có SLA | Phê duyệt đa cấp tự động, escalation khi quá hạn |
| Không kiểm soát được ngân sách thực | Committed/Spent tracking real-time theo Cost Center × Category |
| Chọn nhà cung cấp cảm tính | AI chấm điểm báo giá, KPI nhà cung cấp tự động hàng quý |
| Đối soát hóa đơn thủ công, hay nhầm | 3-Way Matching tự động (PO vs GRN vs Invoice) |
| Không có lịch sử thay đổi | Audit trail đầy đủ mọi chứng từ |
| Email mua hàng bị bỏ sót | AI đọc email IMAP, tự động tạo PR nháp |
| Khó tìm nhà cung cấp mới | AI Supplier Discovery: tìm kiếm web + phân tích Gemini |
| Không có quy trình vetting NCC | Supplier Vetting workflow có checklist và phê duyệt |

---

## 2. Kiến trúc tổng thể

```
┌──────────────────────────────────────────────────────────────────┐
│                       CLIENT (Next.js 16)                        │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │Procurement│ │ Finance  │ │Warehouse │ │   Supplier Portal  │  │
│  │  Portal   │ │Dashboard │ │  Portal  │ │ (External Token)   │  │
│  └───────────┘ └──────────┘ └──────────┘ └────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │          ProcurementContext (Global State + apiFetch)    │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────────┬──────────────────────────────────────┘
                            │ REST API / WebSocket (Socket.io)
                            │ port 5000
┌───────────────────────────▼──────────────────────────────────────┐
│                      SERVER (NestJS 11)                          │
│                                                                  │
│  ── Procurement Core ──────────────────────────────────────────  │
│  PR Module   │ PO Module    │ RFQ Module   │ GRN Module          │
│  Invoice Mod │ Payment Mod  │ Contract Mod │ PO Automation       │
│                                                                  │
│  ── Approval & Budget ─────────────────────────────────────────  │
│  Approval Mod│ Budget Mod   │ Cost Center  │ Dispute Mod         │
│                                                                  │
│  ── Supplier Management ───────────────────────────────────────  │
│  Supplier Discovery │ Supplier Vetting │ Supplier KPI            │
│  Organization Mod   │ Review Mod       │ External Token Mod      │
│                                                                  │
│  ── AI & Automation ───────────────────────────────────────────  │
│  AI Service  │ RAG Module   │ Email Processor │ Quality Mod      │
│                                                                  │
│  ── Infrastructure ────────────────────────────────────────────  │
│  Auth Mod    │ User Mod     │ Notification Mod│ Audit Mod        │
│  Gateway(WS) │ Admin Mod    │ Report Mod      │ System Config    │
│                                                                  │
│  ── Security & Cross-cutting ──────────────────────────────────  │
│  JWT Guard   │ ThrottlerGuard │ Helmet │ TransformInterceptor    │
│  AllExceptionsFilter │ SoftDelete Middleware (Prisma $extends)   │
└──────┬─────────────┬──────────────────┬───────────────┬──────────┘
       │             │                  │               │
┌──────▼────┐  ┌─────▼──────┐  ┌───────▼──────┐  ┌────▼──────────┐
│PostgreSQL │  │   Redis 7  │  │ Google Gemini│  │  SMTP / IMAP  │
│  16 +     │  │  (BullMQ)  │  │  Flash API   │  │  Nodemailer   │
│ pgvector  │  │  Job Queue │  │ FPT NLP API  │  │  Twilio SMS   │
│ Prisma 7.8│  │  Caching   │  │ Tavily Search│  │  Socket.io    │
└───────────┘  └────────────┘  └──────────────┘  └───────────────┘
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

    AA --> AC([Kết thúc: Cập nhật KPI nhà cung cấp tự động])
```

---

### 3.2 Tạo và phê duyệt Purchase Requisition (PR)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Requester tạo PR\n(nhập items, ước tính giá)

    DRAFT --> PENDING_OVERRIDE : Tổng PR vượt\nbudget allocated
    PENDING_OVERRIDE --> DRAFT : Override bị từ chối
    PENDING_OVERRIDE --> PENDING_APPROVAL : Override được duyệt

    DRAFT --> PENDING_APPROVAL : Submit PR\n(Budget committed tạm thời)

    PENDING_APPROVAL --> UNDER_REVIEW : Cấp 1 duyệt\n(Dept Approver)
    UNDER_REVIEW --> LEVEL2_REVIEW : Cấp 2 duyệt\n(Director)
    LEVEL2_REVIEW --> APPROVED : Cấp 3 duyệt\n(CEO/CFO)

    PENDING_APPROVAL --> REJECTED : Cấp 1 từ chối
    UNDER_REVIEW --> REJECTED : Cấp 2 từ chối
    LEVEL2_REVIEW --> REJECTED : Cấp 3 từ chối

    REJECTED --> DRAFT : Requester chỉnh sửa\nvà submit lại

    APPROVED --> IN_SOURCING : Chuyển sang RFQ\n(Non-catalog)
    APPROVED --> PO_CREATED : Tạo PO trực tiếp\n(Catalog)

    IN_SOURCING --> PO_CREATED : RFQ kết thúc\nPO được tạo

    PO_CREATED --> COMPLETED : PO hoàn thành\nGRN + Invoice + Payment done

    APPROVED --> CANCELLED : Huỷ
    COMPLETED --> [*]
    CANCELLED --> [*]
```

**Ngưỡng phê duyệt mặc định** (cấu hình linh hoạt qua `ApprovalMatrixRule`):

| Giá trị PR | Cấp phê duyệt |
|---|---|
| < 10 triệu VND | Dept Approver (1 cấp) |
| 10 – 50 triệu VND | Dept Approver → Director (2 cấp) |
| 50 – 100 triệu VND | Director → CFO (2 cấp) |
| > 100 triệu VND | Dept Approver → Director → CEO (3 cấp) |

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
    SYS->>AI: Gợi ý danh sách NCC phù hợp (lịch sử, category)
    AI-->>SYS: Top NCC theo category / lịch sử hợp tác
    SYS->>S1: Gửi email mời báo giá (ExternalToken link)
    SYS->>S2: Gửi email mời báo giá (ExternalToken link)

    S1->>SYS: Nộp Quotation (giá, lead time, điều khoản)
    S2->>SYS: Nộp Quotation (giá, lead time, điều khoản)

    Note over S1,S2: Q&A Thread: NCC hỏi,\nProcurement trả lời real-time

    alt NCC muốn thương lượng
        S1->>SYS: Gửi Counter-offer (đề xuất giá khác)
        P->>SYS: Chấp nhận / từ chối counter-offer
    end

    P->>AI: Yêu cầu phân tích toàn bộ báo giá
    AI-->>P: Điểm 1-5 sao, Pros/Cons, RECOMMEND / CONSIDER / REJECT

    P->>SYS: Award RFQ → Chọn NCC thắng
    SYS->>SYS: Tự động tạo PO từ Quotation thắng
    SYS->>S1: Thông báo thắng thầu
    SYS->>S2: Thông báo thua thầu
```

**AI phân tích quotation dựa trên:**
- Giá so với thị trường và lịch sử mua (`priceVsMarket`)
- Thời gian giao hàng vs. yêu cầu trong PR
- Điều khoản thanh toán
- KPI lịch sử của NCC (OTD %, Quality Score, Response Rate)
- Chứng chỉ chất lượng (ISO, CE, ...)

---

### 3.4 Tạo Purchase Order và hợp nhất PR (PO Consolidation)

```mermaid
flowchart LR
    subgraph PRs["PRs đã được phê duyệt"]
        PR1["PR-001 / Phòng IT\nLaptop × 5\nChuột × 20"]
        PR2["PR-002 / Phòng Sales\nLaptop × 3\nBàn phím × 10"]
        PR3["PR-003 / Phòng HR\nLaptop × 2\nFolder × 50"]
    end

    subgraph Consolidate["PO Consolidation Engine"]
        direction TB
        M1["Mode: SKU_MATCH\nGom theo mã sản phẩm"]
        M2["Mode: CATEGORY_MATCH\nGom theo danh mục"]
    end

    subgraph PO["PO Hợp nhất — 1 NCC"]
        I1["Laptop: 10 chiếc\n(5 + 3 + 2)"]
        I2["Chuột: 20 chiếc"]
        I3["Bàn phím: 10 chiếc"]
        I4["Folder: 50 cái"]
    end

    subgraph Trace["PoItemSource — Truy vết nguồn gốc"]
        T1["PO Item Laptop ← PR1(5) + PR2(3) + PR3(2)"]
        T2["PO Item Chuột ← PR1(20)"]
    end

    PRs --> Consolidate
    Consolidate --> PO
    PO --> Trace
```

**Lợi ích Consolidation:**
- Giảm số PO → đơn hàng lớn hơn → giá tốt hơn từ NCC
- Truy vết từng line item về PR gốc (bắt buộc cho kiểm toán)
- Budget reserve tự động theo từng Cost Center của từng PR nguồn

---

### 3.5 Nhập kho và kiểm tra chất lượng (GRN/QC)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : PO được NCC xác nhận\n(Auto-tạo GRN nháp)

    DRAFT --> COUNTING : Warehouse bắt đầu nhận hàng
    COUNTING --> INSPECTING : Đếm xong → QC bắt đầu
    INSPECTING --> INSPECTION_DONE : QC điền kết quả từng item

    INSPECTION_DONE --> UNDER_REVIEW : Có item FAIL / PARTIAL
    INSPECTION_DONE --> CONFIRMED : Tất cả PASS

    UNDER_REVIEW --> CONFIRMED : Supervisor xác nhận\n(chấp nhận partial)
    UNDER_REVIEW --> DISPUTED : Hàng bị từ chối toàn bộ

    CONFIRMED --> POSTED : Nhập kho chính thức\nCập nhật inventory

    POSTED --> [*] : Trigger: NCC nộp Invoice\nKPI OTD được tính
```

**QC kết quả per item:** `PASS` | `FAIL` | `PARTIAL_PASS` | `PENDING`

**Defect categories:** `FUNCTIONAL` | `AESTHETIC` | `MATERIAL` | `DIMENSIONAL` | `PACKAGING`

Khi có item FAIL → tự động tạo **Return to Vendor (RTV)** → tính điểm trừ vào **KPI Quality Score** của NCC.

Hỗ trợ đính kèm ảnh (`GrnPhoto`) làm bằng chứng QC.

---

### 3.6 Đối soát 3 chiều và thanh toán

```mermaid
flowchart TD
    INV["Hóa đơn NCC\n(SupplierInvoice)"] --> M["3-Way Matching Engine"]
    PO["Purchase Order\n(Giá đặt, SL đặt)"] --> M
    GRN["Goods Receipt Note\n(SL thực nhận, QC Pass)"] --> M

    M --> C1{"PO Qty vs GRN Qty\n±2% tolerance"}
    M --> C2{"PO Price vs Invoice Price\n±1% tolerance"}
    M --> C3{"GRN Qty vs Invoice Qty\nExact match"}

    C1 & C2 & C3 -->|Tất cả OK| OK["AUTO_APPROVED\nStatus: PAYMENT_APPROVED"]

    C1 -->|Lệch nhỏ| EX["EXCEPTION_REVIEW\nFinance xem xét\nvà điều chỉnh thủ công"]
    C2 -->|Lệch nhỏ| EX

    C1 -->|Lệch lớn| F
    C2 -->|Lệch lớn| F
    C3 -->|Không khớp| F["DISPUTED\nMở Dispute\nEscrow tạm giữ tiền"]

    OK --> PAY["Payment PROCESSING\n→ COMPLETED\nBudget: Committed → Spent"]
    EX --> PAY
    F --> RES["Dispute Resolution\nNhiều bên trao đổi bằng chứng\n→ Release / Clamback Escrow"]
```

**Phương thức thanh toán:** `BANK_TRANSFER` | `ESCROW_RELEASE` | `VNPAY` | `STRIPE` | `LC` | `TT` | `CASH`

---

### 3.7 Khám phá & Xét duyệt nhà cung cấp (AI Supplier Discovery)

```mermaid
flowchart TD
    A([Tìm nhà cung cấp mới]) --> B["POST /supplier-discovery/search\nNhập từ khóa, danh mục, khu vực, ưu tiên"]
    B --> C["AI + Tavily Web Search\nTìm kiếm web và phân tích"]
    C --> D["Gemini AI chấm điểm 0-100\nTrả về: aiScore, matchReasons, aiSummary"]
    D --> E{"Supplier\ntrong hệ thống?"}

    E -->|IN_SYSTEM / WORKED_BEFORE\nexistingOrgId có sẵn| F["Dùng UUID sẵn có"]
    E -->|NEW\nchưa có UUID| G["POST /supplier-discovery/import\nTạo Organization → lấy UUID"]
    G --> F

    F --> H["POST /supplier-vetting\nsupplierId = UUID vừa có\nTạo Vetting Request"]

    H --> I["Procurement điền Checklist\n8 loại kiểm tra: BUSINESS_LICENSE,\nTAX_CODE, FIELD_VISIT,\nQUALITY_STANDARD, ..."]

    I --> J["POST /supplier-vetting/:id/submit\nNộp để phê duyệt"]

    J --> K{Approver\nquyết định}
    K -->|Chấp nhận| L["POST /supplier-vetting/:id/approve\nsupplierTier: APPROVED / CONDITIONAL / PREFERRED\nkycStatus: APPROVED"]
    K -->|Từ chối| M["POST /supplier-vetting/:id/reject\nrejectedReason: ..."]

    L --> N([NCC sẵn sàng nhận RFQ/PO])
    M --> O([NCC bị loại — có thể xét lại sau])
```

**Vetting Checklist (8 loại):**

| Mã | Mô tả |
|---|---|
| `BUSINESS_LICENSE` | Kiểm tra giấy phép kinh doanh |
| `TAX_CODE` | Xác minh mã số thuế |
| `CERTIFICATE_OF_ORIGIN` | Chứng nhận xuất xứ (CO) |
| `CUSTOMS_DOCS` | Chứng từ hải quan |
| `TAX_AUTHORITY_CALL` | Xác minh qua cơ quan thuế |
| `FIELD_VISIT` | Khảo sát thực địa |
| `PRICE_COMPARISON` | So sánh giá thị trường |
| `QUALITY_STANDARD` | Tiêu chuẩn chất lượng |

**Supplier Tier:** `STRATEGIC` | `PREFERRED` | `APPROVED` | `CONDITIONAL` | `DISQUALIFIED`

---

### 3.8 Tự động hóa qua Email (AI Email Processor)

```mermaid
sequenceDiagram
    participant EMP as Nhân viên
    participant MB as Mailbox (IMAP)
    participant EP as Email Processor
    participant RAG as Vector DB (pgvector)
    participant AI as Gemini AI
    participant DB as PostgreSQL

    EMP->>MB: Gửi email: "Cần mua 100 hộp A4 giấy..."
    MB->>EP: IMAP polling phát hiện email mới
    EP->>RAG: Ingest email → tạo embedding (FPT Vietnamese NLP)
    EP->>AI: Phân tích nội dung + intent detection
    AI-->>EP: intent: CREATE_PR\nitem: A4 paper×100, price: 150k\nconfidence: 0.92

    alt confidence >= 0.7
        EP->>DB: Tìm user theo email người gửi
        DB-->>EP: User + Department + CostCenter
        EP->>DB: Tạo PR nháp tự động (status: DRAFT)
        EP-->>EMP: Email thông báo: PR-xxxx đã tạo, vui lòng kiểm tra
    else confidence < 0.7
        EP-->>EMP: Không thể xử lý tự động\n(nội dung email không đủ rõ)
    end
```

**Các intent AI nhận diện:**

| Intent | Hành động hệ thống |
|---|---|
| `CREATE_PR` | Tự động tạo PR nháp với items trích xuất từ email |
| `UPDATE_PO` | Ghi nhận yêu cầu cập nhật PO, thông báo Procurement |
| `GENERAL_INQUIRY` | Ingest vào RAG Vector DB để tìm kiếm ngôn ngữ tự nhiên sau |

---

### 3.9 Phê duyệt đa cấp và SLA Escalation

```mermaid
flowchart TD
    SUB["Chứng từ được submit\n(PR / PO / Invoice / Payment / Budget / Vetting)"]
    --> RULE["Tra cứu ApprovalMatrixRule\ntheo: DocType + TotalAmount + OrgId"]

    RULE --> STEPS["Tạo ApprovalWorkflow steps\ntheo thứ tự cấp level 1→2→3"]

    STEPS --> L1["Level 1: DEPT_APPROVER\nSLA: 24h"]
    L1 -->|Duyệt| L2["Level 2: DIRECTOR\nSLA: 48h"]
    L1 -->|Từ chối| REJ["Chứng từ → REJECTED\nThông báo Email + SMS Requester"]
    L1 -->|Quá SLA| ESC1["Auto Escalate → Manager\nEmail + SMS cảnh báo"]

    L2 -->|Duyệt| L3["Level 3: CEO / CFO\nSLA: 72h"]
    L2 -->|Từ chối| REJ
    L2 -->|Quá SLA| ESC2["Auto Escalate → CFO\nEmail + SMS cảnh báo"]

    L3 -->|Duyệt| APR["Chứng từ → APPROVED\nTrigger AutomationService"]
    L3 -->|Từ chối| REJ

    subgraph Delegation["Ủy quyền (UserDelegate)"]
        D["Approver vắng mặt →\nUserDelegate kích hoạt tự động\nDelegate thực hiện thay trong thời gian ủy quyền"]
    end

    APR --> AUTO["AutomationService:\n• PR APPROVED → tạo RFQ hoặc PO trực tiếp\n• PO APPROVED → issue đến NCC + reserve budget\n• Invoice APPROVED → trigger payment\n• Budget APPROVED → unlock allocation"]
```

---

### 3.10 Kiểm soát ngân sách

```mermaid
flowchart LR
    subgraph Budget["BudgetAllocation\n(per CostCenter × Category × Period)"]
        ALL["Allocated\n100,000,000 VND"]
        COM["Committed\n(PR/PO đã duyệt\nchưa thanh toán)"]
        SPE["Spent\n(Đã thanh toán thực tế)"]
        AVA["Available\n= Allocated − Committed − Spent"]
    end

    subgraph Events["Sự kiện cập nhật ngân sách"]
        E1["PR Submit\n→ Check: Available ≥ PR Total?"]
        E2["PR/PO Approved\n→ Committed += Amount"]
        E3["Invoice Paid\n→ Committed −= Amount\n→ Spent += Amount"]
        E4["PR Rejected / PO Cancelled\n→ Committed −= Amount (hoàn trả)"]
        E5["Budget Override Request\n→ CFO/CEO duyệt → Allocated tăng"]
    end

    E1 -->|Đủ budget| ALL
    E1 -->|Vượt ngân sách| OVR["PENDING_OVERRIDE\nRequester tạo Override Request"]
    E2 --> COM
    E3 --> SPE
    E4 --> COM
    E5 --> ALL
    OVR --> E5
```

**Ngưỡng cảnh báo tự động:**
- Khi `Committed + Spent >= 80% Allocated` → Cảnh báo Manager qua email
- Khi `Committed + Spent >= 100% Allocated` → Block submit PR mới, yêu cầu Override
- Override Request cần phê duyệt CFO/CEO trước khi tiếp tục

---

## 4. Các tính năng nổi bật

### Mua sắm (Procurement)
- Tạo PR với kiểm tra ngân sách real-time theo Cost Center × Category × Quý
- Luồng kép: **Catalog** (tạo PO trực tiếp) vs **Non-catalog** (qua RFQ/đấu thầu)
- **PO Consolidation**: Gom nhiều PR từ nhiều phòng ban thành 1 PO (SKU_MATCH / CATEGORY_MATCH)
- Truy vết từng line item PO về PR gốc qua `PoItemSource`
- **PO Amendment**: Sửa đổi PO đã phát hành với lịch sử thay đổi đầy đủ
- **Shipment Tracking**: Theo dõi lô hàng từng PO
- Hợp đồng tự động cho PO > ngưỡng cấu hình (mặc định 50 triệu VND)

### AI & Tự động hóa
- **AI Email Processor**: Đọc email qua IMAP → trích xuất ý định → tạo PR nháp
- **AI Quotation Scoring**: Chấm điểm 1–5 sao kèm Pros/Cons, Recommend/Reject
- **AI Supplier Discovery**: Tìm kiếm NCC mới qua web (Tavily) + phân tích Gemini
- **AI Supplier Recommendation**: Gợi ý NCC phù hợp khi tạo RFQ
- **RAG Chat**: Truy vấn ngôn ngữ tự nhiên ("Tháng này IT đã chi bao nhiêu?")
- **RAG PR Generator**: Tạo PR nháp từ mô tả tự nhiên
- **PO Automation**: Tự động hóa các bước sau khi PO được duyệt

### Tài chính & Kiểm soát
- Ngân sách 3 trạng thái: **Allocated / Committed / Spent** per Cost Center × Category × Period
- 3-Way Matching tự động với ngưỡng dung sai có thể cấu hình
- **Budget Override Request** với quy trình phê duyệt riêng
- Escrow account cho tranh chấp: giữ tiền an toàn cho đến khi giải quyết
- Tạo Debit/Credit Note khi có điều chỉnh sau matching

### Quản lý nhà cung cấp
- **Supplier Discovery**: Tìm NCC mới qua AI + web scraping
- **Supplier Vetting**: Quy trình kiểm tra 8 tiêu chí với workflow phê duyệt
- **Supplier KPI**: Tự động tính OTD%, Quality%, Price Score hàng quý → xếp hạng Tier
- **Q&A Thread** trong RFQ: hỏi đáp real-time giữa NCC và Procurement
- **Counter-offer**: NCC có thể đề xuất điều chỉnh giá/điều khoản
- **Supplier Portal**: Cổng riêng (xem PO, acknowledge, upload invoice)
- **External Token**: Link không cần đăng nhập cho NCC quote/confirm PO/nộp invoice

### Chất lượng & Kho
- GRN với QC per item: Pass/Fail/Partial Pass + ảnh chứng minh
- Return to Vendor (RTV) tự động khi hàng lỗi
- Phân loại lỗi (Functional/Aesthetic/Material/Dimensional/Packaging)
- Dispute resolution với evidence management và Escrow

### Vận hành & Tuân thủ
- **Audit Trail** đầy đủ mọi thay đổi (ai, khi nào, giá trị trước/sau) — BigInt ID cho volume cao
- **Soft Delete**: xoá mềm tất cả chứng từ chính, không mất dữ liệu
- Thông báo đa kênh: Email / SMS (Twilio) / In-app / WebSocket
- Real-time updates qua Socket.io
- RBAC chi tiết với 11 vai trò, ủy quyền (UserDelegate) linh hoạt
- Rate limiting: 200 req/phút global, 10 req/phút cho endpoint auth
- Request ID tracking (`x-request-id`) cho mọi request

---

## 5. Công nghệ sử dụng

| Layer | Công nghệ | Phiên bản | Mục đích |
|---|---|---|---|
| **Frontend** | Next.js (App Router) | 16 | SSR/SSG, routing |
| | React | 19.2 | UI framework |
| | TypeScript | 5 | Type safety |
| | TailwindCSS | 4 | Styling |
| | Lucide React | 0.577 | Icon library |
| | Recharts | 3 | Dashboard biểu đồ |
| | React Hook Form | 7 | Form management |
| | Zod | 4.3 | Schema validation |
| | React Query | 5 | Server state management |
| | Socket.io Client | 4.8 | Real-time updates |
| | js-cookie | 3 | JWT token từ cookie |
| **Backend** | NestJS | 11 | API framework |
| | TypeScript | 5 | Type safety |
| | Passport.js | - | Auth middleware |
| | Helmet | 8.1 | HTTP security headers |
| | Class Validator | 0.14 | DTO validation |
| **Database** | PostgreSQL | 16 | Relational data |
| | pgvector | - | Vector embeddings cho RAG |
| | Prisma ORM | 7.8 | DB access + migrations |
| **Cache & Queue** | Redis | 7 | Caching + job queue |
| | BullMQ | 4.16 | Background job processing |
| **AI / ML** | Google Gemini Flash | 2.0 | Email analysis, quotation scoring, RAG |
| | FPT Cloud NLP | - | Vietnamese text embedding |
| | Tavily Search API | - | Web search cho supplier discovery |
| **Communication** | Nodemailer | 8 | SMTP email (gửi thông báo) |
| | imap-simple | 5.1 | IMAP (nhận email tự động) |
| | Twilio | 5.12 | SMS notifications |
| | Socket.io | 4 | WebSocket real-time |
| **Security** | JWT | 11 | Authentication |
| | bcrypt | 6 | Password hashing |
| | Throttler | 6.5 | Rate limiting |
| **Docs** | Swagger / OpenAPI | 11 | API documentation |
| **Infrastructure** | Docker Compose | - | Container orchestration |
| **Testing** | k6 | - | Load testing |

---

## 6. Cấu trúc dự án

```
Order_management_system/
│
├── server/                              # NestJS Backend (port 5000)
│   ├── src/
│   │   ├── main.ts                      # Bootstrap, Swagger, global middleware
│   │   ├── app.module.ts                # Root module
│   │   │
│   │   ├── auth-module/                 # JWT auth, login, register, refresh token
│   │   ├── user-module/                 # Users CRUD, delegation, MFA
│   │   ├── organization-module/         # Buyer/Supplier org management, KYC
│   │   │
│   │   ├── prmodule/                    # Purchase Requisition (PR)
│   │   ├── rfqmodule/                   # RFQ, Quotation, Q&A, Counter-offer
│   │   ├── pomodule/                    # Purchase Order, Consolidation, Amendment
│   │   ├── grnmodule/                   # Goods Receipt Note, QC, Return to Vendor
│   │   ├── invoice-module/              # Supplier Invoice, 3-Way Matching
│   │   ├── payment-module/              # Payment, Escrow
│   │   ├── contract-module/             # Contract lifecycle, milestone payment
│   │   ├── dispute-module/              # Dispute resolution workflow
│   │   ├── po-automation/               # PO workflow automation post-approval
│   │   │
│   │   ├── approval-module/             # Multi-level approval, SLA escalation
│   │   ├── budget-module/               # Budget period, allocation, override
│   │   ├── cost-center-module/          # Cost Center CRUD
│   │   │
│   │   ├── supplier-discovery/          # AI Supplier Discovery (Tavily + Gemini)
│   │   ├── supplier-vetting-module/     # Supplier vetting checklist & approval
│   │   ├── supplier-kpimodule/          # KPI scoring, tier evaluation, cron jobs
│   │   ├── review-module/               # Buyer ratings for suppliers
│   │   │
│   │   ├── ai-service/                  # Gemini AI integration (chat, analysis)
│   │   ├── rag/                         # RAG: ingest, query, PR generator
│   │   ├── email-processor/             # IMAP listener + AI email parser
│   │   │
│   │   ├── notification-module/         # Email / SMS / Push notifications
│   │   ├── gateway/                     # WebSocket gateway (Socket.io)
│   │   ├── audit-module/                # Audit trail logging
│   │   ├── report-module/               # Spend analytics, KPI reports
│   │   ├── admin-module/                # Admin dashboard, system tools
│   │   ├── system-config-module/        # Org-level config (SystemConfig)
│   │   ├── external-token-module/       # Supplier-facing links without login
│   │   ├── quality-module/              # Quality management, defect tracking
│   │   │
│   │   ├── product-module/              # Product catalog, categories
│   │   └── prisma/                      # PrismaService (singleton + soft-delete extension)
│   │
│   ├── prisma/
│   │   ├── schema.prisma                # 65+ models
│   │   └── migrations/                  # Migration history
│   │
│   └── package.json
│
├── client/                              # Next.js Frontend (port 3000)
│   ├── app/
│   │   ├── (auth)/                      # Login, Register
│   │   ├── procurement/                 # PR, PO, RFQ, Supplier Discovery/Vetting
│   │   │   ├── prs/                     # Danh sách PR
│   │   │   ├── pos/                     # Danh sách PO
│   │   │   ├── rfq/                     # RFQ workflow
│   │   │   ├── supplier-discovery/      # AI Supplier Search
│   │   │   ├── supplier-vetting/        # Supplier Vetting
│   │   │   ├── contracts/               # Hợp đồng
│   │   │   ├── disputes/                # Tranh chấp
│   │   │   └── quality-management/      # Quản lý chất lượng
│   │   ├── finance/                     # Budget, Invoice, Matching, Payment
│   │   │   ├── budgets/
│   │   │   ├── invoices/
│   │   │   ├── matching/
│   │   │   └── dashboard/
│   │   ├── warehouse/                   # GRN, QC, Defects
│   │   ├── approvals/                   # Hàng đợi phê duyệt
│   │   ├── manager/                     # Spend tracking, Budget alerts
│   │   ├── supplier/                    # Cổng nhà cung cấp
│   │   │   ├── dashboard/
│   │   │   ├── rfq/                     # Xem và nộp báo giá
│   │   │   ├── po/                      # Xác nhận PO
│   │   │   └── invoice/                 # Nộp hóa đơn
│   │   ├── admin/                       # Quản trị hệ thống
│   │   │   ├── organizations/
│   │   │   ├── products/
│   │   │   ├── departments/
│   │   │   ├── cost-centers/
│   │   │   └── audit-logs/
│   │   ├── reports/                     # Analytics & AI reports
│   │   │   └── spend/
│   │   ├── pr/create/                   # Tạo PR
│   │   ├── po/consolidate/              # PO Consolidation
│   │   └── external/sign-contract/      # Ký hợp đồng (external link)
│   │
│   ├── context/
│   │   └── ProcurementContext.tsx       # Global state + apiFetch (Bearer token)
│   ├── services/
│   │   ├── supplierDiscoveryService.ts  # Supplier Discovery API calls
│   │   ├── notificationService.ts       # Notification helpers
│   │   └── poAutomationService.ts       # PO Automation helpers
│   ├── hooks/
│   │   ├── useSocketIO.ts               # Real-time WebSocket events
│   │   ├── usePurchaseOrders.ts         # PO data fetching
│   │   └── useAuditLogs.ts              # Audit log queries
│   ├── components/
│   │   ├── charts/                      # Recharts components
│   │   └── shared/                      # Shared UI components
│   └── package.json
│
├── k6/                                  # Load testing scripts
├── docker-compose.yml                   # PostgreSQL + Redis + Server + Client
├── .env.example                         # Template biến môi trường
└── README.md
```

---

## 7. Schema cơ sở dữ liệu

### Tổng quan các nhóm model (65+ models)

#### Tổ chức & Người dùng
| Model | Mô tả |
|---|---|
| `Organization` | Buyer và Supplier (phân biệt qua `companyType`) |
| `OrganizationDocument` | Tài liệu KYC đính kèm |
| `Department` | Phòng ban trong Organization |
| `CostCenter` | Trung tâm chi phí, gắn với Department |
| `User` | Người dùng hệ thống (11 vai trò) |
| `UserDelegate` | Ủy quyền tạm thời giữa users |
| `ApprovalMatrixRule` | Quy tắc phê duyệt theo DocType + Amount |
| `ApprovalWorkflow` | Từng bước phê duyệt thực tế |

#### Chuỗi P2P
| Model | Mô tả |
|---|---|
| `PurchaseRequisition` | Yêu cầu mua hàng (soft delete) |
| `PrItem` | Line items của PR |
| `PrAttachment` | File đính kèm PR |
| `RfqRequest` | Yêu cầu báo giá (soft delete) |
| `RfqItem` | Items trong RFQ |
| `RfqSupplier` | Danh sách NCC được mời trong RFQ |
| `RfqQuotation` | Báo giá từ NCC |
| `RfqQuotationItem` | Line items của báo giá |
| `RfqQaThread` | Hỏi đáp Q&A trong RFQ |
| `RfqCounterOffer` | Đề xuất điều chỉnh giá từ NCC |
| `PurchaseOrder` | Đơn đặt hàng (soft delete) |
| `PoItem` | Line items của PO |
| `PoItemSource` | Truy vết từng PO item về PR gốc |
| `PoAmendment` | Lịch sử sửa đổi PO |
| `PoShipmentTracking` | Theo dõi lô hàng |
| `GoodsReceipt` | Phiếu nhập kho (soft delete) |
| `GrnItem` | Line items GRN (QC per item) |
| `GrnPhoto` | Ảnh chứng minh QC |
| `ReturnToVendor` | Phiếu trả hàng lỗi |
| `SupplierInvoice` | Hóa đơn nhà cung cấp (soft delete) |
| `InvoiceItem` | Line items hóa đơn |
| `DebitCreditNote` | Điều chỉnh sau matching |
| `Payment` | Thanh toán |
| `EscrowAccount` | Tài khoản escrow cho tranh chấp |
| `EscrowTransaction` | Giao dịch escrow |

#### Nhà cung cấp
| Model | Mô tả |
|---|---|
| `SupplierVettingRequest` | Yêu cầu xét duyệt NCC |
| `SupplierVettingCheck` | Từng checklist item trong vetting |
| `SupplierKpiScore` | KPI theo quý/năm (OTD, Quality, Price) |
| `SupplierManualReview` | Đánh giá thủ công ad-hoc |
| `BuyerRating` | Rating NCC từ phía buyer |
| `SupplierCategory` | Danh mục NCC cung cấp |
| `SupplierProductPrice` | Bảng giá NCC theo sản phẩm |
| `QuotationRequest` | Yêu cầu báo giá nhanh |

#### Tài chính & Ngân sách
| Model | Mô tả |
|---|---|
| `BudgetPeriod` | Kỳ ngân sách (Monthly/Quarterly/Annual) |
| `BudgetAllocation` | Phân bổ ngân sách theo CostCenter × Category |
| `OrgBudget` | Tổng ngân sách cấp tổ chức |
| `BudgetOverrideRequest` | Yêu cầu vượt ngân sách |
| `Contract` | Hợp đồng |
| `ContractMilestone` | Milestone thanh toán theo hợp đồng |
| `Dispute` | Tranh chấp |
| `DisputeEvidence` | Bằng chứng trong tranh chấp |
| `DisputeMessage` | Tin nhắn trao đổi trong tranh chấp |

#### Thông báo & Kiểm toán
| Model | Mô tả |
|---|---|
| `Notification` | Thông báo (Email/SMS/InApp/Push) |
| `NotificationTemplate` | Template thông báo có biến |
| `AuditLog` | Audit trail (BigInt ID, volume cao) |
| `SpendAnalyticsSnapshot` | Snapshot phân tích chi tiêu |
| `RootCauseAnalysis` | Phân tích nguyên nhân gốc rễ |

#### AI & Tích hợp
| Model | Mô tả |
|---|---|
| `DocumentEmbedding` | Vector store cho RAG (pgvector) |
| `SystemConfig` | Cấu hình cấp org |
| `WebhookConfig` | Cấu hình outbound webhook |
| `ExternalToken` | Token truy cập không cần đăng nhập |
| `FailedEmail` | Retry queue cho email thất bại |
| `Product` | Sản phẩm trong catalog |
| `ProductCategory` | Danh mục sản phẩm |

### Các enum quan trọng

```
UserRole:       REQUESTER, DEPT_APPROVER, DIRECTOR, CEO,
                PROCUREMENT, WAREHOUSE, QA, FINANCE,
                SUPPLIER, ADMIN, PLATFORM_ADMIN, SYSTEM

CurrencyCode:   VND, USD, EUR, SGD, JPY, CNY, GBP, AUD

Incoterm:       EXW, FCA, FAS, FOB, CFR, CIF, CPT, CIP, DAP, DPU, DDP

SupplierTier:   STRATEGIC, PREFERRED, APPROVED, CONDITIONAL,
                DISQUALIFIED, PENDING

KycStatus:      PENDING, SUBMITTED, UNDER_REVIEW, APPROVED,
                REJECTED, EXPIRED

CompanyType:    BUYER, SUPPLIER, BOTH

TokenType:      RFQ_QUOTE, PO_CONFIRM, GRN_MILESTONE, INVOICE_SUBMIT
```

---

## 8. Hướng dẫn cài đặt

### Yêu cầu hệ thống

- Node.js >= 20
- PostgreSQL 16 với extension `uuid-ossp` và `vector` (pgvector)
- Redis >= 7
- Tài khoản Google AI Studio (Gemini API key)
- Tài khoản Tavily (Web search API)
- Tài khoản FPT Cloud (Vietnamese NLP — tùy chọn)

---

### Cách 1: Chạy với Docker Compose (Khuyến nghị)

```bash
git clone <repo-url>
cd Order_management_system

# Copy và điền biến môi trường
cp .env.example .env
# Điền các giá trị cần thiết trong .env

# Build và chạy toàn bộ stack
docker compose up -d --build

# Xem logs
docker compose logs -f server
docker compose logs -f client
```

Các service sẽ khởi động:
- **PostgreSQL** tại `localhost:5432`
- **Redis** tại `localhost:6379`
- **NestJS Server** tại `http://localhost:5000`
- **Next.js Client** tại `http://localhost:3000`
- **Swagger API Docs** tại `http://localhost:5000/docs`

---

### Cách 2: Chạy thủ công (Development)

#### Bước 1 — Clone và cài dependencies

```bash
git clone <repo-url>
cd Order_management_system

# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install
```

#### Bước 2 — Cấu hình PostgreSQL với pgvector

```sql
-- Kết nối với quyền superuser
CREATE DATABASE oms_db;
\c oms_db

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

#### Bước 3 — Cấu hình biến môi trường

```bash
# Server
cp .env.example server/.env
# Chỉnh sửa server/.env với các giá trị thực

# Client
echo 'NEXT_PUBLIC_API_URL=http://localhost:5000' > client/.env.local
```

#### Bước 4 — Khởi tạo và migrate database

```bash
cd server

# Chạy migrations
npx prisma migrate deploy

# Tạo Prisma client
npx prisma generate

# Seed dữ liệu mẫu
npx prisma db seed
```

#### Bước 5 — Khởi động

```bash
# Terminal 1: Backend (hot reload)
cd server && npm run start:dev

# Terminal 2: Frontend
cd client && npm run dev
```

| Service | URL |
|---|---|
| **Frontend** | `http://localhost:3000` |
| **Backend API** | `http://localhost:5000` |
| **Swagger Docs** | `http://localhost:5000/docs` |
| **Prisma Studio** | `npx prisma studio` → `http://localhost:5555` |

---

## 9. Biến môi trường

### Server (`server/.env`)

```env
# ── Database ──────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/oms_db?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/oms_db"

# ── Application ───────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

# ── JWT ───────────────────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_TOKEN_TTL_DAYS=7

# ── Redis ─────────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# ── Email (SMTP — gửi thông báo) ──────────────────────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-google-app-password

# ── Email (IMAP — AI Email Processor nhận email) ──────────────────
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_USER=procurement@yourcompany.com
EMAIL_IMAP_PASS=your-imap-app-password

# ── AI Services ───────────────────────────────────────────────────
GEMINI_API_KEY=your-google-gemini-api-key

# FPT Cloud NLP (Vietnamese embedding model)
FPT_AI_API_KEY=your-fpt-cloud-api-key
FPT_AI_BASE_URL=https://mkp-api.fptcloud.com/v1
FPT_EMBEDDING_MODEL=Vietnamese_Embedding
FPT_LLM_MODEL=SaoLa4-medium

# Tavily (Web search cho Supplier Discovery)
TAVILY_API_KEY=your-tavily-api-key

# ── SMS (Twilio) ──────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+84xxxxxxxxx

# ── Business Rules ────────────────────────────────────────────────
# Ngưỡng giá trị PO cần tạo hợp đồng tự động (VND)
CONTRACT_THRESHOLD=50000000
```

### Client (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 10. Phân quyền người dùng (RBAC)

| Role | Quyền chính | Module chính |
|---|---|---|
| `REQUESTER` | Tạo/sửa PR, xem trạng thái của mình | PR, Approvals |
| `DEPT_APPROVER` | Duyệt PR cấp 1 của phòng ban, xem budget phòng | Approvals, Budget |
| `DIRECTOR` | Duyệt PR/PO cấp 2, xem toàn org | Approvals, Reports |
| `CEO` | Duyệt chứng từ cấp cao nhất, xem mọi số liệu | Approvals, Reports |
| `PROCUREMENT` | Tạo/quản lý PO, RFQ, chọn NCC, consolidate, vetting | PO, RFQ, Supplier |
| `FINANCE` | Duyệt Invoice, Payment, 3-Way Matching, Budget | Invoice, Payment, Budget |
| `WAREHOUSE` | Tạo/xác nhận GRN, nhập QC kết quả, xử lý RTV | GRN, Quality |
| `QA` | Xem kết quả QC, quản lý defects, RootCauseAnalysis | Quality |
| `SUPPLIER` | Xem PO, nộp Quotation/Invoice, acknowledge PO | Supplier Portal |
| `ADMIN` | Quản lý Users, Departments, Products, Templates | Admin |
| `PLATFORM_ADMIN` | Super admin toàn hệ thống, mọi quyền | All |

---

## 11. API Overview

Swagger đầy đủ tại: **`http://localhost:5000/docs`**

| Module | Endpoint | Method | Chức năng chính |
|---|---|---|---|
| **Auth** | `/auth/login` | POST | Đăng nhập, nhận JWT |
| | `/auth/register` | POST | Đăng ký tổ chức + admin |
| | `/auth/refresh` | POST | Làm mới access token |
| **PR** | `/procurement-requests` | GET/POST | Danh sách / Tạo PR |
| | `/procurement-requests/:id/submit` | POST | Submit để duyệt |
| | `/procurement-requests/:id/cancel` | PATCH | Huỷ PR |
| **RFQ** | `/request-for-quotations` | GET/POST | Danh sách / Tạo RFQ |
| | `/request-for-quotations/:id/award` | POST | Chọn NCC thắng |
| | `/request-for-quotations/:id/qa` | POST | Tạo câu hỏi Q&A |
| **PO** | `/purchase-orders` | GET/POST | Danh sách / Tạo PO |
| | `/purchase-orders/consolidate` | POST | Gom nhiều PR thành 1 PO |
| | `/purchase-orders/:id/issue` | POST | Phát hành PO đến NCC |
| | `/purchase-orders/:id/amend` | POST | Sửa đổi PO |
| **GRN** | `/grn` | GET/POST | Danh sách / Tạo GRN |
| | `/grn/:id/confirm` | PATCH | Xác nhận nhận hàng |
| | `/grn/:id/qc` | PATCH | Cập nhật kết quả QC |
| **Invoice** | `/invoices` | GET/POST | Danh sách / Tạo hóa đơn |
| | `/invoices/:id/match` | POST | Trigger 3-Way Matching |
| | `/invoices/:id/approve-payment` | POST | Duyệt thanh toán |
| **Payment** | `/payments` | GET/POST | Danh sách / Tạo Payment |
| | `/payments/:id/complete` | PATCH | Hoàn thành thanh toán |
| **Approval** | `/approvals/pending` | GET | Danh sách chờ duyệt |
| | `/approvals/:id/action` | POST | Duyệt / Từ chối |
| **Budget** | `/budgets/allocations` | GET/POST | Phân bổ ngân sách |
| | `/budgets/overrides` | GET/POST | Override request |
| | `/budgets/periods` | GET/POST | Kỳ ngân sách |
| **Supplier Discovery** | `/supplier-discovery/search` | POST | Tìm NCC qua AI + web |
| | `/supplier-discovery/import` | POST | Import NCC vào hệ thống |
| | `/supplier-discovery/enrich` | POST | Crawl thêm thông tin NCC |
| **Supplier Vetting** | `/supplier-vetting` | GET/POST | Danh sách / Tạo vetting |
| | `/supplier-vetting/:id/submit` | POST | Nộp để phê duyệt |
| | `/supplier-vetting/:id/approve` | POST | Phê duyệt NCC |
| | `/supplier-vetting/:id/reject` | POST | Từ chối NCC |
| **AI** | `/ai-service/chat` | POST | RAG chat tự nhiên |
| | `/ai-service/analyze-email` | POST | Phân tích email |
| **Organization** | `/organizations` | GET/POST | Quản lý tổ chức |
| **Users** | `/users` | GET/POST/PATCH | Quản lý người dùng |
| **Reports** | `/reports/spend` | GET | Báo cáo chi tiêu |
| | `/reports/supplier-kpi` | GET | KPI nhà cung cấp |
| **Audit** | `/audit-logs` | GET | Audit trail |

---

## 12. Kịch bản Test Luồng Nghiệp vụ

### Tài khoản test mặc định

| Role | Email | Chức năng test |
|---|---|---|
| `REQUESTER` | requester@demo.com | Tạo PR |
| `DEPT_APPROVER` | dept-approver@demo.com | Duyệt cấp 1 |
| `DIRECTOR` | director@demo.com | Duyệt cấp 2 |
| `CEO` | ceo@demo.com | Duyệt cấp cao nhất |
| `PROCUREMENT` | procurement@demo.com | Tạo PO, RFQ, vetting |
| `FINANCE` | finance@demo.com | Invoice, Payment, Budget |
| `WAREHOUSE` | warehouse@demo.com | GRN, QC |
| `SUPPLIER` | supplier@demo.com | Nộp báo giá, hóa đơn |
| `ADMIN` | admin@demo.com | Quản trị |

> Mật khẩu mặc định: `password123` (seed data)

---

### Kịch bản 1 — Luồng thành công hoàn chỉnh (Happy Path)

```
1. [REQUESTER] Tạo PR: 10 laptop, 5 triệu/cái = 50 triệu VND
   → Hệ thống kiểm tra budget, commit tạm 50 triệu

2. [DEPT_APPROVER] Duyệt PR cấp 1
   → Status: PENDING_APPROVAL → UNDER_REVIEW

3. [DIRECTOR] Duyệt PR cấp 2
   → Status: UNDER_REVIEW → APPROVED

4. [PROCUREMENT] Tạo RFQ từ PR đã duyệt
   → Mời 2 nhà cung cấp (NCC A, NCC B)

5. [NCC A] Nộp báo giá: 4.8 triệu/cái, giao trong 7 ngày
6. [NCC B] Nộp báo giá: 5.1 triệu/cái, giao trong 5 ngày

7. [PROCUREMENT] Yêu cầu AI phân tích → NCC A: ⭐⭐⭐⭐ RECOMMEND
   → Award cho NCC A

8. [PROCUREMENT] Tạo PO từ RFQ: 10 laptop × 4.8tr = 48 triệu
   → PO tự động ISSUED đến NCC A

9. [NCC A] Acknowledge PO

10. [WAREHOUSE] Nhận hàng → Tạo GRN → QC tất cả Pass
    → GRN POSTED

11. [NCC A] Nộp hóa đơn 48 triệu

12. [FINANCE] Trigger 3-Way Matching
    → PO: 48tr ✓ | GRN: 10 chiếc ✓ | Invoice: 48tr ✓
    → AUTO_APPROVED

13. [FINANCE] Tạo Payment → COMPLETED
    → Budget: Committed 48tr → Spent 48tr
    → KPI NCC A được cập nhật: OTD 100%, Quality 100%
```

---

### Kịch bản 2 — PR vượt ngân sách, Override

```
1. [REQUESTER] Tạo PR 200 triệu khi budget available chỉ còn 150 triệu
   → Status: PENDING_OVERRIDE
   → Hệ thống tạo BudgetOverrideRequest

2. [FINANCE/CEO] Duyệt Override Request → Allocated tăng 200 triệu
   → PR tiếp tục quy trình phê duyệt bình thường
```

---

### Kịch bản 3 — GRN phát hiện hàng lỗi, Dispute

```
1. WAREHOUSE nhận hàng → QC: 8/10 chiếc PASS, 2 chiếc FAIL (FUNCTIONAL)
   → ReturnToVendor tự động cho 2 chiếc
   → GRN CONFIRMED với qty = 8

2. NCC nộp hóa đơn 50 triệu (toàn bộ 10 chiếc)

3. 3-Way Matching:
   GRN Qty (8) vs Invoice Qty (10) → Không khớp → DISPUTED

4. Dispute mở: Escrow giữ tiền
   → NCC upload bằng chứng giao đủ 10 chiếc
   → WAREHOUSE upload ảnh GRN chứng minh 2 chiếc lỗi

5. ADMIN quyết định: Hoàn trả 2 chiếc lỗi, thanh toán 8 chiếc
   → Debit Note cho 2 chiếc
   → Escrow release một phần: 40 triệu
   → NCC KPI: Quality Score giảm, OTD không đổi
```

---

### Kịch bản 4 — PO Consolidation nhiều phòng ban

```
1. PR-001 (Phòng IT): Laptop × 3
2. PR-002 (Phòng Sales): Laptop × 2
3. PR-003 (Phòng HR): Laptop × 1

4. [PROCUREMENT] Tạo Consolidation: Mode SKU_MATCH
   → PO duy nhất: Laptop × 6 (số lượng lớn → giá tốt hơn)

5. PoItemSource tự động ghi:
   → PO Item Laptop ← PR-001 (3) + PR-002 (2) + PR-003 (1)

6. Sau khi thanh toán:
   → Budget CostCenter IT: Committed −= 3 laptop
   → Budget CostCenter Sales: Committed −= 2 laptop
   → Budget CostCenter HR: Committed −= 1 laptop
```

---

### Kịch bản 5 — AI Supplier Discovery → Vetting → PO

```
1. [PROCUREMENT] Vào /supplier-discovery
   → Search: "nhà cung cấp laptop văn phòng Hà Nội"
   → AI + Tavily tìm được 8 kết quả, Gemini chấm điểm 0-100

2. Chọn NCC điểm cao nhất (status: NEW)
   → Click "Xét duyệt nhà cung cấp"
   → Hệ thống: import NCC → lấy UUID → tạo VettingRequest
   → Điều hướng sang trang chi tiết Vetting

3. [PROCUREMENT] Điền checklist 8 tiêu chí
   → Upload file giấy phép kinh doanh, MST
   → Submit vetting để phê duyệt

4. [ADMIN/DIRECTOR] Phê duyệt → supplierTier: APPROVED
   → kycStatus: APPROVED
   → NCC sẵn sàng nhận RFQ/PO

5. [PROCUREMENT] Tạo RFQ mời NCC mới này
```

---

### Kịch bản 6 — Email tự động tạo PR

```
1. Nhân viên gửi email đến hộp thư hệ thống:
   "Kính gửi bộ phận mua hàng, phòng Marketing cần mua
    100 hộp giấy A4, 50 bút bi. Gấp trước 20/05."

2. Email Processor (IMAP polling) phát hiện email
   → Gemini AI phân tích: intent=CREATE_PR, confidence=0.89
   → Tìm User theo email người gửi

3. Tự động tạo PR nháp:
   - Item 1: Giấy A4 × 100 hộp
   - Item 2: Bút bi × 50 cái
   - Department: Marketing
   - Status: DRAFT

4. Nhân viên nhận email thông báo
   → Vào hệ thống kiểm tra PR, bổ sung giá ước tính
   → Submit để duyệt
```

---

## 13. Load Testing với k6

Dự án có sẵn scripts k6 trong thư mục `k6/`:

```bash
# Cài đặt k6
# Windows: winget install k6
# macOS: brew install k6

# Chạy load test cơ bản
k6 run k6/smoke-test.js

# Stress test
k6 run k6/stress-test.js

# Full load test với 100 VUs
k6 run --vus 100 --duration 5m k6/load-test.js
```

**Các metrics quan trọng cần theo dõi:**
- `http_req_duration` — thời gian response (mục tiêu p95 < 500ms)
- `http_req_failed` — tỷ lệ lỗi (mục tiêu < 1%)
- `checks` — tỷ lệ assertions pass

---

## Giấy phép

Dự án nội bộ — © 2026 All rights reserved.
