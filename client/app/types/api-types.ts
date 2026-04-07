/**
 * Generic API response wrapper matching the backend structure
 */
export interface ApiResponse<T> {
    data: T;
    message?: string;
    statusCode?: number;
}

/**
 * Trạng thái xác thực doanh nghiệp (KYC)
 */
export enum KycStatus {
    PENDING = "PENDING",
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    EXPIRED = "EXPIRED"
}

/**
 * Thực thể Phòng ban (Department)
 */
export interface Department {
    id: string;
    orgId: string;
    code: string;
    name: string;
    parentDeptId?: string;
    budgetAnnual: number;
    budgetUsed: number;
    costCenterCode?: string;
    headUserId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    // Relationships
    organization?: { id: string; name: string };
    head?: { id: string; fullName: string; email: string };
    _count?: { users: number };
}

/**
 * Loại hình tổ chức
 */
export enum CompanyType {
    BUYER = "BUYER",
    SUPPLIER = "SUPPLIER",
    BOTH = "BOTH"
}

/**
 * Các mã tiền tệ được hỗ trợ
 */
export enum CurrencyCode {
    VND = "VND",
    USD = "USD",
    EUR = "EUR",
    SGD = "SGD",
    JPY = "JPY",
    CNY = "CNY",
    GBP = "GBP",
    AUD = "AUD"
}

export enum UserRole {
    REQUESTER = "REQUESTER",
    DEPT_APPROVER = "DEPT_APPROVER",
    DIRECTOR = "DIRECTOR",
    CEO = "CEO",
    PROCUREMENT = "PROCUREMENT",
    WAREHOUSE = "WAREHOUSE",
    QA = "QA",
    FINANCE = "FINANCE",
    SUPPLIER = "SUPPLIER",
    PLATFORM_ADMIN = "PLATFORM_ADMIN",
    SYSTEM = "SYSTEM"
}

export enum BudgetAllocationStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export enum BudgetOverrideStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export enum BudgetPeriodType {
    ANNUAL = "ANNUAL",
    QUARTERLY = "QUARTERLY",
    MONTHLY = "MONTHLY",
    RESERVE = "RESERVE"
}

export enum PrStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    UNDER_REVIEW = "UNDER_REVIEW",
    LEVEL2_REVIEW = "LEVEL2_REVIEW",
    LEVEL3_REVIEW = "LEVEL3_REVIEW",
    APPROVED = "APPROVED",
    IN_SOURCING = "IN_SOURCING",
    PO_CREATED = "PO_CREATED",
    COMPLETED = "COMPLETED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}

export enum RfqStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    SUPPLIER_REVIEWING = "SUPPLIER_REVIEWING",
    QUOTATION_RECEIVED = "QUOTATION_RECEIVED",
    AI_ANALYZING = "AI_ANALYZING",
    AI_RECOMMENDED = "AI_RECOMMENDED",
    REQUESTER_REVIEW = "REQUESTER_REVIEW",
    SELECTION_CONFIRMED = "SELECTION_CONFIRMED",
    NEGOTIATION = "NEGOTIATION",
    AWARD_PENDING = "AWARD_PENDING",
    AWARDED = "AWARDED",
    CLOSED = "CLOSED",
    CANCELLED = "CANCELLED"
}

export enum QuotationStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    EXPIRED = "EXPIRED"
}

export enum PrType {
    CATALOG = "CATALOG",
    NON_CATALOG = "NON_CATALOG"
}

export enum QuoteRequestStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    PROCESSING = "PROCESSING",
    QUOTED = "QUOTED",
    COMPLETED = "COMPLETED"
}

export enum PoStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    ISSUED = "ISSUED",
    ACKNOWLEDGED = "ACKNOWLEDGED",
    IN_PROGRESS = "IN_PROGRESS",
    SHIPPED = "SHIPPED",
    GRN_CREATED = "GRN_CREATED",
    INVOICED = "INVOICED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    DISPUTED = "DISPUTED",
    ON_HOLD = "ON_HOLD",
    CONFIRMED = "CONFIRMED",
    REJECTED = "REJECTED"
}

