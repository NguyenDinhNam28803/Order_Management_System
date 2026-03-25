# 📦 Enterprise Hybrid Order Management System (OMS)

Hệ thống Quản lý Đơn hàng, Thu mua (Procurement) và Thương mại điện tử (E-commerce) cấp doanh nghiệp. Tích hợp kiểm soát ngân sách thời gian thực, phê duyệt đa cấp và phân tích báo giá bằng AI.

---

## 🏗️ Kiến trúc Hệ thống (Technical Architecture)

Dự án sử dụng stack công nghệ hiện đại nhất (2025/2026):
*   **Frontend:** [Next.js 16](https://nextjs.org/) (App Router, Server Components) + [Tailwind CSS v4](https://tailwindcss.com/).
*   **Backend:** [NestJS 11](https://nestjs.com/) (Kiến trúc Module hóa, sẵn sàng cho Microservices).
*   **AI Service:** Tích hợp [Google Gemini](https://ai.google.dev/) để phân tích báo giá và tối ưu hóa chuỗi cung ứng.
*   **Database:** [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM v7](https://www.prisma.io/).
*   **Caching & Queue:** [Redis](https://redis.io/) + [BullMQ](https://docs.bullmq.io/) cho xử lý nền và thông báo.
*   **Real-time:** [Socket.io](https://socket.io/) cập nhật trạng thái đơn hàng tức thì.

---

## 🌟 Tính năng Nổi bật (Core Features)

### 1. Quy trình Thu mua Hybrid (B2B & B2C)
*   **Storefront:** Giao diện mua sắm hiện đại cho người dùng cuối.
*   **B2B Procurement:** Quy trình ERP chuyên sâu từ yêu cầu mua sắm (PR) đến thanh toán (Payment).

### 2. Trí tuệ Nhân tạo (AI Quotation Analysis)
*   Tự động so sánh hàng loạt báo giá từ nhà cung cấp dựa trên: **Giá thành, Lead time, Điểm uy tín (Trust Score)**.
*   Đề xuất nhà cung cấp tối ưu nhất bằng AI.

### 3. Kiểm soát Tài chính Chặt chẽ
*   **Budget Lock:** Phong tỏa ngân sách (`Committed`) ngay khi PO được phê duyệt.
*   **3-Way Matching:** Đối soát tự động **PO ↔ GRN ↔ Invoice** để ngăn chặn thất thoát.
*   **Audit Trail:** Lưu vết 100% các thay đổi nhạy cảm.

---

## 🔄 Quy trình Nghiệp vụ Chi tiết (End-to-End Procurement Workflow)

Hệ thống vận hành theo một luồng dữ liệu khép kín, được kiểm soát chặt chẽ bởi AI và các quy tắc tài chính:

### 1. Khởi tạo Yêu cầu mua sắm (Purchase Requisition - PR)
*   **Người yêu cầu (Requester):** Tạo PR kèm theo thông tin mặt hàng, số lượng và ngân sách dự kiến.
*   **Kiểm soát ngân sách:** Hệ thống kiểm tra hạn mức (`budget-module`) tại Cost Center tương ứng. Nếu vượt hạn mức, hệ thống yêu cầu phê duyệt đặc biệt.
*   **Phê duyệt:** PR được đẩy qua `approval-module` để Trưởng bộ phận hoặc Giám đốc phê duyệt dựa trên ma trận thẩm quyền (`ApprovalMatrixRule`).

### 2. Tìm kiếm & Phân tích báo giá (Sourcing & RFQ)
*   **RFQ:** Sau khi PR được duyệt, bộ phận thu mua (Procurement) tạo RFQ.
*   **AI Sourcing:** `ai-service` tự động quét danh sách nhà cung cấp (Suppliers) phù hợp với ngành hàng và lịch sử uy tín (`trust_score`).
*   **Phân tích (Quotation Analysis):** Khi nhận được báo giá, AI thực hiện đối soát:
    *   **Giá:** So sánh với giá tham chiếu (`unit_price_ref`).
    *   **Thời gian:** So sánh Lead time cam kết so với nhu cầu (`required_date`).
    *   **Điểm tin cậy:** Đánh giá dựa trên KPI quá khứ.
    *   **Kết quả:** Hệ thống đưa ra bảng xếp hạng (Ranking) kèm lý do đề xuất.

### 3. Đơn mua hàng & Phê duyệt (Purchase Order - PO)
*   **Chốt đơn:** Buyer chọn nhà cung cấp và tạo PO.
*   **Khóa ngân sách (Budget Lock):** Ngay khi PO ở trạng thái `APPROVED`, `budget-module` sẽ chuyển số tiền từ `Allocated` sang `Committed`. Điều này đảm bảo tiền không bị chi trùng cho yêu cầu khác.

### 4. Xác nhận & Hợp đồng (Confirmation & Contract)
*   **Ack:** Nhà cung cấp xác nhận đơn hàng qua Portal.
*   **Contract:** `contract-module` tự động sinh hợp đồng kinh tế dựa trên dữ liệu PO/Quotation, bao gồm các mốc thanh toán (Milestones) và điều khoản phạt vi phạm (Penalty).

### 5. Nhập kho & Kiểm soát chất lượng (GRN & QC)
*   **Tiếp nhận:** Warehouse tạo `Goods Receipt Note` (GRN).
*   **QC:** Hàng hóa được kiểm tra (`QcResult`). Chỉ những hàng `PASS` mới được nhập kho. Những mặt hàng `FAIL` sẽ tự động khởi tạo luồng trả hàng (`rtv-module` - Return To Vendor).

### 6. Đối soát 3 bước (3-Way Match)
Đây là "trái tim" chống thất thoát của hệ thống:
1.  **PO (Đặt hàng):** Số lượng/Giá theo đơn.
2.  **GRN (Thực nhận):** Số lượng hàng đạt chuẩn QC.
3.  **Invoice (Hóa đơn):** Yêu cầu thanh toán của nhà cung cấp.
*   Hệ thống tự động khớp 3 tài liệu này. Mọi chênh lệch (Variance) sẽ đẩy trạng thái hóa đơn về `EXCEPTION_REVIEW` để Kế toán xử lý thủ công.

### 7. Thanh toán & Giải ngân (Payment)
*   Sau khi khớp 3-way, lệnh thanh toán được chuyển sang trạng thái `PAYMENT_APPROVED`.
*   Tiền được giải ngân từ tài khoản ngân hàng hoặc Escrow (nếu có). Ngân sách chuyển từ `Committed` sang `Spent`.

### 8. Đánh giá nhà cung cấp (Performance Evaluation)
*   Sau khi hoàn tất đơn hàng, `ai-service` tự động cập nhật `trust_score` của nhà cung cấp dựa trên thực tế: Tỷ lệ giao hàng đúng hạn (OTD), tỷ lệ hàng lỗi (QC Failure Rate), tính chính xác của hóa đơn, v.v.

---

## 📂 Danh sách Module Backend

| Module | Trách nhiệm chính |
| :--- | :--- |
| `auth-module` | Quản lý định danh (JWT), RBAC. |
| `user-module` | Quản lý người dùng, tổ chức, Cost Center. |
| `prmodule` | Quản lý Purchase Requisition & Workflow. |
| `rfqmodule` | Quản lý RFQ, Đấu thầu, Báo giá. |
| `ai-service` | Logic AI (Phân tích báo giá, KPI). |
| `pomodule` | Quản lý PO, Budgeting logic. |
| `grnmodule` | Quản lý nhập kho (GRN) & QC. |
| `invoice-module` | Đối soát hóa đơn 3 bước (3-way match). |
| `payment-module` | Xử lý thanh toán & Escrow. |
| `budget-module` | Hạn mức chi tiêu theo phòng ban/năm. |
| `contract-module` | Quản lý hợp đồng & cột mốc thanh toán. |
| `supplier-kpimodule` | Đánh giá hiệu suất (KPI) nhà cung cấp. |
| `approval-module` | Workflow engine tập trung. |
| `dispute-module` | Xử lý tranh chấp. |
| `audit-module` | Ghi log hệ thống. |

---

## 🚀 Hướng dẫn Triển khai

### 1. Yêu cầu
*   Node.js v22+, Docker, Google Gemini API Key.

### 2. Thiết lập Environment
Tạo file `.env` trong `server/`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/oms_db"
JWT_SECRET="your_secret"
GEMINI_API_KEY="your_api_key"
```

### 3. Khởi chạy
**Backend:**
```bash
cd server
npm install
npx prisma migrate dev
npm run start:dev
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

---

## 🛡️ Bảo mật
*   **RBAC:** Phân quyền chi tiết cho tất cả các role (Requester, Approver, Buyer, Supplier, Admin).
*   **Data Integrity:** Sử dụng Database Transactions cho toàn bộ nghiệp vụ tài chính.
