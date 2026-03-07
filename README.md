# 📦 Enterprise Order Management System (OMS)

Hệ thống Quản lý Đơn hàng và Thu mua (Procurement) cấp doanh nghiệp, được tích hợp kiểm soát ngân sách thời gian thực, phê duyệt đa cấp và phân tích báo giá bằng AI.

---

## 🏗️ Kiến trúc Hệ thống (Technical Architecture)

Dự án được xây dựng theo mô hình **Decoupled Architecture**:
*   **Frontend:** Next.js (TypeScript) + Tailwind CSS (App Router).
*   **Backend:** NestJS (Node.js Framework) - Modular Architecture.
*   **Database:** PostgreSQL + Prisma ORM.
*   **Infrastructure:** Tích hợp Redis (Caching), BullMQ (Queueing cho Notification), và Socket.io (Real-time updates).

---

## 🚀 Quy trình Thu mua Chuyên sâu (Procurement Lifecycle)

Hệ thống mô phỏng quy trình ERP chuẩn quốc tế:

1.  **Purchase Requisition (PR):**
    *   Người dùng tạo yêu cầu mua sắm kèm mô tả kỹ thuật.
    *   Hệ thống tự động xác định phòng ban và trung tâm chi phí (Cost Center).
2.  **Multi-level Approval:**
    *   Dựa trên **Approval Matrix**, yêu cầu được gửi đến cấp quản lý tương ứng (Trưởng phòng -> Giám đốc -> CEO) tùy theo giá trị đơn hàng.
3.  **Sourcing & RFQ:**
    *   Chuyển PR thành Yêu cầu báo giá (RFQ).
    *   Mời các nhà cung cấp tham gia đấu thầu hoặc báo giá cạnh tranh.
4.  **AI Quotation Analysis:**
    *   Tự động so sánh giá, thời gian giao hàng (Lead time) và điểm uy tín (Trust Score) của nhà cung cấp.
    *   Đề xuất lựa chọn nhà cung cấp tối ưu.
5.  **Purchase Order (PO) & Budget Lock:**
    *   Khởi tạo PO chính thức. 
    *   **Critical Logic:** Hệ thống thực hiện "Lock" ngân sách (chuyển sang trạng thái `Committed`) để đảm bảo tính an toàn tài chính.
6.  **Goods Receipt (GRN):**
    *   Bộ phận kho xác nhận số lượng và chất lượng hàng nhận được.
    *   Hỗ trợ chụp ảnh hiện trường và ghi nhận lỗi (Dispute) nếu có.
7.  **Invoicing & 3-Way Matching:**
    *   Tự động đối soát: **Số lượng đặt (PO) == Số lượng nhận (GRN) == Số lượng tính tiền (Invoice)**.
    *   Nếu sai lệch vượt quá dung sai cho phép, hệ thống sẽ chặn thanh toán.
8.  **Payment & Finalization:**
    *   Thực hiện lệnh chi qua cổng thanh toán hoặc ký quỹ (Escrow).
    *   Giải phóng ngân sách cam kết và ghi nhận chi phí thực tế (`Spent`).

---

## 💰 Cơ chế Quản lý Ngân sách (Advanced Budgeting)

Đây là "trái tim" của hệ thống tài chính:

*   **Allocated (Ngân sách cấp):** Hạn mức được phê duyệt đầu năm cho từng Cost Center.
*   **Committed (Tạm giữ):** Ngân sách bị "phong tỏa" ngay khi PO được duyệt. 
    *   *Ví dụ:* Ngân sách còn 100tr, tạo PO 30tr -> Committed = 30tr, Available = 70tr.
*   **Spent (Thực chi):** Chỉ ghi nhận khi tiền thực tế rời khỏi tài khoản công ty.
*   **Release Logic:** Nếu PO bị hủy, số tiền `Committed` sẽ được hoàn trả lại `Available` ngay lập tức.

---

## 📂 Danh sách Module & Trách nhiệm

| Module | Mô tả |
| :--- | :--- |
| `auth-module` | Quản lý định danh, JWT, MFA và phân quyền (Requester, Approver, Supplier, Admin). |
| `prmodule` | Quản lý yêu cầu mua sắm và luồng phê duyệt nội bộ. |
| `rfqmodule` | Quản lý đấu thầu, báo giá và so sánh nhà cung cấp bằng AI. |
| `pomodule` | Quản lý đơn hàng, theo dõi giao hàng và kiểm soát ngân sách. |
| `grnmodule` | Quản lý nhập kho, kiểm tra chất lượng (QC) và trả hàng (RTV). |
| `invoice-module` | Đối soát hóa đơn 3 bước và quản lý thuế. |
| `contract-module` | Quản lý hợp đồng khung, NDA và các mốc thanh toán theo giai đoạn. |
| `budget-module` | Thiết lập hạn mức chi tiêu theo phòng ban và năm tài chính. |
| `audit-module` | Lưu vết 100% các thao tác nhạy cảm (Ghi log old_value/new_value). |
| `dispute-module` | Xử lý khiếu nại giữa Người mua và Nhà cung cấp. |
| `notification-module` | Gửi thông báo tự động qua Email/SMS/Push khi có sự kiện cần phê duyệt. |

---

## 🛠️ Hướng dẫn Triển khai (Deployment Guide)

### 1. Yêu cầu Hệ thống
*   Node.js v20+
*   PostgreSQL v15+
*   Redis (tùy chọn cho Caching)

### 2. Cấu hình Biến môi trường (`server/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/oms_db?schema=public"
JWT_SECRET="your_super_secret_key"
EMAIL_HOST="smtp.gmail.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

### 3. Cài đặt Backend
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### 4. Cài đặt Frontend
```bash
cd client
npm install
npm run dev
```

---

## 🛡️ Bảo mật & Tuân thủ
*   **RBAC (Role-Based Access Control):** Kiểm soát truy cập chặt chẽ đến từng Endpoint API.
*   **Data Integrity:** Sử dụng Database Transaction cho tất cả các nghiệp vụ liên quan đến Tiền và Ngân sách.
*   **Audit Trail:** Mọi hành động xóa hoặc sửa dữ liệu quan trọng đều được ghi lại trong `AuditLog`.

---

## 📧 Liên hệ & Hỗ trợ
Nếu bạn gặp vấn đề trong quá trình cài đặt hoặc muốn tùy chỉnh logic nghiệp vụ, vui lòng liên hệ bộ phận kỹ thuật hoặc tạo Issue trên Git.