export enum GrnStatus {
    DRAFT = "DRAFT",
    COUNTING = "COUNTING",
    INSPECTING = "INSPECTING",
    INSPECTION_DONE = "INSPECTION_DONE",
    UNDER_REVIEW = "UNDER_REVIEW",
    CONFIRMED = "CONFIRMED",
    POSTED = "POSTED",
    DISPUTED = "DISPUTED"
}

export enum InvoiceStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    MATCHING = "MATCHING",
    AUTO_APPROVED = "AUTO_APPROVED",
    EXCEPTION_REVIEW = "EXCEPTION_REVIEW",
    PAYMENT_APPROVED = "PAYMENT_APPROVED",
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING",
    PAID = "PAID",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    DISPUTED = "DISPUTED"
}

export enum ApprovalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    ESCALATED = "ESCALATED",
    RECALLED = "RECALLED",
    EXPIRED = "EXPIRED",
    DELEGATED = "DELEGATED"
}

export enum DocumentType {
    PURCHASE_REQUISITION = "PURCHASE_REQUISITION",
    PURCHASE_ORDER = "PURCHASE_ORDER",
    SUPPLIER_INVOICE = "SUPPLIER_INVOICE",
    SUPPLIER_SELECTION = "SUPPLIER_SELECTION",
    GRN = "GRN",
    PAYMENT = "PAYMENT",
    CONTRACT = "CONTRACT",
    BUDGET_ALLOCATION = "BUDGET_ALLOCATION"
}

/**
 * Phân hạng nhà cung cấp
 */
export enum SupplierTier {
    STRATEGIC = "STRATEGIC",
    PREFERRED = "PREFERRED",
    APPROVED = "APPROVED",
    CONDITIONAL = "CONDITIONAL",
    DISQUALIFIED = "DISQUALIFIED",
    PENDING = "PENDING"
}

export interface PRItem {
    id: string;
    productName: string;
    qty: number;
    unit: string;
    estimatedPrice: number; 
    description?: string;
    lineItem?: number;
    productDesc?: string;
    sku?: string;
    productId?: string;
}

export interface PR {
    id: string;
    prNumber?: string;
    title: string;
    description?: string;
    justification?: string;
    requiredDate?: string;
    status: PrStatus | string;
    priority: number;
    currency?: CurrencyCode;
    createdAt: string; 
    requester: {
        id: string;
        fullName?: string;
        name?: string;
        role?: string;
        email?: string;
    };
    department?: { name: string } | string;
    deptId?: string;
    costCenterId?: string; 
    totalEstimate?: number;
    items?: PRItem[];
    type: PrType;
    preferredSupplierId?: string;
}

export interface QuoteRequestItem {
    id: string;
    productName: string;
    description: string;
    qty: number;
    unit: string; 
    unitPrice?: number;
    supplierName?: string;
    supplierId?: string;
}

export interface QuoteRequest {
    id: string;
    qrNumber: string;
    title: string;
    description: string; 
    status: QuoteRequestStatus;
    createdAt: string;
    items: QuoteRequestItem[];
    supplierIds?: string[];
    requiredDate?: string;
    quote?: {
        price: number;
        supplier: string;
        deliveryDate: string;
    };
}

/**
 * Thực thể Tổ chức (Organization)
 */
