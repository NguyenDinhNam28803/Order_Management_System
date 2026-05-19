# 🎯 Giải Thích Sự Khác Biệt Giữa Flow 1 và Flow 2

## ❓ Câu Hỏi
"Vì sao đều báo giá như nhau mà Flow 2 là tạo PR chính thức là như thế nào?"

---

## 🔑 Câu Trả Lời: Họ KHÔNG Báo Giá Giống Nhau!

### Flow 1: RFQ = Yêu Cầu Báo Giá **CHỈ ĐỊNH** (Fixed Scope)
**Nghĩa:** Nhà CC báo giá dựa trên **số lượng, loại sản phẩm CỐ ĐỊNH writen trong RFQ**

```
PR ban đầu: Mua A4 Paper 10 ream
    ↓
Auto tạo RFQ: "Báo giá cho 10 ream A4 Paper, chất lượng XXX, loại XXX"
    ↓
Nhà CC báo: "10 ream A4 Paper = 520,000 VND"
    ↓
Award → Tạo PO: Mua 10 ream, 520,000 VND
```

**Kết quả:** PO = PR ban đầu (không thay đổi)

---

### Flow 2: QuotationRequest = Yêu Cầu Báo Giá **CHỈ MỤC/DANH MỤC** (Flexible Scope)
**Nghĩa:** Nhà CC báo giá có thể **thay đổi số lượng, loại sản phẩm, giá** - và procurement sẽ tạo PR CHÍNH THỨC MỚI dựa trên báo giá này!

```
PR ban đầu: Mua Windows Server 3 license + Azure 12 tháng (47 triệu)
    ↓
Status: DRAFT/Quick Quote - để ý, đây chỉ là "dự toán" ban đầu
    ↓
Auto tạo QuotationRequest: "Báo giá cho danh mục Phần mềm"
    ↓
Nhà CC báo (có thể khác dự kiến):
   "Chúng tôi có gói bundle kinh tế hơn:
    - Windows Server 5 license (không phải 3)
    - Azure 12 tháng (giữ nguyên)
    - Giá: 35 triệu (giảm từ 47 triệu)"
    ↓
Procurement officer xem báo giá → Quyết định:
   "Tốt hơn dự kiến! Tôi tạo PR CHÍNH THỨC MỚI:
    - Windows Server 5 license (cập nhật)
    - Azure 12 tháng
    - Giá: 35 triệu (cập nhật)
    - Ghi chú: Theo báo giá từ nhà CC"
    ↓
PR mới được duyệt → Tạo PO: Mua 5 license + 12 tháng Azure, 35 triệu
```

**Kết quả:** PO ≠ PR ban đầu (THAY ĐỔI dựa trên báo giá của nhà CC)

---

## 📊 So Sánh Chi Tiết

| Khía Cạnh | Flow 1 (STABLE) | Flow 2 (VOLATILE) |
|----------|-----------------|-------------------|
| **Tài liệu yêu cầu** | RFQ (cố định scope) | QuotationRequest (linh hoạt scope) |
| **Scope of Quote** | ✅ Cố định: "Báo giá cho X sản phẩm, Q số lượng" | 🔄 Linh hoạt: "Báo giá cho danh mục này (sản phẩm/qty có thể thay)" |
| **Nhà CC báo giá** | Phải báo giá đúng spec RFQ | Có thể đề xuất sản phẩm khác, số lượng khác, giá khác |
| **Ví dụ báo giá** | "10 ream A4 = 520k" | "5 license Windows + 12m Azure = 35 triệu (bundle sale)" |
| **Procurement phản ứng** | Chọn nhà CC → Award → Tạo PO | Xem báo giá → Có thể **tạo PR CHÍNH THỨC MỚI** → Rồi duyệt → PO |
| **PO vs PR ban đầu** | PO = PR (không thay đổi) | PO ≠ PR (có thể khác) |
| **Thời gian** | Nhanh (2-3 tuần) | Chậm vì thương thảo (3-4 tuần) |

---

## 📝 Ví Dụ Thực Tế Chi Tiết

### 🔷 FLOW 1 - A4 Paper (STABLE)

**Step 1: Tạo PR ban đầu**
```
PR-001:
- Mua A4 Paper 10 ream
- Giá dự kiến: 520,000 VND
- Need date: 30/04/2026
```

**Step 2: Duyệt PR → Auto tạo RFQ**
```
RFQ-AUTO-001:
- "Báo giá cho 10 ream A4 Paper cao cấp"
- Spec: Bề mặt mịn, màu trắng tinh, ISO 100
- Qty: Chính xác 10 ream (không đàm phán)
- Deadline báo giá: 15/04/2026
```

