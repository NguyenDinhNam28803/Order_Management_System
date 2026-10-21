-- Thêm index cho các cột khóa ngoại được truy vấn thường xuyên.
-- PostgreSQL KHÔNG tự tạo index cho FK, nên mỗi join/filter theo các cột
-- này đều phải seq scan toàn bảng khi dữ liệu lớn dần.
-- Chỉ gồm lệnh CREATE INDEX (additive, không phá hủy dữ liệu).

-- CreateIndex
CREATE INDEX "organization_documents_org_id_idx" ON "organization_documents"("org_id");

-- CreateIndex
CREATE INDEX "supplier_vetting_requests_org_id_idx" ON "supplier_vetting_requests"("org_id");

-- CreateIndex
CREATE INDEX "supplier_vetting_requests_supplier_id_idx" ON "supplier_vetting_requests"("supplier_id");

-- CreateIndex
CREATE INDEX "cost_centers_dept_id_idx" ON "cost_centers"("dept_id");

-- CreateIndex
CREATE INDEX "users_org_id_idx" ON "users"("org_id");

-- CreateIndex
CREATE INDEX "users_dept_id_idx" ON "users"("dept_id");

-- CreateIndex
CREATE INDEX "approval_matrix_rules_created_by_idx" ON "approval_matrix_rules"("created_by");

-- CreateIndex
CREATE INDEX "product_categories_org_id_idx" ON "product_categories"("org_id");

