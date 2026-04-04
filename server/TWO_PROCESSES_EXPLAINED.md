# 📦 Hệ Thống Định Giá Nhà Cung Cấp & Thanh Toán

## 🎯 Tổng Quan 2 Quy Trình Chính

```
QUYTRÌNH 1: PO → GRN → Invoice → 3-Way Matching → Thanh Toán
(Financial Control - Đối soát Tài Chính)

QUYTRÌNH 2: PO Complete → AI Evaluation → KPI Score → Supplier Rating
(Performance Management - Đánh Giá Hiệu Suất)
```

---

## 🔷 QUYTRÌNH 1: Từ PO Đến Thanh Toán (3-Way Matching)

### 📊 Sơ Đồ Quy Trình

```
┌─────────────┐
│     PO      │ ← Tạo Purchase Order từ Quotation/RFQ
│ (DRAFT)     │
└──────┬──────┘
       │
       ↓ (Approve & Confirm từ Supplier)
┌─────────────────────────────────────────┐
│ PO Status: ISSUED / CONFIRMED           │
│ Supplier xác nhận → gửi hàng            │
└──────┬──────────────────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ GRN (Goods Receipt Note)     │
│ từ kho nhận hàng              │
│ - Check qty received          │
│ - Check quality              │
│ Status: CONFIRMED (or review)│
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Supplier gửi Invoice         │
│ (Hóa đơn thanh toán)         │
│ Status: MATCHING             │
└──────┬───────────────────────┘
       │
       ↓ 🤖 AUTO 3-WAY MATCHING
╔═══════════════════════════════════════════╗
║  3 CHIỀU ĐỐI SOÁT                         ║
║  1. PO Data (Qty, Price)                  ║
║  2. GRN Data (Qty Received)               ║
║  3. Invoice Data (Qty Billed, Price)      ║
╚═══════════════════════════════════════════╝
       │
       ├─ Match OK?
       │  ├─ Yes → Status: AUTO_APPROVED
       │  └─ No  → Status: EXCEPTION_REVIEW (Cần duyệt manual)
       │
       ↓
┌──────────────────────────────┐
│ Finance Approval (nếu cần)   │
│ Duyệt thanh toán             │
│ Status: PAYMENT_APPROVED     │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ CREATE PAYMENT               │
│ - Set amount                 │
│ - Set method (Bank, Cash)    │
│ Status: PENDING              │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ COMPLETE PAYMENT             │
│ - Process money transfer     │
│ - Update budget (Committed→  │
│   Spent)                     │
│ Status: COMPLETED            │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Invoice: PAID                │
│ PO: COMPLETED                │
│ ✅ Quy Trình Kết Thúc        │
└──────────────────────────────┘
```

---

### 1️⃣ **Step 1: Tạo PO** 
**File:** `pomodule/pomodule.service.ts`

```typescript
async create(createPoDto, user) {
  // 1. Giữ chỗ ngân sách (Reserve Budget)
  if (costCenterId) {
    await this.budgetService.reserveBudget(
      costCenterId,
      orgId,
      totalAmount,
      user
    )
  }
  
  // 2. Tạo PO với status = DRAFT
  const poNumber = `PO-2026-XXXX`
  return this.repository.create(createPoDto, user.sub, orgId, poNumber)
}
```

**Database:**
```
PurchaseOrder {
  id: UUID
  poNumber: "PO-2026-1234"
  orgId: Organization
  supplierId: Supplier
  totalAmount: 50,000,000
  status: DRAFT → ISSUED → CONFIRMED → SHIPPPED → GRN_CREATED → INVOICED → COMPLETED
  deliveryDate: Date
  items: [{
    sku, description, qty, unitPrice, total
  }]
}
```

---

### 2️⃣ **Step 2: GRN (Goods Receipt)**
**File:** `grnmodule/grnmodule.service.ts`

