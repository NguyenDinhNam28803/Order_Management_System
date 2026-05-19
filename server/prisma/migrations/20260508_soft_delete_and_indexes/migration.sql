-- Add soft delete (deleted_at) to core transactional entities
-- These columns are nullable; NULL means the record is active.

ALTER TABLE "purchase_requisitions" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(6);
ALTER TABLE "purchase_orders"        ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(6);
ALTER TABLE "goods_receipts"         ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(6);
ALTER TABLE "supplier_invoices"      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(6);
ALTER TABLE "rfq_requests"           ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(6);

-- Add missing query-performance indexes on rfq_requests
CREATE INDEX IF NOT EXISTS "rfq_requests_org_id_status_idx"  ON "rfq_requests" ("org_id", "status");
CREATE INDEX IF NOT EXISTS "rfq_requests_created_by_idx"     ON "rfq_requests" ("created_by");
