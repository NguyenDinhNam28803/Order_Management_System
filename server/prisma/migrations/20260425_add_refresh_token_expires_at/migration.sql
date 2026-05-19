-- AddColumn: refresh_token_expires_at on users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" TIMESTAMPTZ(6);

-- AddIndex: status-based indexes for filter-heavy queries
CREATE INDEX IF NOT EXISTS "goods_receipts_org_id_status_idx" ON "goods_receipts"("org_id", "status");
CREATE INDEX IF NOT EXISTS "supplier_invoices_org_id_status_idx" ON "supplier_invoices"("org_id", "status");
CREATE INDEX IF NOT EXISTS "budget_allocations_org_id_status_idx" ON "budget_allocations"("org_id", "status");
CREATE INDEX IF NOT EXISTS "budget_allocations_cost_center_id_status_idx" ON "budget_allocations"("cost_center_id", "status");
