# 🏢 Các Ví Dụ Thực Tế: Khi Nào Dùng Flow 1 vs Flow 2

## ✅ FLOW 1 EXAMPLE 1: Mua Văn Phòng Phẩm (Office Supplies)

### Tình Huống
```
Phòng HR muốn mua:
- 50 quyển dây cột tài liệu (binding comb)
- 100 bộ tập giấy (notebook)
- 200 cây bút bi
- Expected: Hạn chót là 30/04/2026
```

### Tại Sao Dùng Flow 1?
```
✅ Giá ổn định: Dây cột, bút bi, tập giấy - giá không thay đổi
✅ Spec rõ ràng: Loại, màu, chất lượng - có thể xác định hết
✅ Không cần thương lượng: Đơn giản, không có giải pháp thay thế
✅ Nhanh có hàng: Nhà CC có sẵn, chỉ cần báo giá
```

### Quy Trình

**Step 1: Tạo PR Đơn Giản**
```
PR-OFFICE-001:
- Dây cột: 50 hộp × 5,000 VND = 250,000
- Tập giấy: 100 quyển × 15,000 VND = 1,500,000
- Bút bi: 200 cây × 2,000 VND = 400,000
Total: 2,150,000 VND
Status: DRAFT
```

**Step 2: Submit → Duyệt → ✅ PR APPROVED**

**Step 3 (Auto):** RFQ tự động tạo
```
RFQ-AUTO-001:
"Báo giá văn phòng phẩm:
- 50 hộp dây cột plastic (chiều dài 10cm)
- 100 quyển tập giấy A4 80gsm
- 200 cây bút bi đỏ (tip 0.7mm)"

Status: SENT
Deadline: +7 ngày
Suppliers invited: VNPP Co., Nguyễn Gia Co., ABC Supplies
```

**Step 4:** Nhà CC báo giá
```
VNPP Co.: "Dây cột 250k + Tập giấy 1.5M + Bút 400k = 2,150,000"
Nguyễn Gia: "Dây cột 245k + Tập giấy 1.45M + Bút 380k = 2,075,000" ⭐
ABC Supplies: "Dây cột 260k + Tập giấy 1.6M + Bút 420k = 2,280,000"

💡 Lưu ý: AI cấu báo giá GIỐNG NHAU vì scope cố định!
  Khác nhau chỉ ở ĐƠN GIÁ, không ở loại hàng
```

**Step 5:** Award → PO
```
PO-001:
- Supplier: Nguyễn Gia Co.
- Items: Đúng như RFQ
  * Dây cột: 50 hộp
  * Tập giấy: 100 quyển
  * Bút bi: 200 cây
- Giá: 2,075,000 VND (= PR ban đầu, không thay đổi)
- Delivery: 30/04/2026
```

**✅ Kết Luận:** PO = PR (không thay đổi giá, số lượng, loại)

---

## ✅ FLOW 1 EXAMPLE 2: Mua Máy Tính Công Ty (Laptop)

### Tình Huống
```
Phòng IT muốn mua:
- 20 chiếc Laptop Dell XPS 13
  Configuration cốc định:
  * Intel i7-13700K
  * RAM 16GB
  * SSD 512GB
  * Windows 11 Pro
  * RAM 16GB
- Budget: 80 triệu
```

### Tại Sao Dùng Flow 1?
```
✅ Spec cố định: Model, CPU, RAM, SSD - all cố định
✅ Giá ổn định: Laptop model cố định - giá không thay đổi
✅ Không thương lượng: Không thể ""có thể mua i5 rẻ hơn không?""
   vì spec yêu cầu thế
✅ Mua hàng công nghiệp: Máy tính phổ thông, không yêu cầu tư vấn
```

### Quy Trình

**Step 1: Tạo PR Chi Tiết**
```
PR-LAPTOP-001:
Item: Dell XPS 13 (i7-13700K 16GB 512GB W11 Pro)
Qty: 20 chiếc
Unit Price: 4,000,000 VND/chiếc
Total: 80,000,000 VND
Spec: Attach thêm PDF spec sheet từ Dell
Status: DRAFT
```

**Step 2-3:** Submit & Duyệt PR

