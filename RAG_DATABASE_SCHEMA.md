# Database Schema RAG Knowledge Base
## Procurement & Supply Chain Management System

---

## 1. CORE ENTITY RELATIONSHIPS

```
Organization (Buyer/Supplier)
├── Users (staff, admin, finance, director, supplier)
├── PurchaseRequisitions (PR) → created by Requester
│   ├── PrItems
│   └── RFQ Request → invite Suppliers → Quotations → Award
├── PurchaseOrders (PO) → from RFQ Award
│   ├── PoItems
│   ├── GoodsReceipts (GRN) → received by Warehouse
│   │   └── GrnItems (receivedQty, acceptedQty, rejectedQty)
│   └── SupplierInvoices → 3-Way Matching
│       ├── InvoiceItems
│       └── Payments
└── BudgetAllocations → tracking budget

---

## 2. MASTER DATA TABLES

### organizations
- **Purpose**: Stores all organizations (Buyers and Suppliers)
- **Key Fields**:
  - id, code, name, legalName, taxCode
  - companyType: BUYER | SUPPLIER | PLATFORM_ADMIN
  - supplierTier: PENDING | BRONZE | SILVER | GOLD | PLATINUM
  - trustScore: 0-100
  - kycStatus: PENDING | VERIFIED | REJECTED
- **Relationships**: Central hub connecting to all other tables
- **Usage**: Filter data by orgId for multi-tenant queries

### users
- **Purpose**: System users with role-based access
- **Key Fields**:
  - id, email, phone, fullName, jobTitle
  - role: REQUESTER | APPROVER | BUYER | WAREHOUSE | FINANCE | DIRECTOR | SUPPLIER_ADMIN | PLATFORM_ADMIN
  - orgId: links to organization
  - deptId: department assignment
- **Usage**: Identify who created/approved documents

### departments
- **Purpose**: Internal departments of buyer organizations
- **Key Fields**:
  - id, orgId, code, name, parentDeptId (hierarchy)
  - budgetAnnual, budgetUsed
  - headUserId: department head
- **Usage**: Budget allocation, approval routing

### products
- **Purpose**: Product catalog
- **Key Fields**:
  - id, sku, name, description, categoryId
  - unitPriceRef: reference price for AI suggestions
  - lastPriceAt: when price was last updated
  - priceVolatility: STABLE | VOLATILE | SEASONAL

### product_categories
- **Purpose**: Category classification for products
- **Key Fields**: id, code, name, parentCategoryId, spendType

---

## 3. PROCUREMENT WORKFLOW TABLES

### purchase_requisitions (PR)
- **Purpose**: Internal purchase requests from departments
- **Key Fields**:
  - id, prNumber (unique), orgId, requesterId, deptId
  - title, description, justification, priority: LOW | NORMAL | HIGH | CRITICAL
  - status: DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | CONVERTED_TO_RFQ
  - estimatedTotal, currency
  - requiredDate: when items are needed
- **Flow**: DRAFT → PENDING → APPROVED → (auto-create RFQ)
- **Relations**: prItems, department, requester

### pr_items
- **Purpose**: Line items within a PR
- **Key Fields**:
  - id, prId, productId, sku, productDesc
  - qty, unit, estimatedPrice
  - categoryId, preferredSupplierId
- **Usage**: Sum estimatedPrice × qty = PR total

### rfq_requests (RFQ)
- **Purpose**: Request for Quotation sent to suppliers
- **Key Fields**:
  - id, rfqNumber, orgId, prId, title, description
  - status: DRAFT | SENT | CLOSED | AWARDED | CANCELLED
  - deadline: response deadline
  - createdById
- **Flow**: 
  - DRAFT → SENT (suppliers invited)
  - Suppliers submit quotations
  - AWARDED (select winner) → auto-create PO
- **Relations**: rfqItems, rfqSuppliers, quotations

### rfq_items
- **Purpose**: Items in RFQ with target prices
- **Key Fields**:
  - id, rfqId, prItemId, description, qty, unit
  - targetPrice: buyer's expected price

### rfq_suppliers
- **Purpose**: Suppliers invited to RFQ
- **Key Fields**:
  - id, rfqId, supplierId, status: INVITED | VIEWED | RESPONDED
  - isRecommended: AI-suggested supplier

### rfq_quotations
- **Purpose**: Supplier quotes in response to RFQ
- **Key Fields**:
  - id, quotationNumber, rfqId, supplierId
  - status: DRAFT | SUBMITTED | ACCEPTED | REJECTED | COUNTERED
  - totalPrice, currency, leadTimeDays, paymentTerms
  - validityDate: quote expiration
  - isWinner: awarded quotation
- **Relations**: quotationItems

### quotation_items
- **Purpose**: Line items in supplier quotation
- **Key Fields**:
  - id, quotationId, rfqItemId, qtyOffered, unitPrice, discountPct
  - lineTotal: calculated qty × unitPrice × (1 - discount)

---

## 4. PURCHASE ORDER TABLES

### purchase_orders (PO)
- **Purpose**: Official orders issued to suppliers
- **Key Fields**:
  - id, poNumber (unique), orgId, supplierId
  - prId, rfqId, quotationId (traceability)
  - status: DRAFT | ISSUED | ACKNOWLEDGED | SHIPPED | DELIVERED | INVOICED | COMPLETED | CANCELLED
  - totalAmount, currency, paymentTerms, deliveryDate
  - buyerId, deptId, costCenterId
- **Flow**:
  - ISSUED (sent to supplier)
  - ACKNOWLEDGED (supplier accepts)
  - SHIPPED (supplier ships)
  - DELIVERED (received at warehouse)
  - INVOICED (supplier sends invoice)
  - COMPLETED (paid)
- **Relations**: poItems, goodsReceipts, invoices, payments

### po_items
- **Purpose**: Line items in PO
- **Key Fields**:
  - id, poId, prItemId, description, qty, unitPrice
  - discountPct, lineTotal, receivedQty (cumulative)

### po_shipment_tracking
- **Purpose**: Track shipping status
- **Key Fields**: poId, trackingNumber, carrier, shippedAt, estimatedArrival, status

---

## 5. GOODS RECEIPT (GRN) TABLES

### goods_receipts (GRN)
- **Purpose**: Record of goods received at warehouse
- **Key Fields**:
  - id, grnNumber (unique), poId, orgId
  - receivedById, inspectedById
  - status: DRAFT | QC_PENDING | QC_PASSED | QC_FAILED_PARTIAL | CONFIRMED | DISPUTED
  - receivedAt, inspectionCompletedAt, confirmedAt
  - grnType: FULL | PARTIAL
- **Flow**:
  - DRAFT (auto-created when PO accepted)
  - QC_PENDING (waiting quality check)
  - QC_PASSED (all good)
  - QC_FAILED_PARTIAL (some rejected)
  - CONFIRMED (finalized)
- **Key Point**: GrnItems contain receivedQty vs acceptedQty

### grn_items
- **Purpose**: Individual items in GRN
- **Key Fields**:
  - id, grnId, poItemId
  - receivedQty: actual quantity received
  - acceptedQty: quantity passing QC
  - rejectedQty: quantity rejected (received - accepted)
  - qcResult: PENDING | PASS | FAIL | PARTIAL_PASS
  - qcNotes, rejectionReason
  - batchNumber, expiryDate
- **CRITICAL**: 3-way matching uses acceptedQty (not receivedQty)

### return_to_vendor (RTV)
- **Purpose**: Record of rejected items returned to supplier
- **Key Fields**: grnId, poId, supplierId, reason, returnType: REPLACE | REFUND

---

## 6. INVOICE & PAYMENT TABLES

### supplier_invoices
- **Purpose**: Invoices from suppliers for payment
- **Key Fields**:
  - id, invoiceNumber, poId, grnId, supplierId, orgId
  - status: DRAFT | SUBMITTED | MATCHING | AUTO_APPROVED | APPROVED | EXCEPTION_REVIEW | REJECTED | PAID
  - subtotal, taxRate, taxAmount, totalAmount, currency
  - invoiceDate, dueDate, paymentTerms
  - matchingResult: JSON with 3-way matching details
  - exceptionReason: why matching failed
  - matchVariancePct: percentage variance
  - submittedAt, matchedAt, approvedAt, paidAt
- **Flow**:
  - SUBMITTED → MATCHING (auto)
  - AUTO_APPROVED (if match OK) → ready for payment
  - EXCEPTION_REVIEW (if mismatch) → Finance review
  - APPROVED → Payment
  - PAID

### invoice_items
- **Purpose**: Line items in invoice
- **Key Fields**:
  - id, invoiceId, poItemId, grnItemId
  - description, qty, unitPrice, total
  - matchStatus: PENDING | MATCHED | MISMATCHED

### payments
- **Purpose**: Payment records to suppliers
- **Key Fields**:
  - id, paymentNumber, invoiceId, poId, supplierId
  - method: CASH | BANK_TRANSFER | CHEQUE | ESCROW | LC | CREDIT_CARD
  - amount, currency, exchangeRate
  - status: PENDING | SCHEDULED | PROCESSING | COMPLETED | FAILED
  - paymentDate, scheduledDate, processedAt
  - gatewayRef, bankRef

---

## 7. 3-WAY MATCHING LOGIC

### Purpose
Compare 3 documents to ensure accuracy before payment:
1. Purchase Order (expected)
2. Goods Receipt (actual received)
3. Supplier Invoice (billed)

### Tolerance Rules
- Quantity: ±2% (invoice qty ≤ GRN acceptedQty × 1.02)
- Price: ±1% (invoice price ≤ PO price × 1.01)

### Matching Results
- AUTO_APPROVED: All checks pass within tolerance
- EXCEPTION_REVIEW: Mismatch detected, needs Finance review

### matchingResult JSON Structure
```json
{
  "poItemId": "uuid",
  "qtyMatch": true/false,
  "priceMatch": true/false,
  "variance": 0.015
}
```

---

## 8. BUDGET MANAGEMENT TABLES

### budget_periods
- **Purpose**: Define budget cycles (annual/quarterly)
- **Key Fields**: orgId, fiscalYear, periodType, periodNumber, startDate, endDate

### budget_allocations
- **Purpose**: Budget assigned to cost centers/departments
- **Key Fields**:
  - budgetPeriodId, costCenterId, deptId, categoryId
  - allocatedAmount, committedAmount, spentAmount
  - currency, status: DRAFT | APPROVED | REJECTED
- **Logic**:
  - allocatedAmount: total budget
  - committedAmount: reserved (when PO created)
  - spentAmount: actual paid
  - available = allocated - committed - spent

### org_budgets
- **Purpose**: Organization-level budget tracking
- **Key Fields**: orgId, fiscalYear, totalBudget, committedAmount, spentAmount

---

## 9. SUPPLIER MANAGEMENT TABLES

### supplier_kpi_scores
- **Purpose**: Performance scores for suppliers
- **Key Fields**:
  - supplierId, buyerOrgId, periodYear, periodQuarter
  - otdScore: On-Time Delivery (0-100)
  - qualityScore: Quality (0-100)
  - priceScore: Price competitiveness (0-100)
  - invoiceAccuracy: Invoice correctness (0-100)
  - fulfillmentRate: Order completion (0-100)
  - responseTimeScore: RFQ response speed (0-100)
  - tier: BRONZE | SILVER | GOLD | PLATINUM (calculated from scores)

### supplier_manual_reviews
- **Purpose**: Human-reviewed scores for supplier performance
- **Key Fields**: packagingScore, labelingScore, coaAccuracyScore, communicationScore, flexibilityScore, complianceScore

### buyer_ratings
- **Purpose**: Suppliers rate buyers (reverse feedback)
- **Key Fields**: paymentTimelinessScore, specClarityScore, communicationScore, processComplianceScore, disputeFairnessScore

### supplier_categories
- **Purpose**: Category assignments for suppliers
- **Key Fields**: supplierId, categoryId, tier, performanceScore

### contracts
- **Purpose**: Master agreements with suppliers
- **Key Fields**: contractNumber, supplierId, orgId, status: DRAFT | PENDING_SIGNATURE | ACTIVE | EXPIRED | TERMINATED, value, startDate, endDate

---

## 10. DISPUTE MANAGEMENT

### disputes
- **Purpose**: Handle conflicts between buyer and supplier
- **Key Fields**:
  - id, disputeNumber, poId, grnId, invoiceId
  - openedById, openedOrgId, againstOrgId
  - type: QUALITY_ISSUE | SHORTAGE | DAMAGE | PRICING | LATE_DELIVERY | OTHER
  - status: OPENED | UNDER_REVIEW | RESOLVED | CLOSED | APPEALED
  - claimedAmount, resolutionAmount, resolutionNote

### dispute_messages
- **Purpose**: Communication thread for dispute resolution
- **Key Fields**: disputeId, senderId, orgId, message, attachments

---

## 11. COMMON QUERY PATTERNS

### Get all POs for a supplier
```sql
SELECT * FROM purchase_orders 
WHERE supplierId = ? 
ORDER BY createdAt DESC
```

### Get pending invoices for Finance approval
```sql
SELECT * FROM supplier_invoices 
WHERE status IN ('MATCHING', 'EXCEPTION_REVIEW') 
AND orgId = ?
```

### Get GRN with items for 3-way matching
```sql
SELECT grn.*, gri.* FROM goods_receipts grn
JOIN grn_items gri ON grn.id = gri.grnId
WHERE grn.poId = ?
```

### Calculate budget utilization
```sql
SELECT 
  allocatedAmount,
  committedAmount,
  spentAmount,
  (allocatedAmount - committedAmount - spentAmount) as available
