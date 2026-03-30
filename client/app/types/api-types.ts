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
    JPY = "JPY"
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
    metadata: Record<string, any>;
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
