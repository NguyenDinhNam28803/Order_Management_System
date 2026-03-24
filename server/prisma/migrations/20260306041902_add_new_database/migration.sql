-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REQUESTER', 'DEPT_APPROVER', 'DIRECTOR', 'CEO', 'PROCUREMENT', 'WAREHOUSE', 'QA', 'FINANCE', 'SUPPLIER', 'PLATFORM_ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('BUYER', 'SUPPLIER', 'BOTH');

-- CreateEnum
CREATE TYPE "SupplierTier" AS ENUM ('STRATEGIC', 'PREFERRED', 'APPROVED', 'CONDITIONAL', 'DISQUALIFIED', 'PENDING');

-- CreateEnum
CREATE TYPE "PrStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'UNDER_REVIEW', 'LEVEL2_REVIEW', 'LEVEL3_REVIEW', 'APPROVED', 'IN_SOURCING', 'PO_CREATED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('DRAFT', 'SENT', 'SUPPLIER_REVIEWING', 'QUOTATION_RECEIVED', 'AI_ANALYZING', 'AI_RECOMMENDED', 'REQUESTER_REVIEW', 'SELECTION_CONFIRMED', 'NEGOTIATION', 'AWARD_PENDING', 'AWARDED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PoStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'SHIPPED', 'GRN_CREATED', 'INVOICED', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "GrnStatus" AS ENUM ('DRAFT', 'COUNTING', 'INSPECTING', 'INSPECTION_DONE', 'UNDER_REVIEW', 'CONFIRMED', 'POSTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "QcResult" AS ENUM ('PASS', 'PARTIAL_PASS', 'FAIL', 'PENDING');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'MATCHING', 'AUTO_APPROVED', 'EXCEPTION_REVIEW', 'PAYMENT_APPROVED', 'PAYMENT_PROCESSING', 'PAID', 'REJECTED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'ESCROW_RELEASE', 'VNPAY', 'STRIPE', 'LC', 'TT', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPENED', 'PAYMENT_HOLD', 'SUPPLIER_RESPONDED', 'NEGOTIATING', 'ADMIN_REVIEW', 'DECIDED', 'CLOSED', 'APPEALED');