FROM budget_allocations
WHERE costCenterId = ? AND budgetPeriodId = ?
```

### Get supplier performance KPI
```sql
SELECT * FROM supplier_kpi_scores
WHERE supplierId = ? AND buyerOrgId = ?
ORDER BY periodYear DESC, periodQuarter DESC
LIMIT 1
```

---

## 12. STATUS ENUMS REFERENCE

### Purchase Order Status
DRAFT → ISSUED → ACKNOWLEDGED → SHIPPED → DELIVERED → INVOICED → COMPLETED

### Invoice Status
DRAFT → SUBMITTED → MATCHING → [AUTO_APPROVED/APPROVED] → PAID
              ↓
        EXCEPTION_REVIEW (if mismatch)

### GRN Status
DRAFT → QC_PENDING → QC_PASSED/QC_FAILED_PARTIAL → CONFIRMED

### RFQ Status
DRAFT → SENT → [CLOSED/AWARDED/CANCELLED]

### PR Status
DRAFT → PENDING_APPROVAL → [APPROVED/REJECTED/CONVERTED_TO_RFQ]

### Payment Status
PENDING → SCHEDULED → PROCESSING → COMPLETED
                            ↓
                          FAILED

---

## 13. KEY RELATIONSHIP CHAINS

### Full Procurement Flow
```
PR (purchase_requisitions)
  ↓ (auto when approved)
