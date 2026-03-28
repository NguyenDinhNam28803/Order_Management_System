# 🚀 Smart E-Procurement & Order Management System (OMS)

## 1. Tổng quan Hệ thống (Executive Summary)
Hệ thống OMS này là một giải pháp quản trị mua sắm tập trung (E-Procurement), được thiết kế để chuyển đổi mô hình mua sắm truyền thống sang mô hình **Touchless Procurement**. Hệ thống sử dụng NestJS làm nhân lõi, kết hợp với Trí tuệ nhân tạo (LLM) để tối ưu hóa việc chọn nhà cung cấp và xử lý dữ liệu báo giá, giúp giảm thiểu tối đa thời gian xử lý thủ công và sai sót con người.

---

## 2. Kiến trúc Hệ thống (System Architecture)

### 🏗️ Công nghệ cốt lõi
*   **Backend Framework**: NestJS (TypeScript) - Kiến trúc Modular hóa, dễ dàng mở rộng thành Microservices.
*   **Database**: PostgreSQL 16+ với các extension `pg_trgm` (tìm kiếm mờ) và `uuid-ossp` (quản lý định danh duy nhất).
*   **ORM**: Prisma Client - Đảm bảo Type-safety tuyệt đối và tối ưu hóa truy vấn.
*   **Caching & Queue**: Redis & BullMQ - Xử lý các tác vụ AI nặng và hệ thống thông báo thời gian thực.
*   **AI Integration**: Module `ai-service` hỗ trợ kết nối đa mô hình (GPT-4, Claude, Gemini) để phân tích dữ liệu phi cấu trúc.
*   **Security**: JWT (Access/Refresh Token), Role-Based Access Control (RBAC), và cơ chế mã hóa AES-256 cho các thông tin cấu hình nhạy cảm.

---

## 3. Phân tích chi tiết các Module nghiệp vụ

### 🛡️ Nhóm 1: Core Governance (Quản trị lõi)
*   **Organization Module**: 
    *   Hỗ trợ mô hình đa tổ chức (Multi-tenant). Mỗi tổ chức có hồ sơ KYC, Trust Score (điểm tín nhiệm) và Tiering (phân hạng chiến lược).
    *   Tự động tính toán Trust Score dựa trên lịch sử giao dịch: Tỷ lệ giao hàng đúng hạn, chất lượng hàng hóa và tính chính xác của hóa đơn.
*   **Budget Module**:
    *   **Logic**: Kiểm soát ngân sách 3 lớp: `OrgBudget` (Tổng) -> `BudgetAllocation` (Phòng ban/Hạng mục) -> `CostCenter` (Trung tâm chi phí).
    *   **Tính năng**: Cơ chế **Budget Hold** (Đóng băng) khi PR được tạo và **Budget Spend** (Trừ thực tế) khi thanh toán hoàn tất.
*   **Approval Module (Cơ chế phê duyệt)**:
    *   **Matrix Rule**: Cấu hình linh hoạt theo `DocumentType`, `TotalAmount` và `Department`.
    *   **Workflow**: Hỗ trợ duyệt song song, duyệt tuần tự, và tự động leo thang (Escalation) hoặc ủy quyền (Delegation) nếu quá thời hạn SLA.

### 📝 Nhóm 2: Strategic Sourcing (Tìm nguồn chiến lược)
*   **PR Module (Yêu cầu mua sắm)**: 
    *   Tự động kiểm tra ngân sách khả dụng theo thời gian thực (Real-time Budget Check).
    *   Tích hợp AI để phân loại danh mục sản phẩm (Category) tự động dựa trên mô tả yêu cầu.
*   **RFQ Module (Mời thầu điện tử)**:
    *   **AI Search**: Tự động quét database nhà cung cấp toàn cầu để mời thầu dựa trên năng lực và uy tín.
    *   **QA Thread**: Hệ thống hỏi đáp tập trung, minh bạch giữa bên mua và các bên thầu.
    *   **Counter-Offer**: Cơ chế đàm phán giá/điều khoản nhiều vòng, có AI hỗ trợ đưa ra mức giá trần phù hợp.

### 📦 Nhóm 3: Transactional Execution (Thực thi giao dịch)
*   **PO Module (Đơn hàng mua sắm)**: 
    *   Quản lý phiên bản đơn hàng (PO Amendment) và lịch sử thay đổi.
    *   Tự động tạo file PO PDF chuẩn hóa và quản lý ký số (Digital Signature).
