# 🚀 Smart E-Procurement & Order Management System (OMS)

Hệ thống quản trị mua sắm tập trung (E-Procurement) toàn diện, tích hợp Trí tuệ nhân tạo (AI) để tối ưu hóa quy trình từ yêu cầu mua sắm đến thanh toán (Procure-to-Pay). Dự án được thiết kế với kiến trúc module mạnh mẽ, khả năng tự động hóa cao và giao diện người dùng hiện đại.

---

## 🏗️ Kiến trúc Dự án (Project Architecture)

Hệ thống được chia làm hai phần chính:

*   **`/client`**: Ứng dụng Frontend xây dựng bằng Next.js 16 (React 19), Tailwind CSS 4. Sử dụng Lucide React cho icon và React Hook Form cho quản lý biểu mẫu.
*   **`/server`**: Hệ thống Backend xây dựng bằng NestJS (Node.js framework). Sử dụng Prisma làm ORM kết nối cơ sở dữ liệu PostgreSQL. Tích hợp Redis và BullMQ để xử lý hàng đợi và cache.

---

## 🚀 Công nghệ sử dụng

### Frontend
- **Framework:** Next.js 16 (React 19) - Tối ưu hóa hiệu năng và SEO.
- **Styling:** Tailwind CSS 4 - Framework CSS hiện đại.
- **State Management:** React Context API (ProcurementProvider).
- **Icons:** Lucide React.
- **Form Handling:** React Hook Form & Zod.

### Backend
- **Framework:** NestJS - Kiến trúc module dễ mở rộng.
- **Database:** PostgreSQL với Prisma ORM.
- **AI Integration:** Google Generative AI (Gemini 1.5/3 Flash) cho các tính năng thông minh.
- **Real-time:** Socket.io cho thông báo thời gian thực.
- **Caching & Queue:** Redis & BullMQ xử lý tác vụ nền.
- **Security:** JWT (JSON Web Token), Passport.js, Bcrypt.
- **Communication:** Nodemailer (Email) & Twilio (SMS).

---

## 🧩 Chi tiết các Nhóm Module Nghiệp vụ (Business Domains)

### 🛡️ 1. Nhóm Quản trị & Hệ thống (Core & Admin)
*   **`auth-module`**: Xử lý xác thực, phân quyền dựa trên vai trò (RBAC) với các quyền: REQUESTER, APPROVER, PROCUREMENT, FINANCE, WAREHOUSE, ADMIN.
*   **`user-module` & `organization-module`**: Quản lý hồ sơ người dùng, sơ đồ tổ chức, phòng ban và chi nhánh.
*   **`system-config-module`**: Quản lý cấu hình toàn hệ thống.
*   **`audit-module`**: Ghi lại mọi thay đổi dữ liệu phục vụ hậu kiểm.

### 🛒 2. Nhóm Thu mua & Cung ứng (Procurement & Sourcing)
*   **`prmodule`**: Quản lý Purchase Request (Yêu cầu mua sắm).
*   **`rfqmodule`**: Quản lý Request for Quotation (Yêu cầu báo giá), mời thầu và so sánh giá.
*   **`pomodule`**: Quản lý Purchase Order (Đơn hàng chính thức).
*   **`product-module`**: Danh mục sản phẩm, SKU và quản lý giá tham chiếu.
*   **`supplier-kpimodule`**: Đánh giá hiệu suất nhà cung cấp dựa trên dữ liệu thực tế.

### 💰 3. Nhóm Tài chính & Kiểm soát (Finance & Compliance)
*   **`budget-module`**: Quản lý ngân sách (Allocated, Committed, Spent) theo năm/quý.
*   **`cost-center-module`**: Quản lý trung tâm chi phí cho từng bộ phận.
*   **`approval-module`**: Ma trận phê duyệt động dựa trên giá trị đơn hàng và loại tài liệu.
*   **`invoice-module`**: Xử lý hóa đơn nhà cung cấp.
*   **`payment-module`**: Lập kế hoạch và thực hiện thanh toán.

### 📦 4. Nhóm Vận hành & Kho (Operations & Logistics)
*   **`grnmodule`**: Goods Receipt Note - Quy trình nhận hàng và kiểm tra chất lượng (QC).
*   **`dispute-module`**: Xử lý khiếu nại, tranh chấp hàng hóa lỗi hoặc thiếu.
*   **`review-module`**: Đánh giá chất lượng sau khi nhận hàng.

### 🧠 5. Nhóm Thông minh & Giao tiếp (Intelligence & Communication)
*   **`ai-service`**: Trợ lý CPO ảo, phân tích báo giá và gợi ý nhà cung cấp.
*   **`notification-module`**: Hệ thống thông báo đa kênh (Web, Email, SMS).

---

## 🔄 Luồng Nghiệp vụ Chi tiết (End-to-End Data Flow)

