# 🎨 Biểu Đồ So Sánh Flow 1 vs Flow 2

## 🔷 FLOW 1: STABLE PRICES - Báo Giá Cố Định

```
REQUESTER tạo PR
         │
         ↓ 
    ┌─────────────────────────────────────────────────┐
    │ PR-001: Mua A4 Paper 10 ream                     │
    │ Giá dự kiến: 520,000 VND                        │
    │ Status: DRAFT                                    │
    └─────────────────────────────────────────────────┘
         │
         ↓ (Submit & Assign Approver)
    ┌─────────────────────────────────────────────────┐
    │ PR-001: Status → PENDING_APPROVAL                │
    └─────────────────────────────────────────────────┘
         │
         ↓ (APPROVER DUYỆT)
    ┌─────────────────────────────────────────────────┐
    │ PR-001: Status → APPROVED                        │
    │ 🤖 AUTOMATION: Check items → All STABLE ✓       │
    │ 🤖 Auto tạo RFQ                                 │
    └─────────────────────────────────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────────────┐
    │ RFQ-AUTO-001 (Tự động tạo)                      │
    │ "Báo giá cho 10 ream A4 Paper"                   │
    │ Qty: ✅ CỐ ĐỊNH 10 ream                          │
    │ Spec: ✅ CỐ ĐỊNH (màu trắng, ISO 100, ...)      │
    │ Status: SENT                                     │
    └─────────────────────────────────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────────────┐
    │ 🏢 NHÂN VIÊN TUYỂN MUA xem RFQ                   │
    │ Mời nhà cung cấp A, B, C báo giá                 │
    └─────────────────────────────────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────────────┐
    │ 📬 NHÀ CUNG CẤP BÁO GIÁ                          │
    │ A: "10 ream A4 = 520,000 VND" ✅ Đúng spec     │
    │ B: "10 ream A4 = 515,000 VND" ✅ Đúng spec     │
    │ C: "10 ream A4 = 530,000 VND" ✅ Đúng spec     │
    │                                                 │
    │ ❌ Không ai dám đề xuất:                        │
    │ ❌ "Bạn muốn 5 ream thay vì 10?"               │
    │ ❌ "Hay mua loại khác rẻ hơn?"                 │
    │ ❌ scope CỐ ĐỊNH - phải báo giá đúng RFQ      │
    └─────────────────────────────────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────────────┐
    │ 🎖️  AWARD thắng: Nhà CC B (515,000 VND)         │
    └─────────────────────────────────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────────────┐
    │ 💼 PO-001 (Tự động từ RFQ)                      │
    │ Nguyên vật liệu: 10 ream A4 Paper               │
    │ Giá: 515,000 VND                                │
    │ = PR-001 100% (KHÔNG THAY ĐỔI)                 │
    └─────────────────────────────────────────────────┘
         │
         ↓
    ✅ GRN & INVOICE
```

**KẾT QUẢ:** PO = PR ban đầu (Không thay đổi)
**SCOPE:** CỐ ĐỊNH từ đầu

---

## 🔶 FLOW 2: VOLATILE PRICES - Báo Giá Linh Hoạt & Tạo PR Chính Thức Mới

