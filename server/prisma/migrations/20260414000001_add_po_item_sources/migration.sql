-- Migration: Thêm bảng po_item_sources để hỗ trợ tính năng gộp PO từ nhiều PR
-- Mỗi row = 1 PR item đóng góp vào 1 PO item trong PO gộp

CREATE TABLE "po_item_sources" (
  "id"              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  "po_item_id"      UUID        NOT NULL,
  "pr_item_id"      UUID        NOT NULL,
  "pr_id"           UUID        NOT NULL,
  "contributed_qty" DECIMAL(12,3) NOT NULL,
  "cost_center_id"  UUID,
  "created_at"      TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  CONSTRAINT "po_item_sources_pkey" PRIMARY KEY ("id"),

  -- Khi PoItem bị xóa thì xóa theo (cascade)
  CONSTRAINT "po_item_sources_po_item_id_fkey"
    FOREIGN KEY ("po_item_id") REFERENCES "po_items"("id") ON DELETE CASCADE,

  CONSTRAINT "po_item_sources_pr_item_id_fkey"
    FOREIGN KEY ("pr_item_id") REFERENCES "pr_items"("id"),

  CONSTRAINT "po_item_sources_pr_id_fkey"
    FOREIGN KEY ("pr_id") REFERENCES "purchase_requisitions"("id"),

  CONSTRAINT "po_item_sources_cost_center_id_fkey"
    FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id")
);

-- Index để tra cứu nhanh theo PO item hoặc theo PR
CREATE INDEX "po_item_sources_po_item_id_idx" ON "po_item_sources"("po_item_id");
CREATE INDEX "po_item_sources_pr_id_idx"      ON "po_item_sources"("pr_id");