Hệ thống vận hành theo quy trình khép kín với các bước tự động hóa then chốt:

### 1. Khởi tạo Yêu cầu (PR) & Kiểm tra Ngân sách
- Người dùng tạo PR. Hệ thống tự động truy vấn `BudgetAllocation`.
- **Soft Commit**: Nếu đủ ngân sách, số tiền dự kiến được cộng vào `committedAmount`.
- Trạng thái PR chuyển sang `PENDING_APPROVAL`.

### 2. Phê duyệt Động (Approval Workflow)
- `ApprovalModuleService` dựa vào `ApprovalMatrixRule` để xác định danh sách người duyệt.
- Hỗ trợ duyệt nhiều cấp (Trưởng phòng -> Giám đốc -> CEO) dựa trên ngưỡng số tiền.
- Nếu bị từ chối, ngân sách `committedAmount` được giải phóng ngay lập tức.

### 3. Tìm nguồn Chiến lược (RFQ) & AI Suggestion
- PR được duyệt hoàn toàn sẽ kích hoạt `AutomationService` để tạo RFQ.
- AI phân tích mặt hàng và gợi ý danh sách nhà cung cấp phù hợp nhất từ database hoặc tìm kiếm bên ngoài.
- Hệ thống gửi lời mời báo giá tự động qua Email cho các nhà cung cấp được chọn.

### 4. Báo giá & Phân tích AI
- Nhà cung cấp nộp báo giá qua Portal.
- AI thực hiện chấm điểm báo giá dựa trên 3 tiêu chí: **Giá cả (40%)**, **Thời gian giao hàng (30%)**, và **Uy tín nhà cung cấp (30%)**.
- AI cung cấp bản tóm tắt Ưu/Nhược điểm của từng báo giá để Buyer ra quyết định.

### 5. Đơn hàng (PO) & Tự động hóa Kho
- Khi Buyer chọn "Award" cho một báo giá, hệ thống tự động:
    1. Chuyển RFQ sang trạng thái `AWARDED`.
    2. Tạo Purchase Order (PO) với đầy đủ thông tin từ báo giá.
    3. Cập nhật lại cam kết ngân sách chính xác theo giá trị PO.
    4. Tự động khởi tạo bản ghi Goods Receipt (GRN) ở trạng thái `DRAFT` để bộ phận kho chuẩn bị nhận hàng.

### 6. Nhận hàng (GRN) & Đối soát 3 bên (3-Way Match)
- Kho thực hiện xác nhận số lượng thực nhận và kết quả QC.
- Kế toán tiếp nhận hóa đơn (Invoice). Hệ thống thực hiện so khớp tự động giữa: **PO (Đặt hàng) - GRN (Thực nhận) - Invoice (Hóa đơn)**.

### 7. Thanh toán & Hard Commit
- Sau khi thanh toán thành công, hệ thống thực hiện **Hard Commit**:
    - Trừ `committedAmount`.
    - Cộng vào `spentAmount`.
- Ghi nhận lịch sử vào `AuditLog`.

---

## ⚙️ Hệ thống AI & Tự động hóa (Automation Engine)

Hệ thống tích hợp "CPO Virtual Assistant" giúp tối ưu hóa vận hành:

1.  **Auto-Generation**: Tự động chuyển đổi chứng từ (PR -> RFQ, RFQ -> PO, PO -> GRN).
2.  **AI Analysis**: Phân tích rủi ro nhà cung cấp từ lịch sử tranh chấp và KPI.
3.  **Natural Language Query**: Cho phép người quản lý hỏi đáp về dữ liệu hệ thống bằng ngôn ngữ tự nhiên (Vd: "Liệt kê các nhà cung cấp có tỷ lệ giao hàng trễ cao nhất").
4.  **Auto-Escalation**: Tự động nhắc nhở hoặc chuyển cấp phê duyệt nếu quá thời hạn SLA.

---

## 🛠️ Hướng dẫn Cài đặt & Phát triển

### Yêu cầu hệ thống
- Node.js 18+
- PostgreSQL
- Redis
- Google Gemini API Key

### Cài đặt Backend
```bash
cd server
npm install
# Tạo tệp .env dựa trên danh sách biến môi trường bên dưới
npx prisma generate
npm run start:dev
```

### Cài đặt Frontend
```bash
cd client
npm install
npm run dev
```

### Biến môi trường (.env) quan trọng
| Biến | Mô tả |
| :--- | :--- |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL |
| `GEMINI_API_KEY` | API Key từ Google AI Studio |
| `JWT_SECRET` | Khóa bí mật cho xác thực JWT |
| `REDIS_HOST/PORT` | Cấu hình kết nối Redis |
| `EMAIL_HOST/USER/PASS` | Cấu hình gửi thông báo qua Email |

---
*Tài liệu này được cập nhật dựa trên cấu trúc mã nguồn thực tế của dự án.*