**Quy trình:**
```
1. Warehouse nhận hàng → Tạo GRN
2. Kiểm tra số lượng: qty received vs PO qty
3. Kiểm tra chất lượng: acceptable qty vs received qty
4. Approve GRN → PO status = GRN_CREATED
```

**Database:**
```
GoodsReceipt {
  id: UUID
  grnNumber: "GRN-2026-5001"
  poId: PO
  status: DRAFT → CONFIRMED → UNDER_REVIEW → DISPUTED
  receivedAt: Timestamp
  items: [{
    receivedQty: 10,
    acceptedQty: 10,  // sau QC
    qcResult: PASSED | FAILED | PENDING
  }]
}
```

---

### 3️⃣ **Step 3: Invoice Tạo & 3-Way Matching**
**File:** `invoice-module/invoice-module.service.ts`

#### 📋 3-Way Matching Logic

```typescript
async runThreeWayMatching(invoiceId: string) {
  // 1. Lấy dữ liệu từ 3 nguồn
  const invoice = await prisma.supplierInvoice.findUnique({
    include: {
      items: { include: { poItem, grnItem } },
      po: { include: { items } },
      grn: { include: { items } }
    }
  })
  
  // 2. Thiết lập Tolerance (Dung sai)
  const QTY_TOLERANCE_PCT = 0.02    // 2% cho qty
  const PRICE_TOLERANCE_PCT = 0.01  // 1% cho đơn giá
  
  // 3. Kiểm tra mỗi item
  for (const invItem of invoice.items) {
    // ✓ Check #1: Số lượng
    // Invoice Qty <= GRN Qty * (1 + Tolerance)
    const invQty = invItem.qty
    const grnQty = invItem.grnItem.receivedQty
    const maxAllowedQty = grnQty * (1 + QTY_TOLERANCE_PCT)
    
    const qtyMatch = invQty <= maxAllowedQty
    
    // ✓ Check #2: Đơn giá
    // Invoice Price <= PO Price * (1 + Tolerance)
    const invPrice = invItem.unitPrice
    const poPrice = invItem.poItem.unitPrice
    const maxAllowedPrice = poPrice * (1 + PRICE_TOLERANCE_PCT)
    
    const priceMatch = invPrice <= maxAllowedPrice
    
    // ✓ Kết luận
    if (!qtyMatch || !priceMatch) {
      matchFailed = true
      exceptionReason += "Dòng X: vượt quá dung sai..."
    }
  }
  
  // 4. Set status dựa trên kết quả
  const finalStatus = matchFailed
    ? InvoiceStatus.EXCEPTION_REVIEW  // Cần duyệt manual
    : InvoiceStatus.AUTO_APPROVED      // Tự động approved
  
  // 5. Lưu vào DB
  await prisma.supplierInvoice.update({
    where: { id: invoiceId },
    data: {
      status: finalStatus,
      exceptionReason,
      matchingResult: results,
      matchedAt: new Date()
    }
  })
}
```

**Ví Dụ Matching:**

| Item | PO Qty | GRN Qty | Invoice Qty | Tolerance | Match? |
|------|--------|---------|-------------|-----------|--------|
| A | 10 | 10 | 10.1 | 10×1.02=10.2 | ✅ Yes (10.1≤10.2) |
| B | 10 | 9 | 10 | 9×1.02=9.18 | ❌ No (10>9.18) |
| C | 10 | 10 | 9.8 | 10×1.02=10.2 | ✅ Yes |

| Item | PO Price | Invoice Price | Tolerance | Match? |
|------|----------|---------------|-----------|--------|
| A | 100k | 100.5k | 100k×1.01=101k | ✅ Yes |
| B | 100k | 102k | 100k×1.01=101k | ❌ No |

**Invoice Status Flow:**
```
MATCHING
  ├─ ✅ All items match → AUTO_APPROVED
  └─ ❌ Any item fails → EXCEPTION_REVIEW
            ↓
         Finance reviews
            ↓
         PAYMENT_APPROVED (or REJECTED)
```

