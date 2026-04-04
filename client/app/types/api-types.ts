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

export enum BudgetAllocationStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
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
    CONTRACT = "CONTRACT"
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
    };
}

// --- ORGANIZATION DTOs ---

/**
 * Payload cho method POST /organizations (Tạo mới tổ chức)
 */
export type CreateOrganizationPayload = Omit<
    Organization, 
    'id' | 'createdAt' | 'updatedAt' | 'kycStatus' | 'trustScore' | 'isActive'
>;

/**
 * Payload cho method PATCH /organizations/:id (Cập nhật tổ chức)
 */
export type UpdateOrganizationPayload = Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>;


// --- COST CENTER DTOs ---

/**
 * Payload cho method POST /cost-centers (Tạo trung tâm chi phí)
 */
export type CreateCostCenterPayload = Omit<
    CostCenter, 
    'id' | 'createdAt' | 'budgetUsed' | 'isActive'
>;

/**
 * Payload cho method PATCH /cost-centers/:id (Cập nhật trung tâm chi phí)
 */
export type UpdateCostCenterPayload = Partial<
    Omit<CostCenter, 'id' | 'orgId' | 'createdAt'>
>;

// --- DEPARTMENT DTOs ---

/**
 * Payload cho method POST /departments (Tạo mới phòng ban)
 */
export type CreateDepartmentPayload = Omit<
    Department, 
    'id' | 'createdAt' | 'updatedAt' | 'budgetUsed' | 'isActive'
>;

/**
 * Payload cho method PATCH /departments/:id (Cập nhật phòng ban)
 */
export type UpdateDepartmentPayload = Partial<
    Omit<Department, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>
>;

// --- AUTH DTOs ---

export interface LoginPayload {
    email: string;
    password?: string;
}

export interface LoginResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        role: string;
        name?: string;
        fullName?: string;
        deptId?: string;
        orgId?: string;
    };
}

export interface RegisterPayload extends Record<string, unknown> {
    email: string;
    password?: string;
    name?: string;
    role?: string;
}

// --- PR DTOs ---

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

export type UpdatePrDto = Partial<CreatePrDto>

// --- RFQ DTOs ---

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

export interface AwardRfqDto {
    quotationId: string;
}

// --- OTHER TRANSACTION DTOs ---

export interface CreateGrnDto extends Record<string, unknown> {
    poId: string;
    receivedItems: Record<string, number>;
}

export interface CreateInvoiceDto extends Record<string, unknown> {
    poId: string;
    invoiceNumber: string;
    amount: number;
    vendor: string;
}

export interface CreateQuoteDto {
    rfqId: string;
    supplierId: string;
    totalPrice: number;
    leadTimeDays: number;
    notes?: string;
    items?: Array<{
        prItemId: string;
        unitPrice: number;
        quantity: number;
    }>;
}
// --- PRODUCT DTOs ---

/**
 * Thực thể Danh mục sản phẩm (Product Category)
 */
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

export enum ProductType {
    CATALOG = "CATALOG",
    NON_CATALOG = "NON_CATALOG"
}

/**
 * Thực thể Sản phẩm (Product)
 */
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
    lastPriceAt?: string;
    isActive: boolean;
    attributes: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    // Relationships
    category?: ProductCategory;
}

export type CreateCategoryDto = Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export type CreateProductDtoShort = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'category'>;
export type UpdateProductDtoShort = Partial<CreateProductDtoShort>;