**Step 3: Nhà CC báo giá**
```
Nhà CC báo:
"10 ream A4 Paper = 520,000 VND (hợp lệ)"
hoặc
"10 ream A4 Paper = 515,000 VND (chút giảm giá)"
```

**Lưu ý:** Nhà CC KHÔNG CÓ LỰA CHỌN đề xuất:
- ❌ "Bạn muốn 5 ream thay vì 10 không?"
- ❌ "Hoặc tôi có giấy khác loại giá rẻ hơn?"
- Scope CFIXEDỐ ĐỊNH, phải báo giá đúng RFQ

**Step 4: Award → Tạo PO**
```
PO-001:
- Q: 10 ream (đúng như RFQ)
- Giá: 520,000 VND (đúng như báo giá)
- = PR ban đầu 100%
```

---

### 🔶 FLOW 2 - Software Licenses (VOLATILE)

**Step 1: Tạo PR ban đầu (Quick Quote)**
```
PR-002 (là QUICK QUOTE, chưa chính thức):
- Items: Windows Server 3 license + Azure 12 tháng
- Giá dự kiến: 47,000,000 VND
- Need date: 45 ngày
- Status: DRAFT (chỉ để ước tính)
```

**Step 2: Duyệt PR → Auto tạo QuotationRequest**
```
QuotationRequest-001:
- "Báo giá cho danh mục Phần mềm IT"
- Description: "Cần phần mềm cho cơ sở hạ tầng"
- Ngân sách dự kiến: 47,000,000 VND
- Status: PENDING (chờ xử lý)

❗ Lưu ý: KHÔNG cố định loại sản phẩm, số lượng
   Nhà CC được tự do đề xuất
```

**Step 3: Procurement gửi yêu cầu báo giá**
```
"Vui lòng báo giá gói phần mềm cho IT:
 - Windows Server (tối thiểu)
 - Cloud service (như Azure)
 - Ngân sách: ~47 triệu
 - Deadline: 20/04/2026"
```

**Step 4: Nhà CC báo giá - CÓ LINH HOẠT**
```
❌ Nhà CC không báo giá "đúng giống PR ban đầu"

✅ Thay vì đó, nhà CC tư vấn:
"Anh muốn cách tối ưu hơn không?
 
 Option 1 (Đúng Request): 3×Windows Server + 12m Azure = 47,000,000
 
 Option 2 (BUNDLE SALE): 5×Windows Server + 12m Azure + 6m support
            = 35,000,000 (tiết kiệm 12 triệu!)
 
 Option 3 (Hybrid): 2×Windows Server + 24m Azure Enterprise
            = 38,000,000"
```

**Step 5: Procurement QUYẾT ĐỊNH & TẠO PR CHÍNH THỨC MỚI**
```
Procurement officer xem 3 options:
"Option 2 tốt nhất! Tôi sẽ tạo PR CHÍNH THỨC như sau:"

PR-003 (CHÍNH THỨC - tạo từ báo giá):
- Items: Windows Server 5 license (THAY ĐỔI từ 3)
         Azure 12 tháng (giữ nguyên)
         Support 6 tháng (THÊM MỚI)
- Giá: 35,000,000 VND (THAY ĐỔI từ 47 triệu)
- Status: DRAFT
- Ghi chú: "Theo báo giá Option 2 từ nhà CC, ngày 12/04/2026"
```

**Step 6: Duyệt PR CHÍNH THỨC MỚI**
```
PR-003 được duyệt:
- Status: APPROVED
- Total: 35,000,000 VND
- Approver: Finance
```

**Step 7: Tạo PO**
```
PO-002:
- Items: 5×Windows Server + 12m Azure + 6m Support
- Giá: 35,000,000 VND
- Total: 35,000,000 VND
- ≠ PR ban đầu PR-002 (khác cả số lượng, giá)
```

---

## 🔄 Tại Sao Cần Tạo PR Chính Thức Mới?

### Vấn đề Nếu Không Tạo PR Mới:

```
PR-002 (ban đầu):
- 3×Windows Server
- Giá: 47 triệu
- Duyệt xong → Tạo PO → Hoặc wait?

❓ Nếu dùng trực tiếp thì:
- Thiếu Azure (không có trong Order)
- Giá sai (47 triệu thay vì 35 triệu)
- Thiếu Support
- Budget bị "overhang" (đã duyệt 47 triệu nhưng chỉ dùng 35)
```

### Giải Pháp: Tạo PR Chính Thức Mới

