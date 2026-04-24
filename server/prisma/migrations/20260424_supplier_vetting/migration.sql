-- CreateEnum
CREATE TYPE "VettingStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "DocumentType" ADD VALUE 'SUPPLIER_VETTING';

-- CreateTable
CREATE TABLE "supplier_vetting_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "assigned_to_id" UUID,
    "status" "VettingStatus" NOT NULL DEFAULT 'DRAFT',
    "price_vs_market" DECIMAL(5,2),
    "overall_score" DECIMAL(5,2),
    "rejected_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "supplier_vetting_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_vetting_checks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vetting_id" UUID NOT NULL,
    "check_type" VARCHAR(50) NOT NULL,
    "check_status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "verified_by_id" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "file_url" VARCHAR(500),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "supplier_vetting_checks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "supplier_vetting_requests" ADD CONSTRAINT "supplier_vetting_requests_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_vetting_requests" ADD CONSTRAINT "supplier_vetting_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_vetting_requests" ADD CONSTRAINT "supplier_vetting_requests_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "supplier_vetting_checks" ADD CONSTRAINT "supplier_vetting_checks_vetting_id_fkey" FOREIGN KEY ("vetting_id") REFERENCES "supplier_vetting_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplier_vetting_checks" ADD CONSTRAINT "supplier_vetting_checks_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