-- CreateIndex
CREATE INDEX "products_org_id_idx" ON "products"("org_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "purchase_requisitions_dept_id_idx" ON "purchase_requisitions"("dept_id");

-- CreateIndex
CREATE INDEX "pr_items_category_id_idx" ON "pr_items"("category_id");

-- CreateIndex
CREATE INDEX "pr_attachments_pr_id_idx" ON "pr_attachments"("pr_id");

-- CreateIndex
CREATE INDEX "rfq_requests_pr_id_idx" ON "rfq_requests"("pr_id");

-- CreateIndex
CREATE INDEX "rfq_items_rfq_id_idx" ON "rfq_items"("rfq_id");

-- CreateIndex
CREATE INDEX "rfq_items_category_id_idx" ON "rfq_items"("category_id");

-- CreateIndex
CREATE INDEX "rfq_suppliers_supplier_id_idx" ON "rfq_suppliers"("supplier_id");

-- CreateIndex
CREATE INDEX "rfq_qa_threads_supplier_id_idx" ON "rfq_qa_threads"("supplier_id");

-- CreateIndex
CREATE INDEX "rfq_qa_threads_rfq_id_idx" ON "rfq_qa_threads"("rfq_id");

-- CreateIndex
CREATE INDEX "rfq_quotations_supplier_id_idx" ON "rfq_quotations"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_orders_rfq_id_idx" ON "purchase_orders"("rfq_id");

-- CreateIndex
CREATE INDEX "purchase_orders_pr_id_idx" ON "purchase_orders"("pr_id");

-- CreateIndex
CREATE INDEX "purchase_orders_dept_id_idx" ON "purchase_orders"("dept_id");

-- CreateIndex
CREATE INDEX "purchase_orders_contract_id_idx" ON "purchase_orders"("contract_id");

-- CreateIndex
CREATE INDEX "purchase_orders_buyer_id_idx" ON "purchase_orders"("buyer_id");

-- CreateIndex
CREATE INDEX "po_item_sources_pr_id_idx" ON "po_item_sources"("pr_id");

-- CreateIndex
CREATE INDEX "po_amendments_created_by_idx" ON "po_amendments"("created_by");

-- CreateIndex
CREATE INDEX "po_shipment_tracking_po_id_idx" ON "po_shipment_tracking"("po_id");

-- CreateIndex
CREATE INDEX "root_cause_analyses_supplier_id_idx" ON "root_cause_analyses"("supplier_id");

-- CreateIndex
CREATE INDEX "root_cause_analyses_po_id_idx" ON "root_cause_analyses"("po_id");

-- CreateIndex
CREATE INDEX "grn_items_grn_id_idx" ON "grn_items"("grn_id");

-- CreateIndex
CREATE INDEX "grn_photos_grn_id_idx" ON "grn_photos"("grn_id");

-- CreateIndex
CREATE INDEX "return_to_vendor_supplier_id_idx" ON "return_to_vendor"("supplier_id");

-- CreateIndex
CREATE INDEX "return_to_vendor_po_id_idx" ON "return_to_vendor"("po_id");

-- CreateIndex
CREATE INDEX "return_to_vendor_created_by_idx" ON "return_to_vendor"("created_by");

-- CreateIndex
CREATE INDEX "return_to_vendor_grn_id_idx" ON "return_to_vendor"("grn_id");

-- CreateIndex
CREATE INDEX "supplier_invoices_grn_id_idx" ON "supplier_invoices"("grn_id");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "debit_credit_notes_invoice_id_idx" ON "debit_credit_notes"("invoice_id");

-- CreateIndex
CREATE INDEX "escrow_accounts_org_id_idx" ON "escrow_accounts"("org_id");

-- CreateIndex
CREATE INDEX "escrow_transactions_po_id_idx" ON "escrow_transactions"("po_id");

-- CreateIndex
CREATE INDEX "escrow_transactions_created_by_idx" ON "escrow_transactions"("created_by");

-- CreateIndex
CREATE INDEX "escrow_transactions_invoice_id_idx" ON "escrow_transactions"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_supplier_id_idx" ON "payments"("supplier_id");

-- CreateIndex
CREATE INDEX "payments_po_id_idx" ON "payments"("po_id");

-- CreateIndex
CREATE INDEX "payments_created_by_idx" ON "payments"("created_by");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "contracts_org_id_idx" ON "contracts"("org_id");

-- CreateIndex
CREATE INDEX "contracts_supplier_id_idx" ON "contracts"("supplier_id");

-- CreateIndex
CREATE INDEX "contracts_created_by_idx" ON "contracts"("created_by");

-- CreateIndex
CREATE INDEX "contract_milestones_contract_id_idx" ON "contract_milestones"("contract_id");

-- CreateIndex
CREATE INDEX "buyer_ratings_supplier_id_idx" ON "buyer_ratings"("supplier_id");

-- CreateIndex
CREATE INDEX "disputes_po_id_idx" ON "disputes"("po_id");

-- CreateIndex
CREATE INDEX "disputes_invoice_id_idx" ON "disputes"("invoice_id");

-- CreateIndex
CREATE INDEX "disputes_grn_id_idx" ON "disputes"("grn_id");

-- CreateIndex
CREATE INDEX "dispute_evidence_org_id_idx" ON "dispute_evidence"("org_id");

-- CreateIndex
CREATE INDEX "dispute_messages_org_id_idx" ON "dispute_messages"("org_id");

-- CreateIndex
CREATE INDEX "notifications_org_id_idx" ON "notifications"("org_id");

-- CreateIndex
CREATE INDEX "audit_logs_org_id_idx" ON "audit_logs"("org_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "budget_allocations_category_id_idx" ON "budget_allocations"("category_id");

-- CreateIndex
CREATE INDEX "budget_allocations_dept_id_idx" ON "budget_allocations"("dept_id");

-- CreateIndex
CREATE INDEX "budget_allocations_created_by_idx" ON "budget_allocations"("created_by");

-- CreateIndex
CREATE INDEX "webhook_configs_org_id_idx" ON "webhook_configs"("org_id");

-- CreateIndex
CREATE INDEX "webhook_configs_created_by_idx" ON "webhook_configs"("created_by");

-- CreateIndex
CREATE INDEX "document_embeddings_source_id_idx" ON "document_embeddings"("source_id");

-- CreateIndex
CREATE INDEX "quotation_requests_rfq_id_idx" ON "quotation_requests"("rfq_id");

-- CreateIndex
CREATE INDEX "quotation_requests_category_id_idx" ON "quotation_requests"("category_id");

-- CreateIndex
CREATE INDEX "quotation_requests_pr_id_idx" ON "quotation_requests"("pr_id");

-- CreateIndex
CREATE INDEX "quotation_requests_requester_id_idx" ON "quotation_requests"("requester_id");

-- CreateIndex
CREATE INDEX "supplier_categories_category_id_idx" ON "supplier_categories"("category_id");

-- CreateIndex
CREATE INDEX "budget_override_requests_pr_id_idx" ON "budget_override_requests"("pr_id");