-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('WRONG_SPEC', 'SHORT_DELIVERY', 'DAMAGED_GOODS', 'LATE_DELIVERY', 'INVOICE_DISCREPANCY', 'QUALITY_ISSUE', 'PAYMENT_DISPUTE', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'RECALLED', 'EXPIRED', 'DELEGATED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PURCHASE_REQUISITION', 'PURCHASE_ORDER', 'SUPPLIER_INVOICE', 'SUPPLIER_SELECTION', 'GRN', 'PAYMENT', 'CONTRACT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'SLACK_WEBHOOK', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('VND', 'USD', 'EUR', 'SGD', 'JPY', 'CNY', 'GBP', 'AUD');

-- CreateEnum
CREATE TYPE "Incoterm" AS ENUM ('EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "legal_name" VARCHAR(255),
    "tax_code" VARCHAR(50),
    "company_type" "CompanyType" NOT NULL DEFAULT 'BUYER',
    "industry" VARCHAR(100),
    "country_code" CHAR(2) NOT NULL DEFAULT 'VN',
    "province" VARCHAR(100),
    "address" TEXT,
    "phone" VARCHAR(30),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "logo_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "kyc_verified_at" TIMESTAMPTZ,
    "kyc_verified_by" UUID,
    "supplier_tier" "SupplierTier" NOT NULL DEFAULT 'PENDING',
    "trust_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "doc_type" VARCHAR(50) NOT NULL,
    "doc_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "issued_at" DATE,
    "expired_at" DATE,
    "issuing_body" VARCHAR(255),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "parent_dept_id" UUID,
    "budget_annual" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "budget_used" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "cost_center_code" VARCHAR(30),
    "head_user_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "dept_id" UUID,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "gl_account" VARCHAR(30),
    "budget_annual" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "budget_used" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "fiscal_year" SMALLINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "dept_id" UUID,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30),
    "full_name" VARCHAR(255) NOT NULL,
    "avatar_url" VARCHAR(500),
    "employee_code" VARCHAR(50),
    "job_title" VARCHAR(100),
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ,
    "password_hash" VARCHAR(255),
    "mfa_secret" VARCHAR(100),
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "trust_score" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_delegates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "delegator_id" UUID NOT NULL,
    "delegate_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "scope" VARCHAR(100),
    "valid_from" TIMESTAMPTZ NOT NULL,
    "valid_until" TIMESTAMPTZ NOT NULL,
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_delegates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_matrix_rules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "level" SMALLINT NOT NULL,
    "approver_role" "UserRole" NOT NULL,
    "min_item_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "min_total_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "sla_hours" INTEGER NOT NULL DEFAULT 8,
    "auto_escalate_hours" INTEGER NOT NULL DEFAULT 24,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" DATE,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "approval_matrix_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "document_type" "DocumentType" NOT NULL,
    "document_id" UUID NOT NULL,
    "step" SMALLINT NOT NULL,
    "approver_id" UUID NOT NULL,
    "delegated_from" UUID,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "actioned_at" TIMESTAMPTZ,
    "due_at" TIMESTAMPTZ,
    "reminder_sent_at" TIMESTAMPTZ,
    "escalated_at" TIMESTAMPTZ,
    "escalated_to" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID,
    "parent_id" UUID,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID,
    "category_id" UUID,
    "sku" VARCHAR(100),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "unit" VARCHAR(30) NOT NULL DEFAULT 'PCS',
    "unit_price_ref" DECIMAL(18,2),
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "spec_sheet_url" VARCHAR(500),
    "image_urls" JSONB NOT NULL DEFAULT '[]',
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requisitions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "pr_number" VARCHAR(30) NOT NULL,
    "org_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "dept_id" UUID NOT NULL,
    "cost_center_id" UUID,
    "status" "PrStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" SMALLINT NOT NULL DEFAULT 2,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "justification" TEXT,
    "required_date" DATE,
    "total_estimate" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "approval_level" SMALLINT NOT NULL DEFAULT 1,
    "fast_track" BOOLEAN NOT NULL DEFAULT false,
    "procurement_id" UUID,
    "submitted_at" TIMESTAMPTZ,
    "approved_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "cancel_reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "purchase_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pr_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "pr_id" UUID NOT NULL,
    "line_number" SMALLINT NOT NULL,
    "product_id" UUID,
    "sku" VARCHAR(100),
    "product_desc" VARCHAR(500) NOT NULL,
    "category_id" UUID,
    "qty" DECIMAL(12,3) NOT NULL,
    "unit" VARCHAR(30) NOT NULL DEFAULT 'PCS',
    "estimated_price" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "spec_note" TEXT,
    "preferred_supplier_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pr_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pr_attachments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "pr_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_type" VARCHAR(50),
    "file_size_bytes" BIGINT,
    "uploaded_by" UUID,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pr_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rfq_number" VARCHAR(30) NOT NULL,
    "org_id" UUID NOT NULL,
    "pr_id" UUID NOT NULL,
    "type" VARCHAR(10) NOT NULL DEFAULT 'RFQ',
    "title" VARCHAR(255),
    "description" TEXT,
    "technical_spec" TEXT,
    "deadline" TIMESTAMPTZ NOT NULL,
    "status" "RfqStatus" NOT NULL DEFAULT 'DRAFT',
    "min_suppliers" SMALLINT NOT NULL DEFAULT 3,
    "single_source_approved" BOOLEAN NOT NULL DEFAULT false,
    "single_source_reason" TEXT,
    "single_source_approver" UUID,
    "ai_suggested_at" TIMESTAMPTZ,
    "ai_analysis_at" TIMESTAMPTZ,
    "ai_report" JSONB NOT NULL DEFAULT '{}',
    "awarded_supplier_id" UUID,
    "awarded_at" TIMESTAMPTZ,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "rfq_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rfq_id" UUID NOT NULL,
    "pr_item_id" UUID,
    "category_id" UUID,
    "line_number" SMALLINT NOT NULL,
    "sku" VARCHAR(100),
    "description" VARCHAR(500) NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "unit" VARCHAR(30) NOT NULL DEFAULT 'PCS',
    "target_price" DECIMAL(18,2),
    "tech_requirement" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_suppliers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rfq_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "invited_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ,
    "ai_suggested" BOOLEAN NOT NULL DEFAULT false,
    "ai_score" DECIMAL(5,2),
    "status" VARCHAR(30) NOT NULL DEFAULT 'INVITED',

    CONSTRAINT "rfq_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_qa_threads" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rfq_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "asked_by" UUID NOT NULL,
    "answered_by" UUID,
    "asked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMPTZ,
    "is_public" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "rfq_qa_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_quotations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rfq_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "quotation_number" VARCHAR(30) NOT NULL,
    "total_price" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "lead_time_days" INTEGER NOT NULL,
    "payment_terms" VARCHAR(100),
    "delivery_terms" VARCHAR(100),
    "validity_days" INTEGER NOT NULL DEFAULT 30,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "ai_score" DECIMAL(5,2),
    "ai_breakdown" JSONB NOT NULL DEFAULT '{}',
    "ai_flags" JSONB NOT NULL DEFAULT '[]',
    "submitted_at" TIMESTAMPTZ,
    "reviewed_at" TIMESTAMPTZ,
    "reviewed_by" UUID,
    "override_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "rfq_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_quotation_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "quotation_id" UUID NOT NULL,
    "rfq_item_id" UUID NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "qty_offered" DECIMAL(12,3),
    "discount_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lead_time_days" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_counter_offers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "quotation_id" UUID NOT NULL,
    "offered_by" UUID NOT NULL,
    "offer_type" VARCHAR(20) NOT NULL,
    "proposed_price" DECIMAL(18,2),
    "proposed_terms" TEXT,
    "ai_suggestion" TEXT,
    "response" TEXT,
    "responded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_counter_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "po_number" VARCHAR(30) NOT NULL,
    "org_id" UUID NOT NULL,
    "pr_id" UUID,
    "rfq_id" UUID,
    "quotation_id" UUID,
    "contract_id" UUID,
    "supplier_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "dept_id" UUID,
    "cost_center_id" UUID,
    "status" "PoStatus" NOT NULL DEFAULT 'DRAFT',
    "total_amount" DECIMAL(18,2) NOT NULL,
    "tax_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "incoterms" "Incoterm",
    "payment_terms" VARCHAR(100),
    "delivery_address" TEXT,
    "delivery_date" DATE NOT NULL,
    "late_penalty_pct" DECIMAL(5,2) NOT NULL DEFAULT 0.1,
    "late_penalty_max_days" INTEGER NOT NULL DEFAULT 30,
    "signed_by" UUID,
    "signed_at" TIMESTAMPTZ,
    "issued_at" TIMESTAMPTZ,
    "acknowledged_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "cancel_reason" TEXT,
    "po_pdf_url" VARCHAR(500),
    "escrow_locked" BOOLEAN NOT NULL DEFAULT false,
    "escrow_locked_at" TIMESTAMPTZ,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "po_id" UUID NOT NULL,
    "pr_item_id" UUID,
    "quotation_item_id" UUID,
    "line_number" SMALLINT NOT NULL,
    "sku" VARCHAR(100),
    "description" VARCHAR(500) NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "unit" VARCHAR(30) NOT NULL DEFAULT 'PCS',
    "unit_price" DECIMAL(18,2) NOT NULL,
    "discount_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL,
    "delivery_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "po_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_amendments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "po_id" UUID NOT NULL,
    "amendment_number" SMALLINT NOT NULL,
    "change_type" VARCHAR(50) NOT NULL,
    "change_summary" TEXT NOT NULL,
    "original_value" JSONB,
    "new_value" JSONB,
    "change_pct" DECIMAL(7,2),
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "po_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_shipment_tracking" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "po_id" UUID NOT NULL,
    "tracking_number" VARCHAR(100),
    "carrier" VARCHAR(100),
    "shipped_at" TIMESTAMPTZ,
    "estimated_arrival" TIMESTAMPTZ,
    "actual_arrival" TIMESTAMPTZ,
    "packing_list_url" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "po_shipment_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "grn_number" VARCHAR(30) NOT NULL,
    "po_id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "warehouse_id" UUID,
    "received_by" UUID NOT NULL,
    "inspected_by" UUID,
    "status" "GrnStatus" NOT NULL DEFAULT 'DRAFT',
    "grn_type" VARCHAR(20) NOT NULL DEFAULT 'FULL',
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspection_completed_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "confirmed_by" UUID,
    "packing_list_url" VARCHAR(500),
    "coa_url" VARCHAR(500),
    "waybill_number" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grn_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "grn_id" UUID NOT NULL,
    "po_item_id" UUID NOT NULL,
    "received_qty" DECIMAL(12,3) NOT NULL,
    "accepted_qty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "rejected_qty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "rejection_reason" TEXT,
    "qc_result" "QcResult" NOT NULL DEFAULT 'PENDING',
    "qc_notes" TEXT,
    "sample_qty" DECIMAL(12,3),
    "batch_number" VARCHAR(100),
    "expiry_date" DATE,
    "storage_location" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grn_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grn_photos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "grn_id" UUID NOT NULL,
    "grn_item_id" UUID,
    "photo_url" VARCHAR(500) NOT NULL,
    "caption" VARCHAR(255),
    "uploaded_by" UUID,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grn_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_to_vendor" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rtv_number" VARCHAR(30) NOT NULL,
    "grn_id" UUID NOT NULL,
    "po_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "return_type" VARCHAR(20) NOT NULL DEFAULT 'REPLACE',
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "total_return_qty" DECIMAL(12,3),
    "resolved_at" TIMESTAMPTZ,
    "resolved_by" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "return_to_vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_invoices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_number" VARCHAR(50) NOT NULL,
    "po_id" UUID NOT NULL,
    "grn_id" UUID,
    "supplier_id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(18,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "tax_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "invoice_date" DATE NOT NULL,
    "due_date" DATE,
    "payment_terms" VARCHAR(100),
    "e_invoice_url" VARCHAR(500),
    "e_invoice_ref" VARCHAR(100),
    "matching_result" JSONB NOT NULL DEFAULT '{}',
    "match_variance_pct" DECIMAL(7,4),
    "exception_reason" TEXT,
    "submitted_at" TIMESTAMPTZ,
    "matched_at" TIMESTAMPTZ,
    "approved_at" TIMESTAMPTZ,
    "approved_by" UUID,
    "paid_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "supplier_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_id" UUID NOT NULL,
    "po_item_id" UUID NOT NULL,
    "grn_item_id" UUID,
    "description" VARCHAR(500),
    "qty" DECIMAL(12,3) NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "match_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "variance_note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debit_credit_notes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_id" UUID NOT NULL,
    "note_type" VARCHAR(10) NOT NULL,
    "note_number" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "issued_by" UUID NOT NULL,
    "approved_by" UUID,
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "debit_credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_accounts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "held_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "bank_account" VARCHAR(50),
    "bank_name" VARCHAR(100),
    "last_reconciled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "escrow_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "escrow_id" UUID NOT NULL,
    "po_id" UUID,
    "invoice_id" UUID,
    "transaction_type" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balance_after" DECIMAL(18,2),
    "reference_id" VARCHAR(100),
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "payment_number" VARCHAR(30) NOT NULL,
    "invoice_id" UUID NOT NULL,
    "po_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "exchange_rate" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gateway_ref" VARCHAR(100),
    "bank_ref" VARCHAR(100),
    "payment_date" DATE,
    "scheduled_date" DATE,
    "processed_at" TIMESTAMPTZ,
    "escrow_released_at" TIMESTAMPTZ,
    "failure_reason" TEXT,
    "created_by" UUID,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "contract_number" VARCHAR(50) NOT NULL,
    "org_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "contract_type" VARCHAR(50) NOT NULL DEFAULT 'PURCHASE',
    "value" DECIMAL(18,2),
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "start_date" DATE,
    "end_date" DATE,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "renewal_notice_days" INTEGER NOT NULL DEFAULT 30,
    "signed_by_buyer" UUID,
    "signed_by_supplier" UUID,
    "signed_at" TIMESTAMPTZ,
    "file_url" VARCHAR(500),
    "nda_url" VARCHAR(500),
    "terms" TEXT,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_milestones" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "contract_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "due_date" DATE NOT NULL,
    "completion_date" DATE,
    "payment_trigger" BOOLEAN NOT NULL DEFAULT false,
    "payment_pct" DECIMAL(5,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_kpi_scores" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "supplier_id" UUID NOT NULL,
    "buyer_org_id" UUID NOT NULL,
    "period_year" SMALLINT NOT NULL,
    "period_quarter" SMALLINT NOT NULL,
    "otd_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "quality_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "price_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "invoice_accuracy" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "fulfillment_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "response_time_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "manual_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tier" "SupplierTier",
    "po_count" INTEGER NOT NULL DEFAULT 0,
    "dispute_count" INTEGER NOT NULL DEFAULT 0,
    "review_completed" BOOLEAN NOT NULL DEFAULT false,
    "qbr_held_at" TIMESTAMPTZ,
    "improvement_plan" TEXT,
    "notes" TEXT,
    "calculated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "supplier_kpi_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_manual_reviews" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "kpi_score_id" UUID NOT NULL,
    "po_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "reviewer_role" "UserRole" NOT NULL,
    "packaging_score" SMALLINT,
    "labeling_score" SMALLINT,
    "coa_accuracy_score" SMALLINT,
    "communication_score" SMALLINT,
    "flexibility_score" SMALLINT,
    "compliance_score" SMALLINT,
    "invoice_score" SMALLINT,
    "exception_handling" SMALLINT,
    "overall_score" DECIMAL(5,2) NOT NULL,
    "comment" TEXT,
    "reviewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_manual_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_ratings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "po_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "buyer_org_id" UUID NOT NULL,
    "rated_by" UUID NOT NULL,
    "payment_timeliness_score" SMALLINT NOT NULL,
    "spec_clarity_score" SMALLINT NOT NULL,
    "communication_score" SMALLINT NOT NULL,
    "process_compliance_score" SMALLINT NOT NULL,
    "dispute_fairness_score" SMALLINT NOT NULL,
    "comment" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "rated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "dispute_number" VARCHAR(30) NOT NULL,
    "po_id" UUID NOT NULL,
    "grn_id" UUID,
    "invoice_id" UUID,
    "opened_by" UUID NOT NULL,
    "opened_org_id" UUID NOT NULL,
    "against_org_id" UUID NOT NULL,
    "type" "DisputeType" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPENED',
    "description" TEXT NOT NULL,
    "claimed_amount" DECIMAL(18,2),
    "resolution_type" VARCHAR(30),
    "resolution_amount" DECIMAL(18,2),
    "resolution_note" TEXT,
    "admin_id" UUID,
    "admin_decision" TEXT,
    "decided_at" TIMESTAMPTZ,
    "closed_at" TIMESTAMPTZ,
    "appeal_deadline" TIMESTAMPTZ,
    "appealed_at" TIMESTAMPTZ,
    "appeal_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_evidence" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "dispute_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "evidence_type" VARCHAR(50) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_messages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "dispute_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "event_type" VARCHAR(100) NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" VARCHAR(255),
    "body_template" TEXT NOT NULL,
    "priority" SMALLINT NOT NULL DEFAULT 2,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recipient_id" UUID NOT NULL,
    "org_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "priority" SMALLINT NOT NULL DEFAULT 2,
    "subject" VARCHAR(255),
    "body" TEXT NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "sent_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "read_at" TIMESTAMPTZ,
    "failure_reason" TEXT,
    "retry_count" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "org_id" UUID,
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "session_id" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_periods" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "fiscal_year" SMALLINT NOT NULL,
    "period_type" VARCHAR(10) NOT NULL DEFAULT 'ANNUAL',
    "period_number" SMALLINT NOT NULL DEFAULT 1,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "budget_period_id" UUID NOT NULL,
    "cost_center_id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "dept_id" UUID,
    "category_id" UUID,
    "allocated_amount" DECIMAL(18,2) NOT NULL,
    "committed_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "spent_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'VND',
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID,
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" TEXT NOT NULL,
    "value_type" VARCHAR(20) NOT NULL DEFAULT 'STRING',
    "description" TEXT,
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_configs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "secret_hash" VARCHAR(255),
    "events" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMPTZ,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spend_analytics_snapshots" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "period_type" VARCHAR(10) NOT NULL DEFAULT 'MONTHLY',
    "total_po_value" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total_savings" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "po_count" INTEGER NOT NULL DEFAULT 0,
    "supplier_count" INTEGER NOT NULL DEFAULT 0,
    "avg_cycle_days" DECIMAL(7,2),
    "on_time_pct" DECIMAL(5,2),
    "by_category" JSONB NOT NULL DEFAULT '{}',
    "by_supplier" JSONB NOT NULL DEFAULT '{}',
    "by_dept" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spend_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_tax_code_key" ON "organizations"("tax_code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_org_id_code_key" ON "departments"("org_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_org_id_code_key" ON "cost_centers"("org_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "approval_matrix_rules_org_id_document_type_level_key" ON "approval_matrix_rules"("org_id", "document_type", "level");

-- CreateIndex
CREATE INDEX "approval_workflows_document_type_document_id_idx" ON "approval_workflows"("document_type", "document_id");

-- CreateIndex
CREATE INDEX "approval_workflows_approver_id_status_idx" ON "approval_workflows"("approver_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requisitions_pr_number_key" ON "purchase_requisitions"("pr_number");

-- CreateIndex
CREATE INDEX "purchase_requisitions_org_id_status_idx" ON "purchase_requisitions"("org_id", "status");

-- CreateIndex
CREATE INDEX "purchase_requisitions_requester_id_idx" ON "purchase_requisitions"("requester_id");

-- CreateIndex
CREATE UNIQUE INDEX "pr_items_pr_id_line_number_key" ON "pr_items"("pr_id", "line_number");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_requests_rfq_number_key" ON "rfq_requests"("rfq_number");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_suppliers_rfq_id_supplier_id_key" ON "rfq_suppliers"("rfq_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_quotations_quotation_number_key" ON "rfq_quotations"("quotation_number");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_quotations_rfq_id_supplier_id_key" ON "rfq_quotations"("rfq_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "purchase_orders_org_id_status_idx" ON "purchase_orders"("org_id", "status");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "po_items_po_id_line_number_key" ON "po_items"("po_id", "line_number");

-- CreateIndex
CREATE UNIQUE INDEX "po_amendments_po_id_amendment_number_key" ON "po_amendments"("po_id", "amendment_number");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_grn_number_key" ON "goods_receipts"("grn_number");

-- CreateIndex
CREATE INDEX "goods_receipts_po_id_idx" ON "goods_receipts"("po_id");

-- CreateIndex
CREATE UNIQUE INDEX "return_to_vendor_rtv_number_key" ON "return_to_vendor"("rtv_number");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_invoices_invoice_number_key" ON "supplier_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "supplier_invoices_po_id_idx" ON "supplier_invoices"("po_id");

-- CreateIndex
CREATE INDEX "supplier_invoices_supplier_id_idx" ON "supplier_invoices"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "debit_credit_notes_note_number_key" ON "debit_credit_notes"("note_number");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments"("payment_number");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_number_key" ON "contracts"("contract_number");

-- CreateIndex
CREATE INDEX "supplier_kpi_scores_supplier_id_period_year_period_quarter_idx" ON "supplier_kpi_scores"("supplier_id", "period_year", "period_quarter");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_kpi_scores_supplier_id_buyer_org_id_period_year_pe_key" ON "supplier_kpi_scores"("supplier_id", "buyer_org_id", "period_year", "period_quarter");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_manual_reviews_po_id_reviewer_id_key" ON "supplier_manual_reviews"("po_id", "reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_ratings_po_id_supplier_id_key" ON "buyer_ratings"("po_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_dispute_number_key" ON "disputes"("dispute_number");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_event_type_key" ON "notification_templates"("event_type");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_status_idx" ON "notifications"("recipient_id", "status");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "budget_periods_org_id_fiscal_year_period_type_period_number_key" ON "budget_periods"("org_id", "fiscal_year", "period_type", "period_number");

-- CreateIndex
CREATE UNIQUE INDEX "budget_allocations_budget_period_id_cost_center_id_key" ON "budget_allocations"("budget_period_id", "cost_center_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_org_id_config_key_key" ON "system_configs"("org_id", "config_key");

-- CreateIndex
CREATE UNIQUE INDEX "spend_analytics_snapshots_org_id_snapshot_date_period_type_key" ON "spend_analytics_snapshots"("org_id", "snapshot_date", "period_type");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_kyc_verified_by_fkey" FOREIGN KEY ("kyc_verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_documents" ADD CONSTRAINT "organization_documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_dept_id_fkey" FOREIGN KEY ("parent_dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_user_id_fkey" FOREIGN KEY ("head_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_delegates" ADD CONSTRAINT "user_delegates_delegator_id_fkey" FOREIGN KEY ("delegator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_delegates" ADD CONSTRAINT "user_delegates_delegate_id_fkey" FOREIGN KEY ("delegate_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_matrix_rules" ADD CONSTRAINT "approval_matrix_rules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_matrix_rules" ADD CONSTRAINT "approval_matrix_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_escalated_to_fkey" FOREIGN KEY ("escalated_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_delegated_from_fkey" FOREIGN KEY ("delegated_from") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_procurement_id_fkey" FOREIGN KEY ("procurement_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pr_items" ADD CONSTRAINT "pr_items_pr_id_fkey" FOREIGN KEY ("pr_id") REFERENCES "purchase_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pr_items" ADD CONSTRAINT "pr_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pr_items" ADD CONSTRAINT "pr_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pr_items" ADD CONSTRAINT "pr_items_preferred_supplier_id_fkey" FOREIGN KEY ("preferred_supplier_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pr_attachments" ADD CONSTRAINT "pr_attachments_pr_id_fkey" FOREIGN KEY ("pr_id") REFERENCES "purchase_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_pr_id_fkey" FOREIGN KEY ("pr_id") REFERENCES "purchase_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_single_source_approver_fkey" FOREIGN KEY ("single_source_approver") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_awarded_supplier_id_fkey" FOREIGN KEY ("awarded_supplier_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfq_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_pr_item_id_fkey" FOREIGN KEY ("pr_item_id") REFERENCES "pr_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_suppliers" ADD CONSTRAINT "rfq_suppliers_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfq_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_suppliers" ADD CONSTRAINT "rfq_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_qa_threads" ADD CONSTRAINT "rfq_qa_threads_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfq_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_qa_threads" ADD CONSTRAINT "rfq_qa_threads_asked_by_fkey" FOREIGN KEY ("asked_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_qa_threads" ADD CONSTRAINT "rfq_qa_threads_answered_by_fkey" FOREIGN KEY ("answered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_quotations" ADD CONSTRAINT "rfq_quotations_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfq_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_quotations" ADD CONSTRAINT "rfq_quotations_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_quotation_items" ADD CONSTRAINT "rfq_quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "rfq_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_quotation_items" ADD CONSTRAINT "rfq_quotation_items_rfq_item_id_fkey" FOREIGN KEY ("rfq_item_id") REFERENCES "rfq_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_counter_offers" ADD CONSTRAINT "rfq_counter_offers_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "rfq_quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_counter_offers" ADD CONSTRAINT "rfq_counter_offers_offered_by_fkey" FOREIGN KEY ("offered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_signed_by_fkey" FOREIGN KEY ("signed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_pr_id_fkey" FOREIGN KEY ("pr_id") REFERENCES "purchase_requisitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfq_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "rfq_quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_items" ADD CONSTRAINT "po_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_items" ADD CONSTRAINT "po_items_pr_item_id_fkey" FOREIGN KEY ("pr_item_id") REFERENCES "pr_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_items" ADD CONSTRAINT "po_items_quotation_item_id_fkey" FOREIGN KEY ("quotation_item_id") REFERENCES "rfq_quotation_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_amendments" ADD CONSTRAINT "po_amendments_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_amendments" ADD CONSTRAINT "po_amendments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_amendments" ADD CONSTRAINT "po_amendments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_shipment_tracking" ADD CONSTRAINT "po_shipment_tracking_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_shipment_tracking" ADD CONSTRAINT "po_shipment_tracking_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_inspected_by_fkey" FOREIGN KEY ("inspected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_po_item_id_fkey" FOREIGN KEY ("po_item_id") REFERENCES "po_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_photos" ADD CONSTRAINT "grn_photos_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_photos" ADD CONSTRAINT "grn_photos_grn_item_id_fkey" FOREIGN KEY ("grn_item_id") REFERENCES "grn_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grn_photos" ADD CONSTRAINT "grn_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_to_vendor" ADD CONSTRAINT "return_to_vendor_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "goods_receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_to_vendor" ADD CONSTRAINT "return_to_vendor_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_to_vendor" ADD CONSTRAINT "return_to_vendor_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "goods_receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "supplier_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_po_item_id_fkey" FOREIGN KEY ("po_item_id") REFERENCES "po_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_grn_item_id_fkey" FOREIGN KEY ("grn_item_id") REFERENCES "grn_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debit_credit_notes" ADD CONSTRAINT "debit_credit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "supplier_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debit_credit_notes" ADD CONSTRAINT "debit_credit_notes_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debit_credit_notes" ADD CONSTRAINT "debit_credit_notes_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_accounts" ADD CONSTRAINT "escrow_accounts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_escrow_id_fkey" FOREIGN KEY ("escrow_id") REFERENCES "escrow_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "supplier_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "supplier_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_signed_by_buyer_fkey" FOREIGN KEY ("signed_by_buyer") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_signed_by_supplier_fkey" FOREIGN KEY ("signed_by_supplier") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_milestones" ADD CONSTRAINT "contract_milestones_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_kpi_scores" ADD CONSTRAINT "supplier_kpi_scores_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_kpi_scores" ADD CONSTRAINT "supplier_kpi_scores_buyer_org_id_fkey" FOREIGN KEY ("buyer_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_manual_reviews" ADD CONSTRAINT "supplier_manual_reviews_kpi_score_id_fkey" FOREIGN KEY ("kpi_score_id") REFERENCES "supplier_kpi_scores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_manual_reviews" ADD CONSTRAINT "supplier_manual_reviews_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_manual_reviews" ADD CONSTRAINT "supplier_manual_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_ratings" ADD CONSTRAINT "buyer_ratings_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_ratings" ADD CONSTRAINT "buyer_ratings_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_ratings" ADD CONSTRAINT "buyer_ratings_buyer_org_id_fkey" FOREIGN KEY ("buyer_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_ratings" ADD CONSTRAINT "buyer_ratings_rated_by_fkey" FOREIGN KEY ("rated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "goods_receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "supplier_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_org_id_fkey" FOREIGN KEY ("opened_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_against_org_id_fkey" FOREIGN KEY ("against_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_periods" ADD CONSTRAINT "budget_periods_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_budget_period_id_fkey" FOREIGN KEY ("budget_period_id") REFERENCES "budget_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_configs" ADD CONSTRAINT "webhook_configs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_configs" ADD CONSTRAINT "webhook_configs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spend_analytics_snapshots" ADD CONSTRAINT "spend_analytics_snapshots_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