---

### 4️⃣ **Step 4: Thanh Toán & Budget Update**
**File:** `payment-module/payment-module.service.ts`

```typescript
async completePayment(paymentId: string, user: JwtPayload) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { po: true, invoice: true }  // relation
  })
  
  return await prisma.$transaction(async (tx) => {
    // 1. Update payment status
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.COMPLETED,
        processedAt: new Date(),
        approvedById: user.sub,
        approvedAt: new Date()
      }
    })
    
    // 2. Update invoice status
    await tx.supplierInvoice.update({
      where: { id: payment.invoiceId },
      data: { status: InvoiceStatus.PAID, paidAt: new Date() }
    })
    
    // 3. **BUDGET UPDATE**: Committed → Spent
    const budget = await tx.budgetAllocation.findFirst({
      where: {
        orgId: payment.po.orgId,
        costCenterId: payment.po.costCenterId,
        deptId: payment.po.deptId
      }
    })
    
    if (budget) {
      // Shift từ Committed sang Spent
      await tx.budgetAllocation.update({
        where: { id: budget.id },
        data: {
          committedAmount: { decrement: payment.amount },
          spentAmount: { increment: payment.amount }
        }
      })
    }
    
    // 4. Update PO status
    await tx.purchaseOrder.update({
      where: { id: payment.poId },
      data: { status: PoStatus.COMPLETED }
    })
    
    return payment
  })
}
```

**Budget Lifecycle:**
```
             Allocated
             Amount
             ────────
    ├─ Available = Allocated - Committed - Spent
    
1. PO Created: Committed += 50M (Reserve)
   Allocated: 100M
   Committed: 50M
   Spent: 0M
   Available: 50M
   
2. Invoice Match & Approved: (Committed không đổi, chờ thanh toán)
   Allocated: 100M
   Committed: 50M (same)
   Spent: 0M
   Available: 50M
   
3. Payment Completed: Committed → Spent
   Allocated: 100M
   Committed: 0M (released)
   Spent: 50M (actual spend)
   Available: 50M (available for next PO)
```

---

## 🔶 QUYTRÌNH 2: Đánh Giá & Ghi Điểm Nhà Cung Cấp

### 📊 Sơ Đồ Quy Trình

```
┌──────────────────────────────┐
│ PO Completed                 │
│ (Status: COMPLETED/SHIPPED)  │
└──────┬───────────────────────┘
       │
       ↓
╔══════════════════════════════════════════╗
║  AUTO EVALUATION (AI-Powered)            ║
║                                          ║
║  1. Collect Metrics (from 6 months)     ║
║     - OTD (On-Time Delivery)            ║
║     - Quality Score                      ║
║     - Manual Reviews                     ║
║     - Disputes                           ║
║                                          ║
║  2. Call AI Service to analyze          ║
║                                          ║
║  3. Calculate KPI Scores                ║
║     - Tier classification               ║
║     - Recommendation                    ║
╚══════════┬═══════════════════════════════╝
           │
           ↓ (Every PO completion + quarterly)
┌──────────────────────────────┐
│ Save SupplierKpiScore        │
│ - OTD Score (0-100)          │
│ - Quality Score (0-100)      │
│ - Manual Review Score        │
│ - Overall Score              │
│ - Tier: GOLD/SILVER/BRONZE  │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Update Supplier Record       │
│ - trustScore                 │
│ - tier                       │
│ - lastEvaluatedAt           │
└──────────────────────────────┘
```

---

### ⚙️ **Supplier KPI Calculation**
**File:** `supplier-kpimodule/supplier-kpimodule.service.ts`

#### **Step 1: Collect Raw Metrics** (Last 6 months)

