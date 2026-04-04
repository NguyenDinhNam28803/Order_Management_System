# 🏗️ Quy Trình Lọc: Nên Lọc Ở Đâu?

## ❓ Câu Hỏi
"Nếu automation đã có quy trình lọc rõ ràng rồi, thì lúc tạo PR có cần lọc nữa không?"

---

## 📊 So Sánh: Lọc Ở CREATE vs AUTOMATION

### Option 1: Lọc CHỈ Ở Automation (Hiện Tại)

```
CREATE PR (DRAFT)
  ├─ Không check priceVolatility
  ├─ User tạo PR xong
  └─ Status: DRAFT
     │
     ↓ (Sau 1-2 tuần)
APPROVE PR
  ├─ Status: APPROVED
  ├─ 🤖 Automation được kích hoạt
  ├─ Check priceVolatility
  ├─ Tạo RFQ hoặc QuoteReq
  └─ Next step tự động xảy ra
```

**Ưu điểm:**
✅ Code đơn giản, không cần validate ở create
✅ Automation handle tất cả logic
✅ Không cần update PR metadata

**Nhược điểm:**
❌ User không biết PR mình tạo sẽ match Flow nào
❌ Không cảnh báo nếu mix STABLE + VOLATILE (có thể lỗi logic)
❌ Không có "early warning" - phát hiện vấn đề quá muộn

---

### Option 2: Lọc CẢ CREATE + AUTOMATION (Khuyến Cáo)

```
CREATE PR (DRAFT)
  ├─ ✅ Validate priceVolatility của items
  ├─ ✅ Warn nếu mix STABLE + VOLATILE
  ├─ ✅ Gợi ý Flow cho user
  ├─ ✅ Lưu vào PR.metadata: hasVolatileItems: true
  └─ Status: DRAFT + Metadata
     │
     ↓ (Sau 1-2 tuần)
APPROVE PR
  ├─ Status: APPROVED
  ├─ 🤖 Automation được kích hoạt
  ├─ Check priceVolatility (double-check)
  ├─ Tạo RFQ hoặc QuoteReq
  └─ Next step tự động xảy ra
```

**Ưu điểm:**
✅ User biết trước PR sẽ match Flow nào
✅ Cảnh báo ngay nếu mix STABLE + VOLATILE
✅ Early warning - phát hiện vấn đề sớm
✅ Có metadata để tracking & audit
✅ Automation có thể verify (double-check)

**Nhược điểm:**
❌ Code phức tạp hơn (thêm validation)
❌ Phải load Product data từ DB (thêm query)
❌ Lặp lại logic ở 2 chỗ

---

## 🔍 Phân Tích Chi Tiết

### Khi Nào Cần Lọc Ở Create?

| Tình Huống | Cần? | Lý Do |
|-----------|------|-------|
| Mix STABLE + VOLATILE items | ✅ Yes | Cảnh báo user sớm |
| User muốn xem trước sẽ là Flow nào | ✅ Yes | Transparency - user biết trước |
| Cần metadata cho audit trail | ✅ Yes | Tracking - biết ai tạo PR loại gì |
| Validation: Flow nào phù hợp | ✅ Yes | Quality - catch error sớm |
| Cho user decide có để nguyên hay đổi items | ✅ Yes | User experience - có lựa chọn |

### Khi Nào KHÔNG Cần?

| Tình Huống | Không Cần? | Lý Do |
|-----------|----------|------------|
| Automation đã reliable | ❌ No | Automation là single source of truth |
| Code đơn giản hơn | Ⓜ️ Maybe | Nhưng UX sẽ kém |
| Query DB ít hơn | Ⓜ️ Maybe | Nhưng early validation quan trọng hơn |

---

## 💼 Use Case: Scenario Thực Tế

### Scenario 1: User Tạo PR Mix STABLE + VOLATILE (Nhầm)