**Step 4 (Auto):** RFQ tự động tạo
```
RFQ-AUTO-002:
"Báo giá Laptop Dell:
- Model: Dell XPS 13 (Chính xác model)
- CPU: Intel i7-13700K
- RAM: 16GB DDR5
- SSD: 512GB NVMe
- OS: Windows 11 Pro (genuine license)
- Qty: 20 chiếc
- Specifications: [Attach full spec]"

Status: SENT
Deadline: +7 ngày
Suppliers: PhuongVi IT, Tech Center, ABCTech
```

**Step 5:** Nhà CC báo giá
```
PhuongVi IT: "20 × Dell XPS 13 (i7 config) = 80,000,000"
Tech Center: "20 × Dell XPS 13 = 79,500,000" ⭐ (chút giảm giá)
ABCTech: "Chúng tôi không có hàng model này"

💡 Lưu ý: ✅ Báo giá DỊ CHÍNH XÁC giống RFQ (vì spec fixed)
         ❌ Tech Center KHÔNG DÙNG ỐN "Bạn muốn i5 rẻ hơn không?"
         ❌ KHÔNG DÙNG định model khác
```

**Step 6:** Award → PO
```
PO-002:
- Supplier: Tech Center
- Item: Dell XPS 13 (i7-13700K, 16GB, 512GB, W11 Pro)
- Qty: 20 chiếc
- Giá: 79,500,000 VND (= PR, không thay đổi)
- Delivery: +10 ngày từ order
```

---

## 🔶 FLOW 2 EXAMPLE 1: Mua Phần Mềm ERP (Enterprise Resource Planning)

### Tình Huống
```
Công ty muốn đưa vào hệ thống quản lý nhân sự/tài chính:
- Cần 1 hệ thống ERP tích hợp HR, Finance, Procurement
- Không chắc chính xác nên mua sản phẩm nào:
  * SAP? (Đắt nhất, đầy đủ nhất)
  * Oracle? (Mid-range)
  * NetSuite? (Cloud-based, ít training)
  * Odoo? (Open source, rẻ nhất)
- Budget estimate: 50 triệu
- Timeline: Flexible (3-6 tháng)
```

### Tại Sao Dùng Flow 2?
```
❌ Giá KHÔNG ổn định: SAP 100M, Oracle 50M, Odoo 5M - khác nhau gấp 10 lần!
❌ Spec KHÔNG rõ ràng: Cần phỏng vấn, analyze requirement trước
❌ Cần thương lượng: Có thể có bundle, implementation support, training
❌ Cần tư vấn: Sales engineer cầnu tư vấn giải pháp phù hợp
```

### Quy Trình

**Step 1: Tạo PR Dự Kiến (Quick Estimate)**
```
PR-ERP-001 (QUICK QUOTE):
Title: "Hệ thống ERP cho quản lý HR & Finance"
Description: "Cần tích hợp HR, Finance, Procurement, có report tool"
Items: [Generic]
  - ERP Software license: 1 hệ thống
  - Estimated: 50,000,000 VND
  - Duration: 3-6 tháng
Status: DRAFT
Note: "Quick estimate - chưa xác định supplier & config"
```

**Step 2-3:** Submit & Duyệt PR

**Step 4 (Auto):** QuotationRequest tạo (KHÔNG phải RFQ)
```
QuotationRequest-001:
Title: "Yêu cầu tư vấn & báo giá Hệ thống ERP"
Description: "Cần giải pháp quản lý HR, Finance, Procurement integrated"
Category: "Software / ERP"
Estimated Budget: 50,000,000 VND
Status: PENDING
Note: "Mặt hàng giá thay đổi. Vui lòng đề xuất các options khác nhau"

❗ LINH HOẠT - không cốc định loại hàng, số lượng, scope
```

**Step 5:** Procurement gửi yêu cầu tư vấn
```
"Công ty chúng tôi cần:
1. Quản lý nhân sự: Lương, hợp đồng, kỷ luật
2. Quản lý tài chính: Kế toán, báo cáo, FP&A
3. Quản lý Procurement: Request, Approval, PO, Invoice
4. Reporting: Custom report builder

Budget khoảng 50 triệu.

Vui lòng đề xuất 2-3 options phù hợp:
- SAP
- Oracle
- NetSuite
- hoặc các giải pháp khác bạn recommend

Include: License cost, Implementation, Training, Support"
```