```typescript
async evaluateSupplierPerformance(supplierId, buyerOrgId) {
  // 1. Lấy PO trong 6 tháng gần nhất
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const pos = await prisma.purchaseOrder.findMany({
    where: {
      supplierId,
      orgId: buyerOrgId,
      createdAt: { gte: sixMonthsAgo },
      status: { in: ['COMPLETED', 'SHIPPED', 'GRN_CREATED'] }
    },
    include: {
      goodsReceipts: {
        include: { items: true }
      }
    }
  })
  
  // 2. Tính On-Time Delivery (OTD)
  const totalPos = pos.length
  let onTimePos = 0
  
  pos.forEach(po => {
    const grn = po.goodsReceipts[0]
    if (grn && grn.receivedAt <= po.deliveryDate) {
      onTimePos++
    }
  })
  
  const otdScore = totalPos > 0 ? (onTimePos / totalPos) * 100 : 100
  // OTD = (Số PO giao đúng hạn / Tổng PO) × 100
  
  // 3. Tính Quality Score
  let totalItemsReceived = 0
  let totalItemsAccepted = 0
  
  pos.forEach(po => {
    po.goodsReceipts.forEach(grn => {
      grn.items.forEach(item => {
        totalItemsReceived += Number(item.receivedQty)
        totalItemsAccepted += Number(item.acceptedQty)
      })
    })
  })
  
  const qualityScore = totalItemsReceived > 0
    ? (totalItemsAccepted / totalItemsReceived) * 100
    : 100
  // Quality = (Số item pass QC / Tổng item nhận) × 100
}
```

#### **Step 2: Manual Review + Buyer Rating**

```typescript
// 4. Lấy Manual Reviews (từ Buyer)
const manualReviews = await prisma.supplierManualReview.findMany({
  where: {
    po: { supplierId, orgId: buyerOrgId },
    reviewedAt: { gte: sixMonthsAgo }
  }
})

// 5. Lấy Buyer Ratings (5 tiêu chí)
const buyerRatings = await prisma.buyerRating.findMany({
  where: {
    supplierId,
    buyerOrgId,
    ratedAt: { gte: sixMonthsAgo }
  }
})

// BuyerRating Schema:
{
  paymentTimelinessScore: 1-5,      // Thanh toán đúng hẹn
  specClarityScore: 1-5,             // Giải thích spec rõ ràng
  communicationScore: 1-5,           // Giao tiếp tốt
  processComplianceScore: 1-5,       // Tuân thủ quy trình
  disputeFairnessScore: 1-5          // Công bằng khi tranh chấp
}

// Tính Manual Score (0-100)
let totalManualScore = 0
let manualReviewCount = 0

manualReviews.forEach(review => {
  totalManualScore += Number(review.overallScore)
  manualReviewCount++
})

buyerRatings.forEach(rating => {
  const avgRating = (
    rating.paymentTimelinessScore +
    rating.specClarityScore +
    rating.communicationScore +
    rating.processComplianceScore +
    rating.disputeFairnessScore
  ) / 5  // Avg 5 tiêu chí (1-5 → 1-5)
  
  totalManualScore += avgRating * 20  // Convert 1-5 → 0-100
  manualReviewCount++
})

const manualScore = manualReviewCount > 0
  ? totalManualScore / manualReviewCount
  : 100
```

#### **Step 3: Disputes Count**

```typescript
const disputeCount = await prisma.dispute.count({
  where: {
    againstOrgId: supplierId,    // Nhà CC bị complaint
    openedOrgId: buyerOrgId,      // Từ buyer
    createdAt: { gte: sixMonthsAgo }
  }
})
// Dispute = Số tranh chấp khởi tố
```

#### **Step 4: AI Analysis**

