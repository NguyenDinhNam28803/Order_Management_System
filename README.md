# 📦 Enterprise Hybrid Order Management System (OMS)

Hệ thống Quản lý Đơn hàng, Thu mua (Procurement) và Thương mại điện tử (E-commerce) cấp doanh nghiệp. Tích hợp kiểm soát ngân sách thời gian thực, phê duyệt đa cấp và phân tích báo giá bằng AI.

---

## 🏗️ Kiến trúc Hệ thống (Technical Architecture)

Dự án sử dụng các công nghệ tiên tiến nhất (2025/2026 stack):
*   **Frontend:** [Next.js 16](https://nextjs.org/) (App Router, Server Components) + [Tailwind CSS v4](https://tailwindcss.com/) (High Performance Styling).
*   **Backend:** [NestJS 11](https://nestjs.com/) (Modular Architecture, Microservices ready).
*   **AI Service:** Tích hợp [Google Generative AI (Gemini)](https://ai.google.dev/) & [OpenAI](https://openai.com/) để phân tích báo giá và tối ưu hóa chuỗi cung ứng.
*   **Database:** [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM v7](https://www.prisma.io/) (Type-safe database access).
*   **Caching & Queue:** [Redis](https://redis.io/) + [BullMQ](https://docs.bullmq.io/) cho xử lý nền và thông báo thời gian thực.
*   **Real-time:** [Socket.io](https://socket.io/) cho cập nhật trạng thái đơn hàng tức thì.

---

## 🌟 Tính năng Nổi bật (Core Features)

### 1. Quy trình Thu mua Hybrid (B2B & B2C)
*   **Storefront (e-Shopi):** Giao diện mua sắm hiện đại cho người dùng cuối với các mục Trending, Hot Arrivals và Special Products.
*   **B2B Procurement:** Quy trình ERP chuyên sâu từ yêu cầu mua sắm (PR) đến thanh toán (Payment).

### 2. Trí tuệ Nhân tạo (AI Quotation Analysis)
*   Tự động so sánh hàng loạt báo giá từ nhiều nhà cung cấp.
*   Đánh giá dựa trên: Giá thành, Thời gian giao hàng (Lead time), và Điểm uy tín (Trust Score).
*   Đề xuất nhà cung cấp tối ưu nhất bằng AI.

### 3. Kiểm soát Tài chính Chặt chẽ
*   **Budget Lock:** Tự động phong tỏa ngân sách (`Committed`) ngay khi Purchase Order được phê duyệt.
*   **3-Way Matching:** Đối soát tự động giữa **PO (Đơn hàng) == GRN (Nhập kho) == Invoice (Hóa đơn)** để ngăn chặn thất thoát.
*   **Audit Trail:** Lưu vết 100% các thay đổi nhạy cảm về giá và số lượng.

---

## 📂 Danh sách Module & Trách nhiệm (Backend Modules)

| Module | Trách nhiệm chính |
| :--- | :--- |
| `auth-module` | Quản lý định danh (JWT), MFA và phân quyền (RBAC). |
| `user-module` | Quản lý hồ sơ người dùng, thông tin tổ chức và Cost Center. |
| `product-module` | Quản lý danh mục sản phẩm, tồn kho và thông tin kỹ thuật mặt hàng. |
| `prmodule` | Quản lý Purchase Requisition và luồng phê duyệt nội bộ. |
| `rfqmodule` | Quản lý Request for Quotation và đấu thầu nhà cung cấp. |
| `ai-service` | Core AI xử lý logic phân tích báo giá và tối ưu hóa dữ liệu. |
| `pomodule` | Quản lý Purchase Order, theo dõi lộ trình giao hàng và Budgeting logic. |
| `grnmodule` | Quản lý Goods Receipt Note, kiểm tra chất lượng (QC) và nhập kho. |
| `invoice-module` | Đối soát hóa đơn 3 bước (3-way match) và quản lý thuế. |
| `payment-module` | Xử lý thanh toán, tích hợp cổng thanh toán và lịch sử giao dịch. |
| `budget-module` | Thiết lập hạn mức chi tiêu theo phòng ban và năm tài chính. |
| `contract-module` | Quản lý hợp đồng khung, NDA và các điều khoản thanh toán. |
| `supplier-kpimodule` | Theo dõi và đánh giá chỉ số hiệu suất (KPI) của nhà cung cấp. |
| `approval-module` | Engine phê duyệt tập trung cho toàn bộ hệ thống (Workflow Engine). |
| `audit-module` | Ghi log chi tiết các thao tác (Audit Logging). |
| `notification-module` | Gửi thông báo đa kênh: Email, SMS (Twilio), và Socket.io. |
| `admin-module` | Dashboard quản trị cao cấp và thiết lập hệ thống. |
| `system-config-module` | Cấu hình tham số toàn cục (Thuế, Tiền tệ, SLA). |

---

## 🚀 Hướng dẫn Triển khai (Deployment Guide)

### 1. Yêu cầu Hệ thống
*   Node.js v22+
*   Docker (để chạy PostgreSQL, Redis)
*   Google Gemini API Key (cho tính năng AI)

### 2. Thiết lập Biến môi trường
Tạo file `.env` trong thư mục `server/`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/oms_db"
JWT_SECRET="your_secret"
REDIS_HOST="localhost"
REDIS_PORT=6379
GEMINI_API_KEY="your_api_key"
```

### 3. Cài đặt & Chạy ứng dụng

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

## 🛡️ Bảo mật & Tuân thủ
*   **Role-Based Access Control (RBAC):** Phân quyền chi tiết cho Requester, Approver, Buyer, Supplier, và Admin.
*   **Data Integrity:** Sử dụng Database Transactions cho tất cả các nghiệp vụ tài chính.
*   **Security:** Tích hợp Helmet, Rate Limiting, và CSRF Protection.

---

## 📧 Liên hệ & Hỗ trợ
Mọi thắc mắc vui lòng tạo Issue trên GitHub hoặc liên hệ qua email: `support@oms-enterprise.com`.
