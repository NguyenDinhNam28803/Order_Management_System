# 🚀 Smart E-Procurement & Order Management System (OMS)

Hệ thống quản trị mua sắm tập trung (E-Procurement) toàn diện, tích hợp Trí tuệ nhân tạo (AI) để tối ưu hóa quy trình từ yêu cầu mua sắm đến thanh toán (Procure-to-Pay).

---

## 🏗️ Kiến trúc Dự án (Project Architecture)

*   **`/client`**: Next.js 16 (React 19), Tailwind CSS 4.
*   **`/server`**: NestJS, Prisma, PostgreSQL, AI Engine (Gemini/OpenAI).

---

## 🚀 Công nghệ sử dụng

- **Framework:** [NestJS](https://nestjs.com/) (Node.js) - Kiến trúc module mạnh mẽ và dễ mở rộng.
- **Database ORM:** [Prisma](https://www.prisma.io/) kết nối PostgreSQL.
- **Xác thực:** JWT (JSON Web Token), Passport.js, Bcrypt mã hóa mật khẩu.
- **AI Integration:** OpenAI API & Google Generative AI (Gemini) cho các tính năng thông minh.
- **Real-time:** Socket.io cho thông báo tức thời.
- **Caching & Queue:** Redis & BullMQ xử lý tác vụ nền và hàng đợi.
- **Tài liệu API:** Swagger UI (OpenAPI).
- **Giao tiếp:** Nodemailer (Email) & Twilio (SMS).

---

## 🧩 Chi tiết các Nhóm Module Nghiệp vụ (Business Domains)

Hệ thống được tổ chức thành 5 nhóm module chính để đảm bảo tính tách biệt và dễ bảo trì:

### 🛡️ 1. Nhóm Quản trị & Hệ thống (Core & Admin)
*   **`auth-module`**: Xử lý Đăng nhập/Đăng ký, JWT, Phân quyền dựa trên vai trò (RBAC).
*   **`user-module`**: Quản lý hồ sơ người dùng và phân quyền chi tiết.
*   **`organization-module`**: Định nghĩa cấu trúc công ty (Chi nhánh, Phòng ban, Tổ chức con).
*   **`system-config-module`**: Lưu trữ cấu hình hệ thống (Tỷ giá, tham số phê duyệt, cài đặt email).
*   **`audit-module`**: Ghi lại nhật ký thay đổi dữ liệu (Audit Log - Who, When, What).

### 🛒 2. Nhóm Thu mua & Cung ứng (Procurement & Sourcing)
*   **`prmodule` (Purchase Request)**: Khởi tạo yêu cầu mua sắm, kiểm tra ngân sách tự động.
*   **`rfqmodule` (Request for Quotation)**: Quản lý yêu cầu báo giá và so sánh giá từ các nhà cung cấp.
*   **`pomodule` (Purchase Order)**: Quản lý đơn hàng chính thức từ PR/RFQ đã duyệt.
*   **`product-module`**: Quản lý danh mục sản phẩm, mã SKU và giá tham chiếu.
*   **`supplier-kpimodule`**: Đánh giá hiệu quả nhà cung cấp (Giao hàng, Chất lượng, Giá cả).

### 💰 3. Nhóm Tài chính & Kiểm soát (Finance & Compliance)
*   **`budget-module`**: Quản lý hạn mức ngân sách theo năm/quý/tháng.
*   **`cost-center-module`**: Phân bổ chi phí cho từng trung tâm chi phí cụ thể.
*   **`approval-module`**: Công cụ xử lý luồng phê duyệt động theo điều kiện (Amount, Department).
*   **`invoice-module`**: Tiếp nhận hóa đơn và thực hiện **"3-way matching"** (PO - GRN - Invoice).
*   **`payment-module`**: Lập kế hoạch và theo dõi lịch sử thanh toán.

### 📦 4. Nhóm Vận hành & Kho (Operations & Logistics)
*   **`grnmodule` (Goods Receipt Note)**: Xác nhận số lượng/chất lượng hàng thực tế nhận tại kho.
*   **`dispute-module`**: Xử lý các tranh chấp, khiếu nại hàng hóa (thiếu, hỏng).
*   **`review-module`**: Người dùng đánh giá chất lượng sản phẩm và dịch vụ sau khi nhận hàng.

### 🧠 5. Nhóm Thông minh & Giao tiếp (Intelligence & Communication)
*   **`ai-service`**: Tích hợp AI để gợi ý nhà cung cấp, phân tích chi tiêu và dự báo nhu cầu.
*   **`notification-module`**: Thông báo thời gian thực qua Web (Socket), Email và SMS.
*   **`report-module`**: Xuất báo cáo tổng quan chi tiêu và hiệu suất thu mua.

---

## 🔄 Luồng Nghiệp vụ Chi tiết (Detailed Operational & Data Flow)

Đây là quy trình vận hành chi tiết của hệ thống, mô tả cách dữ liệu di chuyển và xử lý trong các tình huống khác nhau.

### 1. Giai đoạn: Khởi tạo Yêu cầu (Purchase Request - PR)
*   **Hành động**: User (Requester) tạo và gửi PR.
*   **Dữ liệu đi đâu?**: 
    *   Tạo bản ghi trong bảng `PR` với trạng thái `PENDING`.
    *   Truy vấn bảng `Budget` để kiểm tra số dư.
*   **Trường hợp ĐÚNG (Hợp lệ)**: 
    *   Ngân sách đủ -> Hệ thống thực hiện **Soft Commit** (Trừ ảo vào `Budget.HoldAmount`).
    *   Gửi thông báo (Socket.io/Email) cho người duyệt cấp 1.
*   **Trường hợp SAI (Thất bại)**: 
    *   Ngân sách thiếu -> Trả về lỗi `400 Bad Request`. Dữ liệu PR không được lưu hoặc giữ trạng thái `DRAFT` kèm cảnh báo "Over Budget".

### 2. Giai đoạn: Phê duyệt (Approval Workflow)
*   **Hành động**: Người duyệt (Approver) nhấn Duyệt hoặc Từ chối.
*   **Dữ liệu đi đâu?**: 
    *   Cập nhật bảng `ApprovalLog`.
    *   Nếu duyệt: Chuyển trạng thái PR hoặc đẩy lên cấp duyệt cao hơn dựa trên `ApprovalMatrix`.
*   **Trường hợp ĐÚNG (Duyệt hết)**: 
    *   PR chuyển trạng thái `APPROVED`. 
    *   Dữ liệu sẵn sàng để chuyển thành RFQ hoặc PO.
*   **Trường hợp SAI (Từ chối)**: 
    *   Dữ liệu PR chuyển trạng thái `REJECTED`. 
    *   Giải phóng ngân sách: Trả lại số tiền từ `Budget.HoldAmount` về lại ngân sách khả dụng.
    *   Thông báo cho Requester kèm lý do từ chối.

### 3. Giai đoạn: Tìm nguồn & Báo giá (RFQ - Strategic Sourcing)
*   **Hành động**: Chuyển PR -> RFQ và mời Nhà cung cấp báo giá.
*   **Dữ liệu đi đâu?**: 
    *   Tạo bảng `RFQ` liên kết với `PR_Items`.
    *   Gửi email/Portal link cho `Suppliers`.
*   **Trường hợp ĐÚNG (Có báo giá tốt)**: 
    *   AI so sánh báo giá, gợi ý Vendor thắng thầu. 
    *   Người dùng chọn "Award" -> Hệ thống tự động khóa RFQ và chuẩn bị tạo PO.
*   **Trường hợp SAI (Không có báo giá/Giá quá cao)**: 
    *   Hệ thống cho phép mở vòng đấu thầu mới hoặc hủy RFQ.

### 4. Giai đoạn: Nhận hàng & Kiểm soát chất lượng (GRN & QC)
*   **Hành động**: Kho xác nhận nhập hàng (Goods Receipt Note).
*   **Dữ liệu đi đâu?**: 
    *   Cập nhật số lượng thực nhận vào bảng `GRN`.
    *   Liên kết `GRN` với `PO`.
*   **Trường hợp ĐÚNG (Khớp hoàn toàn)**: 
    *   Số lượng thực nhận = Số lượng đặt trên PO. 
    *   Trạng thái đơn hàng chuyển sang `RECEIVED`.
*   **Trường hợp SAI (Sai lệch/Hỏng)**: 
    *   Thực nhận < Đặt hàng -> PO ở trạng thái `PARTIALLY_RECEIVED`.
    *   Hàng hỏng -> Kích hoạt module `Dispute`. Dữ liệu lỗi được lưu vào `DisputeLog`, tạm dừng luồng thanh toán cho phần hàng lỗi.

### 5. Giai đoạn: Đối soát 3 bên & Thanh toán (3-Way Match & Payment)
*   **Hành động**: Kế toán tiếp nhận Hóa đơn (Invoice).
*   **Dữ liệu đi đâu?**: 
    *   Hệ thống chạy thuật toán so sánh: `PO.Price/Qty` vs `GRN.Qty` vs `Invoice.Price/Qty`.
*   **Trường hợp ĐÚNG (Match Success)**: 
    *   Dữ liệu khớp -> Tạo lệnh thanh toán `PaymentSchedule`.
    *   Thực hiện **Hard Commit**: Trừ ngân sách thực tế (`Budget.ActualSpent`), giải phóng hoàn toàn `HoldAmount`.
*   **Trường hợp SAI (Mismatch)**: 
    *   Lệch giá hoặc số lượng -> Hệ thống chặn thanh toán, đẩy vào trạng thái `PENDING_REVIEW`. 
    *   Gửi cảnh báo cho phòng Thu mua và Tài chính để xử lý thủ công.

---

## ⚙️ Hệ thống Tự động hóa (Automation Engine)

Hệ thống được thiết kế với các điểm chạm tự động (Automated Touchpoints) để giảm thiểu thao tác thủ công và sai sót:

1.  **Auto-Budget Check**: Tự động kiểm tra và giữ ngân sách (Soft Commit) ngay khi PR được tạo.
2.  **Auto-Approval Routing**: Tự động xác định cấp phê duyệt dựa trên ma trận rủi ro (Giá trị đơn hàng, Loại hàng hóa).
3.  **Auto-GRN Creation (New)**: Ngay khi Purchase Order (PO) được phê duyệt hoàn toàn, hệ thống tự động khởi tạo bản ghi Goods Receipt Note (GRN) ở trạng thái chờ nhập hàng, giúp bộ phận kho chuẩn bị kế hoạch tiếp nhận.
4.  **Auto-3-Way Matching**: Tự động so khớp dữ liệu giữa PO, GRN và Invoice để phát hiện sai lệch giá và số lượng.
5.  **AI Supplier Suggestion**: Tự động phân tích và đề xuất 3 nhà cung cấp tối ưu nhất cho mỗi yêu cầu mua sắm.

---

## 🤖 Vai trò của AI trong luồng dữ liệu
*   **Input**: Dữ liệu thô từ báo giá (PDF/Excel).
*   **Process**: AI bóc tách dữ liệu, chấm điểm Vendor dựa trên tiêu chí: Giá (40%), Lead-time (30%), Quality (30%).
*   **Output**: Bảng xếp hạng gợi ý giúp người mua ra quyết định trong bước "Award RFQ".

---
*Tài liệu được thiết kế để hỗ trợ cả Developer và Business Analyst.*