**Step 6:** Nhà CC (SAP, Oracle, NetSuite, Odoo) báo giá - LINH HOẠT KHÔNG CÙNG SCOPE!

```
📬 SAP Option:
"SAP S/4HANA Cloud:
- License SAP S/4 (1,000 users): 80,000,000
- Implementation (6 tháng): 40,000,000
- Training (2 tháng): 10,000,000
- Support (1 năm): 5,000,000
TOTAL: 135,000,000 VND
Timeline: 8 tháng"

📬 Oracle Option:
"Oracle Cloud HCM + ERP:
- License Oracle (500 users): 45,000,000
- Implementation (4 tháng): 20,000,000
- Training: 5,000,000
- Support (1 năm): 3,000,000
TOTAL: 73,000,000 VND
Timeline: 5 tháng"

📬 NetSuite Option:
"NetSuite OneWorld Edition:
- License (1 năm): 25,000,000
- Implementation (3 tháng): 20,000,000
- Training: 3,000,000
- Support included
TOTAL: 48,000,000 VND
Timeline: 4 tháng
Advantage: Cloud-based, tự động backup, update free"

📬 Odoo Option:
"Odoo Enterprise Edition:
- License (1 năm, deployed on-premise): 10,000,000
- Implementation & Customization: 25,000,000
- Training: 2,000,000
- Support (1 năm): 1,000,000
TOTAL: 38,000,000 VND
Timeline: 3 tháng
Risk: Open source - cần strong IT team"

💡 Lưu ý:
✅ Tất cả 4 options KHÁC NHAU:
   - Giá: 38M-135M (khác 3.5 lần!)
   - Timeline: 3-8 tháng
   - Service: Implementation & Training khác nhau
   - Capabilities: Scope khác nhau

❌ Flow 1 không thể làm việc đây vì scope KHÔNG CỐ ĐỊNH
```

**Step 7:** Procurement Quyết Định & Tạo PR Chính Thức MỚI
```
Procurement Director quyết định:
"NetSuite tốt nhất - Cloud-based, ít overhead IT, timeline nhanh"

📝 PR-ERP-002 (CHÍNH THỨC MỚI - Tạo từ báo giá NetSuite):
Title: "ERP Implementation - NetSuite OneWorld"
Items:
  1. NetSuite License (1 năm): 25,000,000
  2. Implementation Services: 20,000,000
  3. Training Services: 3,000,000
  4. Support Package (1 năm): Included
Total: 48,000,000 VND
Supplier: NetSuite Partner [Công ty A]
Timeline: 4 tháng (Deployment 3 tháng + Training 1 tháng)
Status: DRAFT
Note: "Đã review 4 options. NetSuite phù hợp nhất với timeline & budget"

⚠️ KHÁC PR ban đầu:
PR-ERP-001: 50M + 4 suppliers (vague)
PR-ERP-002: 48M + NetSuite (specific)
```

**Step 8:** Duyệt PR chính thức → Award → PO
```
PO-ERP-001:
Supplier: NetSuite Partner [Công ty A]
Items:
  - NetSuite 1-year license: 25,000,000
  - Implementation (3-4 tháng): 20,000,000
  - Training (1 tháng): 3,000,000
  - Support (1 năm): Included
Total: 48,000,000 VND (PRO từ 50M dự kiến)
Milestone:
  - Month 1: Setup & configuration
  - Month 2-3: Customization & data migration
  - Month 4: Training & go-live
```

**✅ Kết Luận:** PO ≠ PR ban đầu
- PR-001 dự kiến: 50M, 4 options, vague scope
- PO-001 thực tế: 48M, NetSuite, specific scope
- PR-002 chính thức được tạo ra giữa (là cầu nối)

---

## 🔶 FLOW 2 EXAMPLE 2: Mua Thiết Kế Công Ty (Agency Service)

### Tình Huống
```
Marketing team muốn:
- Thiết kế brand identity (logo, color scheme, typography)
- Budget dự kiến: 20 triệu
- Timeline: ASAP (1-2 tuần)
```