```
Timeline:

T=0 (Hôm nay):
  User tạo PR:
  - Item 1: A4 Paper (STABLE) - 100k
  - Item 2: Windows Server (VOLATILE) - 5M
  - Status: DRAFT (tạo xong)

  ❌ Với Option 1 (không lọc ở create):
     User không biết là mix → gửi duyệt
  
  ✅ Với Option 2 (lọc ở create):
     ⚠️ Warning: "PR này có MIX items!"
     "Gợi ý: Flow 2 (vì có VOLATILE)"
     "Bạn có muốn update không?"
     → User có cơ hội fix ngay

T=7 ngày:
  Approver duyệt PR

T=8 ngày:
  ❌ Automation phát hiện lửi mix → Quyết định Flow 2
     "Tạo QuotationRequest thay RFQ"
     Procurement officer ngơ ngác: "Sao A4 Paper lại vào Quote?"
     
  ✅ Nếu User đã cảnh báo trước
     Approver & Procurement biết trước → đã fix

✅ Kết luận: Option 2 tránh được 7 ngày delays!
```

---

## 🏛️ Architecture Decision

### Current (Option 1 - Automation Only)

```typescript
// prmodule.service.ts - create()
async create(createPrDto, user) {
  // Không check priceVolatility
  // Không validate Flow
  // Tạo PR xong, return
  return this.repository.create(...)
}

// automation.service.ts - handleDocumentApproved()
private async routePrApprovalFlow(prId) {
  // 🤖 Lúc này mới check
  const pr = await this.prisma.purchaseRequisition.findUnique(...)
  const hasVolatileItems = pr.items.some(
    item => item.product?.priceVolatility === 'VOLATILE'
  )
  // Quyết định & tạo RFQ hoặc QuoteReq
  if (hasVolatileItems) {
    await this.autoCreateQuotationRequestFromPr(prId)
  } else {
    await this.autoCreateRfqFromPr(prId)
  }
}
```

### Improved (Option 2 - Create + Automation)

```typescript
// prmodule.service.ts - create()
async create(createPrDto, user) {
  // NEW: Analyze items
  const itemsAnalysis = await this.analyzeItemsFlow(createPrDto.items)
  
  // NEW: Validate & warn
  if (itemsAnalysis.hasVolatileItems && itemsAnalysis.hasStableItems) {
    // Log warning nhưng vẫn cho tạo
    console.warn('⚠️ Mix items detected!')
  }
  
  // NEW: Create PR với metadata
  const pr = await this.repository.create(createPrDto, {
    metadata: {
      hasVolatileItems: itemsAnalysis.hasVolatileItems,
      hasStableItems: itemsAnalysis.hasStableItems,
      matchedFlow: itemsAnalysis.hasVolatileItems ? 'FLOW_2' : 'FLOW_1',
      analyzedAt: new Date(),
      autoFlowMessage: itemsAnalysis.message
    }
  })
  
  return pr
}

private async analyzeItemsFlow(items: CreatePrItemDto[]) {
  const hasVolatileItems = await items.some(async (item) => {
    const product = await this.prisma.product.findUnique({ id: item.productId })
    return product?.priceVolatility === 'VOLATILE' || product?.priceVolatility === 'MODERATE'
  })
  
  const hasStableItems = await items.some(async (item) => {
    const product = await this.prisma.product.findUnique({ id: item.productId })
    return product?.priceVolatility === 'STABLE'
  })
  
  // Return analysis
  return {
    hasVolatileItems,
    hasStableItems,
    matchedFlow: hasVolatileItems ? 'FLOW_2' : 'FLOW_1',
    message: hasVolatileItems 
      ? '📍 PR này sẽ match FLOW 2 (QuotationRequest) sau khi duyệt'
      : '📍 PR này sẽ match FLOW 1 (RFQ) sau khi duyệt',
    warning: hasVolatileItems && hasStableItems
      ? '⚠️ Mix STABLE + VOLATILE items - Flow 2 sẽ được chọn'
      : null
  }
}

// automation.service.ts - handleDocumentApproved() - Giữ nguyên
private async routePrApprovalFlow(prId) {
  // 🤖 Double-check (verify PR.metadata)
  const pr = await this.prisma.purchaseRequisition.findUnique(...)
  
  // Thực hiện như cũ
  const hasVolatileItems = pr.items.some(...)
  
  // Có thể verify với PR.metadata.matchedFlow
  if (pr.metadata?.matchedFlow && pr.metadata?.matchedFlow !== 
      (hasVolatileItems ? 'FLOW_2' : 'FLOW_1')) {
    this.logger.warn('Flow mismatch detected! Recalculating...')
  }
  
  // Thực hiện routing
  if (hasVolatileItems) {
    await this.autoCreateQuotationRequestFromPr(prId)
  } else {
    await this.autoCreateRfqFromPr(prId)
  }
}
```