*   **GRN Module (Nhập kho)**:
    *   Hỗ trợ nhập kho từng phần (Partial Delivery) và theo dõi số lượng tồn đọng.
    *   Hệ thống QC tích hợp: Chấm điểm chất lượng, chụp ảnh minh chứng tại hiện trường và ghi nhận lỗi.
    *   Tự động kích hoạt luồng **Return to Vendor (RTV)** nếu hàng hóa bị loại bỏ trong quá trình QC.

### 💰 Nhóm 4: Financial Settlement (Quyết toán tài chính)
*   **Invoice & 3-Way Matching**:
    *   Tự động đối soát khớp 3 bên: `PO Quantity/Price` ↔ `GRN Quantity` ↔ `Invoice Quantity/Price`.
    *   Phát hiện sai lệch (Variance) và tự động chuyển trạng thái `Exception Review` cho phòng Tài chính nếu vượt ngưỡng cho phép.
*   **Escrow & Payment**:
    *   Cơ chế ký quỹ (Escrow): Tiền được giữ an toàn trên hệ thống và chỉ giải ngân cho nhà cung cấp khi GRN được xác nhận "Pass QC".

---

## 4. Luồng Tự động hóa Thông minh (Automation Flow)

Chúng tôi triển khai cơ chế **Event-Driven Automation** (Tự động hóa theo sự kiện) để loại bỏ các thao tác thừa:

### Luồng A: Auto-Sourcing (PR ➡️ RFQ)
1.  **Trigger**: Một PR được phê duyệt hoàn toàn (`APPROVED`).
2.  **Action**: 
    *   Hệ thống tự bốc tách dữ liệu PR Items để tạo `RfqRequest`.
    *   AI phân tích mặt hàng và tự động gửi lời mời thầu đến các nhà cung cấp có Trust Score > 80 trong cùng ngành hàng.
    *   RFQ tự động chuyển trạng thái sang `SENT` mà không cần nhân viên Procurement can thiệp.

### Luồng B: Auto-Ordering (RFQ ➡️ PO)
1.  **Trigger**: Người mua nhấn chọn "Trao thầu" (`Award`) cho một báo giá.
2.  **Action**: 
    *   Hệ thống tự động chuyển báo giá thắng thầu thành `Purchase Order`.
    *   Dữ liệu về giá, thuế, điều khoản thanh toán và lead-time được ánh xạ 1:1 sang PO.
    *   Tự động thực hiện cam kết ngân sách (`Committed Amount`) trong hệ thống tài chính.

---

## 5. Tích hợp Trí tuệ nhân tạo (AI Engine)

Module `ai-service` đóng vai trò là "Trợ lý ảo" cho toàn hệ thống:
*   **Supplier Scoring**: Chấm điểm báo giá dựa trên ma trận: Giá thầu (40%) + Thời gian giao hàng (30%) + Uy tín nhà cung cấp (30%).
*   **Risk Analysis**: Cảnh báo rủi ro về giá (quá thấp/quá cao) hoặc nhà cung cấp có lịch sử tranh chấp.
*   **OCR Integration**: Tự động bóc tách dữ liệu từ hóa đơn PDF hoặc ảnh chụp GRN của nhà cung cấp.

---

## 6. Sơ đồ dữ liệu cốt lõi (Data Relationship)

*   `User` ↔ `Department` ↔ `Organization` (Phân cấp tổ chức)
*   `PR` → `RFQ` → `Quotation` → `PO` (Chuỗi giá trị mua sắm)
*   `PO` ↔ `GRN` ↔ `Invoice` (Vòng lặp đối soát tài chính)
*   `ApprovalWorkflow` ↔ `AutomationService` (Điều khiển luồng nghiệp vụ)

---

## 7. Hướng dẫn Triển khai (Deployment)

1.  **Cài đặt**: `npm install` (trong thư mục server).
2.  **Database**: `npx prisma generate` && `npx prisma db push`.
3.  **Seeding**: `npx prisma db seed` (Khởi tạo luật duyệt, danh mục và user admin).
4.  **Running**: `npm run start:dev`.
5.  **Docs**: Xem tài liệu API tại `/api` (Swagger UI).

---
*Dự án hướng tới mục tiêu tối ưu hóa 100% quy trình mua sắm doanh nghiệp thông qua công nghệ.*