```
REQUESTER tạo PR (QUICK ESTIMATE)
         │
         ↓ 
    ┌─────────────────────────────────────────────────┐
    │ PR-002 (Quick Quote - chỉ để ước tính):         │
    │ Items:                                          │
    │   - Windows Server 3 license                    │
    │   - Azure 12 tháng                              │
    │ Giá dự kiến: 47,000,000 VND                    │
    │ Status: DRAFT                                   │
    │                                                 │
    │ ⚠️ LƯU Ý: Chỉ là DỰ KIẾN, có thể thay đổi   │
    └─────────────────────────────────────────────────┘
         │
         ↓ (Submit & Assign Approver)
    ┌─────────────────────────────────────────────────┐
    │ PR-002: Status → PENDING_APPROVAL                │
    └─────────────────────────────────────────────────┘
         │
         ↓ (APPROVER DUYỆT)
    ┌─────────────────────────────────────────────────┐
    │ PR-002: Status → APPROVED                        │
    │ 🤖 AUTOMATION: Check items → Có VOLATILE ✓     │
    │ 🤖 Auto tạo QuotationRequest (KHÔNG phải RFQ) │
    └─────────────────────────────────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────────────┐
    │ QuotationRequest-001 (Tự động, Flow 2)          │
    │ "Báo giá cho danh mục Phần mềm IT"              │
    │                                                 │
    │ Qty: ❓ LINH HOẠT (chưa định)                   │
    │ Items: ❓ LINH HOẠT (có thể đề xuất khác)       │
    │ Spec: ❓ LINH HOẠT (có thể tư vấn)              │
    │                                                 │
    │ Ngân sách dự kiến: 47,000,000 VND              │
    │ Status: PENDING                                 │
    │ Ghi chú: "Mặt hàng giá thay đổi - mong đề xuất│
    │          giải pháp tối ưu"                    │
    └─────────────────────────────────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────────────┐
    │ 🏢 NHÂN VIÊN TUYỂN MUA xem QuoteReq             │
    │ Gửi yêu cầu đến nhà cung cấp:                  │
    │ "Báo giá gói phần mềm. Ngân sách ~47 triệu"    │
    │ ⚠️ KHÔNG CỐ ĐỊNH số lượng, loại                 │
    └─────────────────────────────────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────────────┐
    │ 📬 NHÀ CUNG CẤP BÁO GIÁ - CÓ LINH HOẠT         │
    │                                                 │
    │ Option 1 (Đúng dự kiến):                       │
    │   Windows Server 3 license + Azure 12 tháng    │
    │   = 47,000,000 VND                             │
    │                                                 │
    │ Option 2 (BUNDLE SALE - TỐTƠN HƠN):          │
    │   Windows Server 5 license (THÊM 2)            │
    │   Azure 12 tháng (giữ)                         │
    │   Support 6 tháng (THÊU MỚI)                  │
    │   = 35,000,000 VND (TIẾT KIỆM 12 TRIỆU!)     │
    │                                                 │
    │ Option 3 (Hybrid):                             │
    │   Windows Server 2 license (GIẢM 1)            │
    │   Azure 24 tháng (GẤP ĐÔI)                    │
    │   = 38,000,000 VND                             │
    │                                                 │
    │ ✅ NHÀ CC CÓ TỰ DO ĐỀ XUẤT!                   │
    │ ✅ scope LINH HOẠT - thương lượng              │
    └─────────────────────────────────────────────────┘
         │
         ↓
    ┌─────────────────────────────────────────────────┐
    │ 👤 PROCUREMENT OFFICER QUYẾT ĐỊNH               │
    │                                                 │
    │ "Option 2 tốt nhất!                            │
    │  Tiết kiệm 12 triệu, tăng license, có support"│
    │                                                 │
    │ 🎯 QUYẾT CÓ: Tạo PR CHÍNH THỨC MỚI dựa trên   │
    │           Option 2 (= báo giá nhà CC)         │
    └─────────────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────────────┐
    │ ✅ PR-003 (CHÍNH THỨC MỚI - Tạo từ báo giá)     │
    │                                                 │
    │ Items (CẬP NHẬT từ PR ban đầu):               │
    │   - Windows Server: 3 → 5 license (THAY)      │
    │   - Azure: 12 tháng (GIỮ)                      │
    │   - Support: THÊM 6 tháng (MỚI)                │
    │                                                 │
    │ Giá (CẬP NHẬT):                                │
    │   47,000,000 VND → 35,000,000 VND (THAY)     │
    │                                                 │
    │ Status: DRAFT                                   │
    │ Ghi chú: "Để nhân viên kế toán theo dõi"      │
    │ Metadata: "Từ QuotationRequest, Option 2,     │
    │           Nhà CC [tên], ngày 12/04/2026"      │
    │                                                 │
    │ ⚠️ KHÁC PR BAN ĐẦU:                            │
    │   PR-002 ≠ PR-003                              │
    │   Qty khác, Items khác, Giá khác               │
    └──────────────────────────────────────────────────┘
         │
         ↓ (Submit & Assign Approver)
    ┌──────────────────────────────────────────────────┐
    │ PR-003: Status → PENDING_APPROVAL                │
    └──────────────────────────────────────────────────┘
         │
         ↓ (APPROVER DUYỆT)
    ┌──────────────────────────────────────────────────┐
    │ PR-003: Status → APPROVED (Duyệt PR chính thức) │
    │                                                 │
    │ 🤖 AUTOMATION: Gọi auto tạo RFQ hoặc PO        │
    │ (hay manually tạo PO từ PR)                      │
    └──────────────────────────────────────────────────┘
         │
         ↓
    ┌──────────────────────────────────────────────────┐
    │ 💼 PO-002 (Tạo từ PR-003 chính thức)            │
    │                                                 │
    │ Items:                                         │
    │   - Windows Server: 5 license                   │
    │   - Azure: 12 tháng                             │
    │   - Support: 6 tháng                            │
    │ Giá: 35,000,000 VND                            │
    │                                                 │
    │ ≠ PR-002 ban đầu (KHÁC)                        │
    │ = PR-003 chính thức (GIỐNG)                    │
    │                                                 │
    │ Thương nhân: Nhà CC [tên]                       │
    │ Ngày ship: ...                                  │
    └──────────────────────────────────────────────────┘
         │
         ↓
    ✅ GRN & INVOICE (với PO mới)
```