---

## 📋 Khuyến Cáo: Nên Làm Gì?

### Đối Với Production Ngay Bây Giờ: **Option 1** (Automation Only)
```
Lý do:
✅ Automation đã hoạt động tốt
✅ Code không cần thay đổi
✅ Risk thấp (không thêm logic mới)
✅ User có thể adapt dần
```

### Đối Với Fase 2 (Nâng Cấp UX): **Option 2** (Create + Automation)
```
Lý do:
✅ Better user experience
✅ Early warning system
✅ Audit trail & metadata
✅ Catch errors sớm

Cách implement:
1. Thêm method analyzeItemsFlow() vào prmodule.service
2. Gọi khi create PR
3. Thêm vào PR.metadata
4. Return suggestion cho user (response)
5. Automation vẫn giữ nguyên (double-check)
```

---

## 🎯 Quyết Định Cuối Cùng

### Nếu Bạn Muốn **NHANH & ĐỀN**:
```
→ Giữ nguyên Option 1 (Automation Only)
→ Không cần thêm logic ở create
→ Automation handle tất cả
```

### Nếu Bạn Muốn **UX TỐT HƠN**:
```
→ Implement Option 2 (Create + Auto)
→ Thêm validation & gợi ý ở create
→ User sẽ biết trước sẽ là Flow nào
→ Automation double-check
```

### My Recommendation:
```
🏆 OPTION 2 (Create + Automation)

Lý do:
1. Cost of implementation: Thấp (chỉ 1-2 ngày coding)
2. Benefit: Cao (UX tốt, early warning, audit trail)
3. Risk: Rất thấp (automation vẫn là source of truth)
4. Scalability: Tốt (khi có thêm flow khác)

Especially vì:
- Sẽ có users tạo PR nhầm mix items
- Early warning sẽ tiết kiệm 7+ ngày delays
- Metadata sẽ hữu ích cho tracking & reporting
```

---

## 📝 Ví Dụ Response Cho User

### With Option 2 (Create + Return Suggestion)

**POST /pr (Create)**
```json
Request:
{
  "title": "Office Supplies & Software",
  "items": [
    { "productId": "office-001", "qty": 10 },  // A4 Paper (STABLE)
    { "productId": "software-001", "qty": 1 }   // Windows Server (VOLATILE)
  ]
}

Response:
{
  "id": "pr-123",
  "prNumber": "PR-2026-5001",
  "status": "DRAFT",
  
  // NEW: Metadata & Suggestion
  "metadata": {
    "matchedFlow": "FLOW_2",
    "hasVolatileItems": true,
    "hasStableItems": true,
    "warning": "⚠️ Mix STABLE + VOLATILE items detected",
    "autoFlowMessage": "📍 PR này sẽ match FLOW 2 (QuotationRequest) sau khi duyệt APPROVED",
    "suggestion": "Nếu bạn muốn tạo RFQ (FLOW 1), vui lòng tách items ra 2 PR riêng"
  },
  
  "items": [...]
}
```

**User thấy warning → Có cơ hội decide:**
- ✅ "OK, lưu ý rồi, tôi biết sẽ là FLOW 2"
- ❌ "À, tôi muốn chỉ mua A4 thôi" → Xóa Windows Server → Tạo PR mới

---

## 🔚 Summary

| Aspects | Option 1 (Automation Only) | Option 2 (Create + Auto) |
|---------|--------------------------|------------------------|
| **Simplicity** | ✅ Simple | ⭐ Slightly complex |
| **User Experience** | ❌ Blind | ✅ Informed |
| **Early Warning** | ❌ No | ✅ Yes |
| **Error Catch** | ⏰ Late (after approve) | ✅ Early (at create) |
| **Audit Trail** | ❌ No metadata | ✅ Metadata tracked |
| **Implementation Cost** | ✅ None | ⭐ 1-2 days |
| **Production Ready** | ✅ Now | ⭐ Next phase |

**Recommendation: Start with Option 1, migrate to Option 2 in Phase 2**