```typescript
// Prepare data for AI
const performanceMetrics = {
  otdScore: 95.5,        // On-Time Delivery %
  qualityScore: 98.2,    // Quality %
  manualScore: 87.0,     // Manual Review (1-100)
  poCount: 25,           // # of PO
  disputeCount: 1        // # of disputes
}

// Call AI Service
const aiEvaluation = await this.aiService.analyzeSupplierPerformance(
  supplier,
  performanceMetrics
)

// AI returns:
{
  overallScore: 93.5,    // Weighted overall
  recommendation: "GOLD_TIER",
  strengths: ["High OTD", "Good quality"],
  weaknesses: ["Low communication"],
  insight: "Reliable supplier, consistent delivery"
}
```

#### **Step 5: Save KPI Score (Quarterly)**

```typescript
const currentYear = new Date().getFullYear()
const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1

const kpiScore = await prisma.supplierKpiScore.upsert({
  where: {
    supplierId_buyerOrgId_periodYear_periodQuarter: {
      supplierId,
      buyerOrgId,
      periodYear: currentYear,
      periodQuarter: currentQuarter
    }
  },
  update: {
    otdScore,
    qualityScore,
    manualScore,
    overallScore: (otdScore + qualityScore + manualScore) / 3,
    poCount: totalPos,
    disputeCount,
    evaluatedAt: new Date(),
    aiRecommendation: aiEvaluation.recommendation,
    aiInsight: aiEvaluation.insight
  },
  create: {
    supplierId,
    buyerOrgId,
    periodYear: currentYear,
    periodQuarter: currentQuarter,
    otdScore,
    qualityScore,
    manualScore,
    overallScore: (otdScore + qualityScore + manualScore) / 3,
    poCount: totalPos,
    disputeCount,
    evaluatedAt: new Date(),
    aiRecommendation: aiEvaluation.recommendation,
    aiInsight: aiEvaluation.insight,
    tier: classifyTier(aiEvaluation.recommendation)  // GOLD/SILVER/BRONZE
  }
})
```

#### **Step 6: Update Supplier Tier**

```typescript
// Cập nhật Supplier record
await prisma.organization.update({
  where: { id: supplierId },
  data: {
    tier: kpiScore.tier,              // GOLD/SILVER/BRONZE
    trustScore: kpiScore.overallScore,
    lastEvaluatedAt: new Date()
  }
})
```

---

### 📊 **Supplier Tier Classification**

```typescript
function classifyTier(overallScore): SupplierTier {
  if (overallScore >= 90 && notHaveRecent Disputes) {
    return SupplierTier.GOLD     // ⭐⭐⭐ Excellent
  }
  if (overallScore >= 75 && disputeCount <= 2) {
    return SupplierTier.SILVER   // ⭐⭐ Good
  }
  return SupplierTier.BRONZE     // ⭐ Acceptable
}
```

**Tier Benefits:**
```
GOLD:
- Preferred supplier
- Fast payment terms
- Higher order commitment

SILVER:
- Standard supplier
- Normal terms
- Monitor quarterly

BRONZE:
- Review supplier
- Stricter QC
- Probation period
```

---

## 📈 **Sample Dashboard Metrics**

### Supplier A (Last 6 Months)
```
Name: ABC Manufacturing
Period: Q1 2026 (Jan-Mar)
Tier: GOLD ⭐⭐⭐

OTD Score (On-Time Delivery): 96%
  ├─ Total PO: 24
  ├─ On-time: 23
  └─ Late: 1

Quality Score: 98.5%
  ├─ Items Received: 1,245
  ├─ Items Accepted: 1,226
  └─ Defect Rate: 1.5%

Manual Review: 4.2/5.0
  ├─ Timeliness: 5/5
  ├─ Communication: 4/5
  ├─ Process: 4/5
  └─ Dispute Handling: 4/5

Overall Score: 94.5%
AI Recommendation: "GOLD_TIER - Excellent supplier"
Disputes: 0 (last 6 months)

Recommendation: ✅ Increase volume, extend payment terms
```