**KẾT QUẢ:** PO ≠ PR ban đầu (Cập nhật từ báo giá)
**SCOPE:** LINH HOẠT - thương lượng & tư vấn

---

## 📊 So Sánh Toàn Diện

```
┌──────────────────────────────────────────────────────────────┐
│                    FLOW 1 (STABLE)                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  PR Input         RFQ Output      Quote         PO           │
│  ┌────────┐      ┌─────────┐    ┌────────┐   ┌────────┐    │
│  │10 ream │      │10 ream │    │10 ream│   │10 ream│    │
│  │520,000 │─────→│520,000 │───→│520,000├──→│520,000│    │
│  │        │      │        │    │       │   │       │    │
│  │FIXED   │      │ FIXED  │    │ FIXED│   │ FIXED │    │
│  └────────┘      └─────────┘    └────────┘   └────────┘    │
│                                                              │
│  Outcome: INPUT = OUTPUT (Không thay đổi)                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────┐
│                   FLOW 2 (VOLATILE)                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ PR Input         QuoteReq       Options      NEW PR    PO   │
│ ┌──────────┐   ┌─────────┐   ┌──────────┐  ┌──────┐ ┌──┐   │
│ │3 License │   │FLEXIBLE │   │Opt 1: 3L │  │5 L   │ │5L │   │
│ │47 Million├──→│FLEXIBLE ├──→├Opt 2: 5L├─→│35 Mi ├→│35M│   │
│ │          │   │         │   │Opt 3: 2L│  │+Supp│ │   │   │
│ │ESTIMATE  │   │FLEXIBLE │   │         │  │FINAL│ │FINAL  │
│ └──────────┘   └─────────┘   └──────────┘  └──────┘ └──┘   │
│                                                              │
│  Outcome: INPUT ≠ OUTPUT (Thay đổi dựa trên báo giá)      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Bảng So Sánh Từng Bước

| Bước | Flow 1 (STABLE) | Flow 2 (VOLATILE) |
|------|-----------------|-------------------|
| 1. Input | PR: 10 ream, 520k | PR: 3 license, 47M |
| 2. Auto Creation | ✅ RFQ tạo (FIXED scope) | ✅ QuoteReq tạo (FLEXIBLE scope) |
| 3. Supplier Quote | "10 ream = 510-530k" | "Opt1: 3L=47M, Opt2: 5L=35M, Opt3: 2L=38M" |
| 4. Negotiation | ❌ Không (scope cố định) | ✅ Có (scope linh hoạt) |
| 5. Procurement Action | Award → PO | **Tạo PR chính thức mới** → PO |
| 6. PR Chính Thức | PR = Input | PR = PR chính thức mới (từ báo giá) |
| 7. PO Output | 10 ream, ~520k | 5 license, 35M |
| 8. PO vs Input | PO = PR | PO ≠ PR (thay đổi) |

---

## 🔑 Điểm Khác Nhau Cốt Lõi

```
FLOW 1: RFQ = Yêu cầu báo giá CỐ ĐỊNH
         → Output = Input (Không thay đổi)
         → PO = PR

FLOW 2: QuoteReq = Yêu cầu tư vấn LINH HOẠT
         → Procurement tạo PR CHÍNH THỨC MỚI
         → Output ≠ Input (Có thể thay đổi)
         → PO ≠ PR (ban đầu)
```

---

## 💡 Đọc Hình Ảnh

**Nếu nhìn từ trên xuống:**

```
Flow 1: PR (Scope fixed) → RFQ (Scope fixed) → PO (Scope fixed)
        ↓
        Tất cả scope CỐ ĐỊNH, không thay đổi


Flow 2: PR Quick (Estimate) → QuoteReq (Flexible) → Procurement Decision
        ↓
        Tạo PR CHÍNH THỨC MỚI (cập nhật scope)
        ↓
        PO (Scope fixed từ PR mới)
        
        Scope thay đổi ở giữa (quá trình negotiation)
```

---

**Bây giờ rõ ràng chưa? 😊 Flow 2 tạo PR mới vì báo giá có thể khác dự kiến!**