### Tại Sao Dùng Flow 2?
```
❌ Giá KHÔNG ổn định: Freelancer 1M, Agency nhỏ 5M, Agency lớn 30M
❌ Scope KHÔNG rõ ràng: Revision limit, deliverable format không biết
❌ Cần thương lượng: Có thể negotiate revision, giá, timeline
❌ Cần tư vấn: Designer sẽ tư vấn what looks good for brand
```

### Quy Trình

**Step 1:** PR dự kiến
```
PR-DESIGN-001 (Quick):
"Thiết kế Brand Identity"
Est. Budget: 20,000,000 VND
Timeline: 1-2 tuần
```

**Step 2-3:** Submit & Duyệt

**Step 4:** QuotationRequest tạo
```
QuotationRequest-001:
"Yêu cầu dich vụ Thiết kế Brand Identity"
```

**Step 5:** Business gửi brief đến agencies
```
"Cần thiết kế brand identity:
- Target market: B2B SaaS company
- Budget: ~20 triệu
- Deliverable: Logo, color palette, typography guide
- Revision: As discussed
- Timeline: Soonest"
```

**Step 6:** Agencies báo giá - LINH HOẠT!
```
📬 Option A (Freelancer):
"Logo design + color palette
Revision: 2 rounds
Delivery: 3 ngày
Price: 3,000,000 VND
Risk: Single person, bộ portfolio hạn chế"

📬 Option B (Agency Nhỏ):
"Logo + Color palette + Typography
Revision: Unlimited
Delivery: 7 ngày
Price: 8,000,000 VND"

📬 Option C (Branding Consultant):
"Full brand identity:
- Logo (3 concepts)
- Color palette
- Typography
- Brand guideline document (50 pages)
- Design system
Revision: Unlimited
Delivery: 14 ngày
Price: 25,000,000 VND"

💡 KHÁC NHAU:
- Giá: 3M - 25M (8 lần!)
- Deliverable: Logo only vs Full guideline
- Timeline: 3 - 14 ngày
```

**Step 7:** Decision - Tạo PR chính thức mới
```
Marketing decide: "Option C - Branding Consultant (25M, full package)"

Hmm, over budget (25M vs 20M estimate)
→ Negotiate: "Can you do 22M for 10-day delivery?"
→ Agency agrees: "Yes, fast track for 22M"

📝 PR-DESIGN-002 (CHÍNH THỨC - từ negotiation):
Items:
  1. Full brand identity design: 20,000,000
  2. Expedited delivery (10 days): 2,000,000
Total: 22,000,000 VND (Từ 20M dự kiến)
Supplier: Branding Consultant Agency
```

**Step 8:** PO
```
PO-DESIGN-001:
- Full brand identity (logo, color, typography, guideline)
- Price: 22,000,000 VND
- Delivery: 10 days
- Agency: Branding Consultant
```

---

## 📊 Tóm Tắt

| Ví Dụ | Tại Sao Flow 1 | Tại Sao Flow 2 | Kết Luận |
|------|---|---|---|
| **Văn Phòng Phẩm** | Giá cố định | - | ✅ FLOW 1 |
| **Laptop** | Spec cố định | - | ✅ FLOW 1 |
| **ERP** | - | Giá 3.5 lần khác; cần tư vấn | ✅ FLOW 2 |
| **Design Agency** | - | Giá & scope linh hoạt | ✅ FLOW 2 |

---

## 🎯 Quy Tắc Quyết Định

| Câu Hỏi | Yes → | No → |
|--------|-------|------|
| Giá có cốc định & ổn định? | FLOW 1 | FLOW 2 |
| Spec/Scope có rõ ràng từ đầu? | FLOW 1 | FLOW 2 |
| Có thể thương lượng loại/qty? | FLOW 2 | FLOW 1 |
| Cần supplier tư vấn giải pháp? | FLOW 2 | FLOW 1 |
| Sản phẩm commodity/standard? | FLOW 1 | FLOW 2 |
| Sản phẩm/Service customizable? | FLOW 2 | FLOW 1 |

**TL;DR:**
- **FLOW 1:** Mua hàng commodity thông dụng - giá ổn định, spec cốc định
- **FLOW 2:** Mua hàng/dịch vụ tầm cao - giá thay đổi, cần thương lượng, có PR chính thức mới

---

**A-HA! Bây giờ bạn hiểu rõ chưa? 😎**