RFQ (rfq_requests)
  ↓ (invite suppliers)
QUOTATION (rfq_quotations)
  ↓ (select winner)
PO (purchase_orders)
  ↓ (supplier ships)
GRN (goods_receipts) + GrnItems
  ↓ (supplier invoices)
INVOICE (supplier_invoices) + InvoiceItems
  ↓ (3-way matching)
PAYMENT (payments)
```

### Document Linkage
Every document maintains traceability:
- PO links to: prId, rfqId, quotationId
- GRN links to: poId
- Invoice links to: poId, grnId
- Payment links to: invoiceId, poId

---

## 14. MULTI-TENANCY PATTERN

All tables have `orgId` for data isolation:
- Buyer orgs: see their own PRs, POs, GRNs, Invoices
- Supplier orgs: see POs where supplierId = their orgId
- Platform admins: can see all orgs

Query pattern:
```sql
SELECT * FROM table WHERE orgId = CURRENT_USER_ORG_ID
```

---

## 15. AUDIT & LOGGING

### audit_logs
- Tracks all changes to entities
- Fields: userId, action, entityType, entityId, oldValue, newValue, ipAddress, createdAt

### notifications
- System notifications to users
- Fields: recipientId, eventType, subject, body, referenceType, referenceId, status

---

*Generated for RAG AI Assistant - Last Updated: April 2026*
