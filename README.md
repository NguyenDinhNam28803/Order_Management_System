# 🚀 Smart E-Procurement & Order Management System (OMS)

Hệ thống quản trị mua sắm tập trung (**E-Procurement**) và Quản lý đơn hàng (**OMS**) toàn diện, tích hợp AI (Gemini) để tự động hóa chu trình **Procure-to-Pay**.

---

## ✨ Tính Năng Cốt Lõi

*   **Chu trình P2P tự động:** Từ yêu cầu mua sắm (PR) -> Báo giá (RFQ) -> Đơn hàng (PO) -> Nhập kho (GRN) -> Hóa đơn (Invoice) -> Thanh toán.
*   **Trợ lý AI (Gemini):** Tự động phân tích báo giá, gợi ý nhà cung cấp và chấm điểm KPI nhà cung cấp dựa trên dữ liệu thực tế.
*   **Kiểm soát Ngân sách:** Quản lý ngân sách theo Trung tâm chi phí (Cost Center) và Phòng ban, cảnh báo vượt hạn mức.
*   **Phê duyệt Đa cấp:** Quy trình phê duyệt linh hoạt dựa trên giá trị đơn hàng và vai trò người dùng.
*   **Đối soát 3 chiều:** Tự động khớp dữ liệu giữa PO, GRN và Hóa đơn để đảm bảo tính chính xác trước khi thanh toán.

---

## 🏗️ Công Nghệ Sử Dụng

*   **Frontend:** Next.js 16 (App Router), React 19, TailwindCSS 4.
*   **Backend:** NestJS 11, Prisma ORM, PostgreSQL 16.
*   **Khác:** Redis (BullMQ), Socket.io, Google Gemini AI.

---

## 🛠️ Cài Đặt & Chạy

### 1. Backend (`/server`)
```bash
npm install
# Cấu hình .env (DATABASE_URL, GEMINI_API_KEY, REDIS_HOST)
npx prisma db push
npm run start:dev
```

### 2. Frontend (`/client`)
```bash
npm install
# Cấu hình .env.local (NEXT_PUBLIC_API_URL)
npm run dev
```

---

## 📂 Cấu Trúc Dự Án

*   `client/app`: Giao diện người dùng theo vai trò (Buyer, Supplier, Finance, Warehouse...).
*   `server/src`: Logic nghiệp vụ (Duyệt, Ngân sách, Tự động hóa, AI...).
*   `server/prisma`: Định nghĩa mô hình dữ liệu (Schema).

---

## 👨‍💻 Thông Tin

*   **Tác giả:** Nguyễn Đình Nam
*   **Trạng thái:** Sẵn sàng vận hành.
*   **License:** Proprietary (FPT Corporation).