### Supplier B (Last 6 Months)
```
Name: XYZ Ltd
Period: Q1 2026
Tier: BRONZE ⭐

OTD Score: 72%
  ├─ Total PO: 12
  ├─ On-time: 8
  └─ Late: 4

Quality Score: 85%
  ├─ Items Received: 456
  ├─ Items Accepted: 387
  └─ Defect Rate: 15%

Manual Review: 2.8/5.0
  ├─ Timeliness: 2/5 (Late payment)
  ├─ Communication: 3/5
  └─ Dispute Handling: 3/5

Overall Score: 78.2%
AI Recommendation: "IMPROVE_SILVER - Monitor closely"
Disputes: 3 (last 6 months)

Recommendation: ⚠️ Probation 3 months, strict QC, reduce order commitment
```

---

## 🔗 Integration Point

**Khi PO Confirm (Status = CONFIRMED):**
```typescript
async confirmPo(poId: string) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } })
  
  const updatedPo = await this.repository.confirmPoFromSupplier(poId)
  
  // 🤖 TRIGGER: Automatic Supplier Evaluation
  try {
    await this.supplierKpiService.evaluateSupplierPerformance(
      po.supplierId,   // ← Which supplier
      po.orgId         // ← Which buyer org
    )
  } catch (aiError) {
    console.error('AI Evaluation failed, continuing flow:', aiError)
  }
  
  return updatedPo
}
```

---

## 📋 Summary Table

| Aspect | Quy Trình 1 (Payment) | Quy Trình 2 (Rating) |
|--------|----------------------|---------------------|
| **Purpose** | Đối soát & Thanh toán | Đánh giá hiệu suất |
| **Trigger** | Invoice received | PO confirmed/completed |
| **Key Entity** | SupplierInvoice | SupplierKpiScore |
| **3-Way Check** | PO vs GRN vs Invoice | OTD vs Quality vs Manual |
| **Tolerance** | 2% qty, 1% price | AI-based, flexible |
| **Output** | Payment completed | Supplier Tier (Gold/Silver/Bronze) |
| **Result** | Spent Budget | Supplier Score (1-100) |
| **Financial Impact** | Committed→Spent | Budget planning for next PO |
| **Supplier Impact** | Payment received | Tier & Trust Score updated |

---

## 🎯 Complete Flow: Summary

```
PO Created
  ├─ Reserve Budget
  ├─ Status: DRAFT
  └─ Supplier confirms
  
      ↓
      
Goods Received (GRN)
  ├─ Warehouse checks qty & quality
  ├─ Status: CONFIRMED
  └─ Items: accepted/rejected
  
      ↓
      
Invoice Received
  ├─ 🤖 3-Way Auto Matching
  │   (PO vs GRN vs Invoice)
  ├─ If match: AUTO_APPROVED
  ├─ If not: EXCEPTION_REVIEW
  └─ Status: PAYMENT_APPROVED
  
      ↓
      
Payment Created & Processed
  ├─ Create Payment record
  ├─ Process transaction
  ├─ Update Budget (Committed → Spent)
  └─ Status: COMPLETED
  
      ↓
      
🤖 AI Supplier Evaluation (Quarterly)
  ├─ Collect 6-month metrics
  ├─ OTD Score, Quality Score
  ├─ Manual reviews, Disputes
  ├─ AI analysis
  └─ Update Supplier Tier (Gold/Silver/Bronze)

      ↓
      
✅ Complete Cycle
  - PO: COMPLETED
  - Invoice: PAID
  - Budget: Fully spent
  - Supplier: Rated & Tier updated
```

---

**Các file implementation:**
- PO: `src/pomodule/pomodule.service.ts`
- Invoice & 3-Way Matching: `src/invoice-module/invoice-module.service.ts`
- Payment: `src/payment-module/payment-module.service.ts`
- Supplier Rating: `src/supplier-kpimodule/supplier-kpimodule.service.ts`
- GRN: `src/grnmodule/grnmodule.service.ts`