```
1. Procurement officer kiểm tra báo giá
2. Cập nhật PR với thông tin thực tế từ nhà CC:
   - Items: Thêm vào những mục báo giá đề xuất
   - Qty: Cập nhật nếu khác
   - Price: Cập nhật giá thực tế
3. Tạo PR mới = "Final PR" dựa trên báo giá
4. PR mới này được duyệt & tạo PO chính xác

✅ Lợi ích:
- Budget tracking chính xác
- PO match với PR thực tế
- Audit trail rõ ràng
- Procurement có lịch sử thương thảo
```

---

## 🎨 Sơ Đồ Luồng So Sánh

```
┌─────────────────────────────────────┐
│      FLOW 1: STABLE PRICES          │
├─────────────────────────────────────┤
│ PR (Fixed) → RFQ → Quote (Fixed)    │
│            → Award → PO = PR        │
└─────────────────────────────────────┘
       Scope: CỐ ĐỊNH
      Thời gian: 2-3 tuần
     Thương lượng: KHÔNG

┌─────────────────────────────────────┐
│     FLOW 2: VOLATILE PRICES         │
├─────────────────────────────────────┤
│ PR (Quick) → QuoteReq → Options(N)  │
│          → Procurement Decide       │
│          → PR CHÍNH THỨC MỚI        │
│          → Award → PO ≠ PR(Quick)   │
└─────────────────────────────────────┘
       Scope: LINH HOẠT
      Thời gian: 3-4 tuần
     Thương lượng: CÓ (thương thảo)
```

---

## 📋 Khi Nào Dùng Flow Nào?

### Flow 1 (STABLE - Tạo RFQ)
✅ Sản phẩm giá ổn định: Giấy A4, bút, máy in, thanh toán công ty
✅ Spec rõ ràng: Loại, chất lượng, số lượng cố định
✅ Không cần thương lượng
✅ Muốn nhanh

**Ví dụ:**
```
"Mua 100 bộ đồng phục (kích cỡ XL) - Spec cố định"
"Mua 50 máy tính Dell (model P500) - Cấu hình cố định"
"Mua 1000 cuốn sách in (nội dung, format cố định)"
```

### Flow 2 (VOLATILE - Tạo QuotationRequest)
✅ Sản phẩm giá thay đổi: Phần mềm, cloud service, hàng công nghệ cao
✅ Spec không chắc chắn: Có thể có cách giải pháp khác tốt hơn
✅ Cần thương lượng/tư vấn từ nhà CC
✅ Có thể tiết kiệm nếu chọn option khác

**Ví dụ:**
```
"Cần giải pháp phần mềm quản lý" (chưa biết chính xác cần Microsoft/SAP/Oracle)
"Nhu cầu cloud service" (Azure/AWS/Google - có thể khác giá)
"Phần cứng máy tính công nghệ mới" (config có thể cân bằng giá/hiệu năng)
```

---

## 🎯 Tóm Lại: Câu Trả Lời Cuối Cùng

**Q: "Vì sao đều báo giá như nhau mà Flow 2 là tạo PR chính thức?"**

A:
1. **Flow 1 & Flow 2 KHÔNG báo giá giống nhau!**
   - Flow 1: RFQ = yêu cầu báo giá cỡ định (fixed scope)
   - Flow 2: QuoteReq = yêu cầu tư vấn/báo giá linh hoạt (flexible scope)

2. **Flow 2 nhà CC CÓ THỂ đề xuất sản phẩm/số lượng/giá KHÁC!**
   - Nhà CC báo: "Thay vì 3 license, mua 5 license + support (bundle) giá rẻ hơn"

3. **Vì vậy Procurement MỠI TẠO PR CHÍNH THỨC MỚI**
   - Để đảm bảo PO phát hành dựa trên báo giá thực tế
   - Để tracking budget chính xác
   - Để có audit trail log thương lượng

4. **Kết quả:**
   - Flow 1: PO = PR ban đầu
   - Flow 2: PO ≠ PR ban đầu (sửa dựa trên báo giá)

---

## 💡 Phân Biệt Rõ 3 Tài Liệu

| Tài Liệu | Tác Dụng | Scope | Ai Tạo |
|----------|----------|-------|--------|
| **PR (Quick)** | Estimate nhanh | Flexible | Requester |
| **RFQ** (Flow 1) | Yêu cầu báo giá fixed | CỐ ĐỊNH | System auto |
| **QuoteReq** (Flow 2) | Yêu cầu tư vấn/báo giá | LINH HOẠT | System auto |
| **PR (Chính thức)** | Order chính thức | Fixed | Procurement (based on quote) |
| **PO** | Hợp đồng mua | Fixed | System (from PR) |

---

**Bây giờ bạn hiểu rõ chưa? 😊**