export interface Organization {
    id: string;
    code: string;
    name: string;
    legalName?: string;
    taxCode?: string;
    companyType: CompanyType;
    industry?: string;
    countryCode: string;
    province?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
    isActive: boolean;
    kycStatus: KycStatus;
    trustScore: number;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

/**
 * Thực thể Trung tâm chi phí (Cost Center)
 */
export interface CostCenter {
    id: string;
    orgId: string;
    deptId?: string;
    code: string;
    name: string;
    glAccount?: string;
    budgetAnnual: number;
    budgetUsed: number;
    currency: CurrencyCode;
    fiscalYear?: number;
    isActive: boolean;
    createdAt: string;
    department?: Department;
    budgetAllocations?: BudgetAllocation[];
}

export interface BudgetAllocation {
    id: string;
    budgetPeriodId: string;
    costCenterId: string;
    orgId: string;
    deptId?: string;
    allocatedAmount: number;
    committedAmount: number;
    spentAmount: number;
    currency: string;
    notes?: string;
    createdAt: string;
    budgetPeriod?: {
        id: string;
        fiscalYear: number;
        periodNumber: number;
        periodType: BudgetPeriodType;
    };
    status: BudgetAllocationStatus;
    category?: {
        id: string;
        name: string;
    };
}

export interface BudgetOverride {
    id: string;
    budgetAllocId: string;
    prId: string;
    requestedById: string;
    overrideAmount: number;
    reason: string;
    status: BudgetOverrideStatus;
    approvedById?: string;
    approvedAt?: string;
    rejectedReason?: string;
    createdAt: string;
    // Relations
    budgetAlloc?: BudgetAllocation;
    pr?: PR;
    requestedBy?: User;
}

/**
 * Thực thể Người dùng (User)
 */
export interface User {
    id: string;
    email: string;
    name?: string;
    fullName?: string;
    role: UserRole | string;
    department?: string | { id: string; name: string };
    deptId?: string;
    orgId?: string;
    jobTitle?: string;
    employeeCode?: string;
    isActive?: boolean;
    avatarUrl?: string;
    icon?: string;
}

// --- DTOs ---

export interface LoginPayload {
    email: string;
    password?: string;
}

export interface LoginResponse {
    accessToken: string;
    user: User;
}

export interface RegisterPayload extends Record<string, unknown> {
    email: string;
    password?: string;
    name?: string;
    role?: string;
}

export type CreateUserPayload = Omit<User, 'id' | 'isActive'> & { passwordHash?: string };
export type UpdateUserPayload = Partial<Omit<User, 'id'>>;

export interface CreatePrItemDto {
    productId?: string;
    productDesc: string;
    sku?: string;
    categoryId?: string;
    qty: number;
    unit?: string;
    estimatedPrice: number;
    currency?: CurrencyCode;
    specNote?: string;
}

export interface CreatePrDto {
    title: string;
    description?: string;
    justification?: string;
    requiredDate?: string;
    priority?: number;
    currency?: CurrencyCode;
    costCenterId?: string;
    items: CreatePrItemDto[];
}

export type UpdatePrDto = Partial<CreatePrDto>;

export interface CreatePoDto {
    vendorId?: string;
    vendor?: string;
    prId?: string;
    total?: number;
    currency?: CurrencyCode;
    paymentTerms?: string;
    deliveryAddress?: string;
    items?: Array<{
        description: string;
        qty: number;
        estimatedPrice: number;
        productId?: string;
    }>;
}

export interface CreateRfqDto {
    prId: string;
    title: string;
    description?: string;
    deadline?: string;
    minSuppliers?: number;
    supplierIds: string[];
}

export interface ConsolidateRfqDto {
    prIds: string[];
    title: string;
    description?: string;
    deadline?: string;
    supplierIds: string[];
}

export interface CreateQuoteDto {
    rfqId: string;
    supplierId: string;
    totalPrice: number;
    leadTimeDays: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    validityDays?: number;
    notes?: string;
    items?: Array<{
        rfqItemId: string;
        unitPrice: number;
        qtyOffered?: number;
    }>;
}

export interface CreateGrnItem {
    poItemId: string;
    receivedQty: number;
}

export interface CreateGrnDto {
    poId: string;
    items: CreateGrnItem[];
}

export interface CreateInvoiceDto extends Record<string, unknown> {
    poId: string;
    invoiceNumber: string;
    amount: number;
    vendor: string;
}

export type CreateOrganizationPayload = Omit<
    Organization, 
    'id' | 'createdAt' | 'updatedAt' | 'kycStatus' | 'trustScore' | 'isActive'
>;

export type UpdateOrganizationPayload = Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateCostCenterPayload = Omit<
    CostCenter, 
    'id' | 'createdAt' | 'budgetUsed' | 'isActive'
>;

export type UpdateCostCenterPayload = Partial<
    Omit<CostCenter, 'id' | 'orgId' | 'createdAt'>
>;

export type CreateDepartmentPayload = Omit<
    Department, 
    'id' | 'createdAt' | 'updatedAt' | 'budgetUsed' | 'isActive'
>;

export type UpdateDepartmentPayload = Partial<
    Omit<Department, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>
>;

export enum ProductType {
    CATALOG = "CATALOG",
    NON_CATALOG = "NON_CATALOG"
}

export interface Product {
    id: string;
    orgId?: string;
    categoryId?: string;
    sku: string;
    name: string;
    description?: string;
    unit: string;
    unitPriceRef: number;
    currency: CurrencyCode;
    type: ProductType;
    isActive: boolean;
    attributes: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    category?: ProductCategory;
}

export interface ProductCategory {
    id: string;
    orgId?: string;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type CreateCategoryDto = Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export type CreateProductDtoShort = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>;
export type UpdateProductDtoShort = Partial<CreateProductDtoShort>;

export interface BudgetPeriod {
    id: string;
    orgId: string;
    fiscalYear: number;
    periodType: string;
    periodNumber: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export type CreateBudgetPeriodPayload = Omit<BudgetPeriod, 'id' | 'isActive'>;
export type UpdateBudgetPeriodPayload = Partial<Omit<BudgetPeriod, 'id'>>;

export type CreateBudgetAllocationPayload = Omit<
    BudgetAllocation, 
    'id' | 'createdAt' | 'committedAmount' | 'spentAmount'
> & { status?: BudgetAllocationStatus };

export type UpdateBudgetAllocationPayload = Partial<
    Omit<BudgetAllocation, 'id' | 'orgId' | 'createdAt'>
>;

export enum ContractStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    TERMINATED = "TERMINATED",
    COMPLETED = "COMPLETED"
}

export interface ContractMilestone {
    id: string;
    contractId: string;
    title: string;
    description?: string;
    dueDate: string;
    amount: number;
    status: string;
    completedAt?: string;
}

export interface Contract {
    id: string;
    contractNumber: string;
    title: string;
    description?: string;
    orgId: string;
    supplierId: string;
    poId?: string;
    status: ContractStatus;
    startDate: string;
    endDate: string;
    totalValue: number;
    currency: CurrencyCode;
    buyerSignedAt?: string;
    supplierSignedAt?: string;
    createdAt: string;
    updatedAt: string;
    milestones?: ContractMilestone[];
    supplier?: Organization;
    organization?: Organization;
}

export enum DisputeStatus {
    OPEN = "OPEN",
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED",
    CANCELLED = "CANCELLED"
}

export interface Dispute {
    id: string;
    disputeNumber: string;
    relatedDocumentId: string;
    relatedDocumentType: DocumentType;
    title: string;
    reason: string;
    status: DisputeStatus;
    priority: string;
    reportedById: string;
    assignedToId?: string;
    resolution?: string;
    resolvedAt?: string;
    createdAt: string;
    updatedAt: string;
    reportedBy?: User;
    assignedTo?: User;
}

export interface AuditLog {
    id: string;
    orgId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oldValue?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    user?: User;
}
export interface SupplierKPI {
    id: string;
    supplierId: string;
    period: string;
    onTimeDeliveryScore: number;
    qualityScore: number;
    priceScore: number;
    responsivenessScore: number;
    complianceScore: number;
    overallScore: number;
    tier: SupplierTier;
    evaluatedAt: string;
}

export interface SupplierEvaluation {
    id: string;
    supplierId: string;
    evaluationPeriod: string;
    score: number;
    tier: SupplierTier;
    metrics: {
        onTimeDelivery: number;
        qualityScore: number;
        priceCompetitiveness: number;
        invoiceAccuracy: number;
        responsiveness: number;
        orderFulfillment: number;
    };
    evaluationDate: string;
}

// export interface CreateCostCenterPayload {
//     name: string;
//     code: string;
//     description?: string;
//     orgId: string;
//     managerId?: string;
//     deptId?: string;
// }

// }

// export interface UpdateCostCenterPayload extends Partial<CreateCostCenterPayload> {}

export interface CreateQuoteRequestDto {
    title: string;
    description?: string;
    deadline?: string;
    items: Array<{
        productName: string;
        qty: number;
        estimatedUnitPrice: number;
    }>;
}

export interface UpdateQuoteRequestDto extends Partial<CreateQuoteRequestDto> {
    status?: string;
}

// ========== RFQ Quotations & Q&A ==========

export interface Quotation {
    id: string;
    rfqId: string;
    supplierId: string;
    totalPrice: number;
    leadTimeDays: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    validityDays?: number;
    notes?: string;
    status: QuotationStatus;
    aiScore?: number;
    createdAt: string;
    updatedAt?: string;
    items?: QuotationItem[];
    supplier?: Organization;
}

export interface QuotationItem {
    id: string;
    quotationId: string;
    prItemId: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
}

export interface CreateQuotationDto {
    supplierId: string;
    totalPrice: number;
    leadTimeDays: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    validityDays?: number;
    notes?: string;
    items?: Array<{
        prItemId: string;
        unitPrice: number;
        quantity: number;
    }>;
}

export interface QAThread {
    id: string;
    rfqId: string;
    supplierId: string;
    question: string;
    answer?: string;
    isPublic: boolean;
    createdById: string;
    createdAt: string;
    answeredAt?: string;
    answeredById?: string;
}

export interface CreateQAThreadDto {
    supplierId: string;
    question: string;
    isPublic?: boolean;
}

export interface AnswerQAThreadDto {
    answer: string;
}

export interface CounterOffer {
    id: string;
    quotationId: string;
    proposedPrice: number;
    proposedLeadTime?: number;
    notes?: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdById: string;
    createdAt: string;
    respondedAt?: string;
    responseNotes?: string;
}

export interface CreateCounterOfferDto {
    proposedPrice: number;
    proposedLeadTime?: number;
    notes?: string;
}

export interface RespondCounterOfferDto {
    response: 'ACCEPT' | 'REJECT';
    status: 'ACCEPTED' | 'REJECTED';
    notes?: string;
}

// ========== Payments ==========

export enum PaymentStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}

export interface Payment {
    id: string;
    invoiceId: string;
    poId?: string;
    amount: number;
    currency: CurrencyCode;
    status: PaymentStatus;
    paymentMethod?: string;
    transactionId?: string;
    paidAt?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreatePaymentDto {
    invoiceId: string;
    amount: number;
    paymentMethod?: string;
}

// ========== User Delegations ==========

export interface UserDelegation {
    id: string;
    delegatorId: string;
    delegateeId: string;
    startDate: string;
    endDate?: string;
    reason?: string;
    isActive: boolean;
    createdAt: string;
    delegator?: User;
    delegatee?: User;
}

export interface CreateDelegationDto {
    delegateeId: string;
    startDate: string;
    endDate?: string;
    reason?: string;
}

// ========== Contract Milestones ==========

export interface ContractMilestone {
    id: string;
    contractId: string;
    title: string;
    description?: string;
    dueDate: string;
    amount: number;
    status: string;
    completedAt?: string;
}

export interface UpdateMilestoneDto {
    status?: string;
    completionDate?: string;
}

// ========== GRN ==========

export interface UpdateGrnStatusDto {
    status: GrnStatus;
}

// ========== Invoice ==========

export interface UpdateInvoiceDto {
    invoiceNumber?: string;
    amount?: number;
    vendor?: string;
    dueDate?: string;
    notes?: string;
}

// ========== Audit Log ==========

export interface AuditLogFilterDto {
    type?: string;
    id?: string;
}

// ========== Supplier KPI ==========

export interface SupplierKPI {
    id: string;
    supplierId: string;
    period: string;
    onTimeDeliveryScore: number;
    qualityScore: number;
    priceScore: number;
    responsivenessScore: number;
    complianceScore: number;
    overallScore: number;
    tier: SupplierTier;
    evaluatedAt: string;
}

// ========== Auth ==========

export interface RefreshTokenDto {
    refreshToken: string;
}

export interface ValidateTokenDto {
    token: string;
}

export interface LogoutDto {
    userId: string;
}
