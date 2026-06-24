# Nâng "Tính thực tế" Dự án OMS — Lộ trình tổng (Master Roadmap)

> **For agentic workers:** Đây là tài liệu lộ trình tổng cho 4 workstream độc lập. Mỗi workstream sẽ có kế hoạch thực thi chi tiết (bite-sized TDD) riêng trước khi code. Dùng superpowers:subagent-driven-development hoặc superpowers:executing-plans khi triển khai từng workstream.

**Goal:** Đưa dự án từ mức "đồ án/demo xuất sắc" lên gần "production-ready" bằng 4 hướng: thay mock→API thật, viết test cho luồng lõi, dọn nợ kỹ thuật, seed dữ liệu thực tế quy mô lớn.

**Architecture:** 4 workstream tách rời, mỗi cái tự verify được bằng `next build` (client) / `npm test` (server). Không workstream nào phá build của workstream khác.

**Tech Stack:** NestJS + Prisma + PostgreSQL (server), Next.js 16 + Tailwind v4 (client), Jest (test backend).

## Global Constraints
- `next build` PASS và `tsc --noEmit` 0 lỗi sau MỖI workstream (tiêu chí đã dùng xuyên suốt rollout UI).
- `npm run build` chỉ fail vì ESLint **error** (không phải warning).
- KHÔNG chạy `next build` khi `next dev` đang dùng chung `.next` (gây lẫn cache → 404). Luôn `rm -rf .next` trước khi đổi chế độ.
- Decimal trả về client đã là `number` nhờ `DecimalInterceptor` — không cần workaround per-page.
- Mỗi thay đổi 1 commit nhỏ; không gộp nhiều workstream vào 1 commit.

## Thứ tự khuyến nghị (có lý do phụ thuộc)
1. **WS-3 Dọn nợ kỹ thuật** (nhanh, rủi ro thấp, làm sạch nền trước khi đo lường) — ~0.5–1 ngày
2. **WS-4 Seed dữ liệu thực tế** (làm trước test để test/perf có data thật) — ~1 ngày
3. **WS-2 Test luồng lõi** (cần code ổn định + data seed) — ~3–5 ngày
4. **WS-1 Thay mock→API + bỏ `***`** (user-visible, làm sau khi có test bảo vệ) — ~3–4 ngày

---

## WS-1 — Thay dữ liệu mock bằng API thật + bỏ `***`

**Mục tiêu:** Mọi trang nghiệp vụ đọc dữ liệu thật từ backend; bỏ ID giả `***`.

**Phạm vi (file thật đã quét):**

*Nhóm A — mock cứng, cần nối API:*
- `manager/po-approvals/page.tsx` — đang `useState([{ mock PO }])`; nối `fetchPendingPOApprovals()` (hoặc lọc `pos` theo status WAITING_MANAGER) + `approvePO/rejectPO` thật.
- `procurement/amendments/page.tsx` — `mockAmendments`; cần endpoint amendments thật (BE có thể chưa có → xem WS phụ thuộc backend).
- `manager/budget-alerts/page.tsx`, `supplier/dashboard/page.tsx`, `supplier/page.tsx` — kiểm tra & thay nguồn mock.

*Nhóm B — dùng context thật nhưng còn fallback/mock debug:*
- `po/page.tsx`, `procurement/pos/page.tsx`, `supplier/po/page.tsx` — bỏ nhánh fallback mock/`showAll` debug.

*Nhóm C — bespoke sim (GIỮ, không đụng):*
- `procurement/rfq-sim/page.tsx`, `finance/matching/page.tsx` (nếu là demo mô phỏng) — xác nhận rồi để nguyên.

*Bỏ `***` (20 file):* tạo helper `shortId(id?: string)` trong `client/app/utils/formatUtils.ts` trả `#abcd1234`; thay các `***`/`PR-***`/`RFQ-***`/`***-***-***` bằng `shortId(realId)` hoặc bỏ cột nếu không có dữ liệu. File: invoices/[id], finance/invoices, finance/matching, procurement/pos, procurement/amendments, procurement/quotations, po/consolidate, pr/page, rfq/quote, sourcing, sourcing/rfq-create, supplier/page, supplier/po, supplier/rfq, users, warehouse/dashboard, admin/notifications, page, components/RoleDashboard, components/RFQInteraction.

**Phụ thuộc:** một số mock (amendments) cần API backend tương ứng — nếu BE thiếu, tách thành sub-task "thêm endpoint" hoặc giữ mock + đánh dấu `// DEMO`.

**Cách verify:** mỗi trang sau khi nối API → load thật có dữ liệu; `grep -rl '\*\*\*' client/app` giảm về ~0 (trừ bespoke); `tsc` + `build` xanh.

**Effort:** ~3–4 ngày. **Rủi ro:** trung bình (phụ thuộc độ sẵn sàng của API).

---

## WS-2 — Test thực chất cho luồng lõi

**Mục tiêu:** Có test bảo vệ các luồng nghiệp vụ quan trọng nhất (hiện 35/36 spec là stub `should be defined`).

**Phạm vi (ưu tiên theo độ phức tạp & rủi ro, dùng mẫu sẵn có invoice/rfq/grn spec):**
1. `approval-module/approval-module.service.ts` (1038 dòng, 0 test thật) — phê duyệt đa cấp: chọn approver theo rule, chuyển trạng thái, reject/escalate.
2. `budget-module/budget-module.service.ts` (1193 dòng) — phân bổ, cam kết, kiểm tra vượt định mức.
3. `common/automation/automation.service.ts` (1091 dòng) — chuỗi tự động PO→GRN→Invoice.
4. `pomodule`, `payment-module`, `invoice-module` (đã có 269 dòng — mở rộng nhánh lỗi/biên).

**Cách làm (per service, theo mẫu `invoice-module.service.spec.ts`):**
- Mock `PrismaService` (jest mock), test từng method: happy path + biên (vượt ngân sách, thiếu approver, trạng thái sai).
- Mục tiêu coverage luồng lõi ≥ 60% (đo bằng `jest --coverage`).

**Cách verify:** `cd server && npm test` xanh; coverage report cho 4 service lõi.

**Effort:** ~3–5 ngày. **Rủi ro:** thấp (không đổi code production, chỉ thêm test — có thể lộ bug ẩn = giá trị).

---

## WS-3 — Dọn nợ kỹ thuật

**Mục tiêu:** Repo sạch, không lẫn script scratch, giảm cảnh báo lint.

**Task cụ thể:**
1. **Tách script debug khỏi `prisma/`:** chuyển `check_actual_prs, check_approval_setup, check_orgs, check_users, get_info, list_prs, verify_user, test_conn, reset_password, cleanup_budget_duplicates, export_training_data` → `server/scripts/dev/` (hoặc xóa nếu không dùng). Giữ lại `seed*` (dữ liệu) nhưng gom vào `seed-all.ts`.
2. **Dọn ~300 ESLint warning** (unused imports/vars) toàn client — chạy `npx eslint . --fix` cho phần auto-fix được (14 fixable) + sửa tay phần còn lại theo module.
3. **Thêm `client/.env.example`** (liệt kê `NEXT_PUBLIC_API_URL`...).
4. **Bỏ `eslint`/`tsc` noise:** cân nhắc bật `eslint.ignoreDuringBuilds=false` (đã mặc định) để CI bắt lỗi.

**Cách verify:** `prisma/` chỉ còn seed + schema; `npx eslint .` → 0 error, warning giảm rõ; `next build` xanh.

**Effort:** ~0.5–1 ngày. **Rủi ro:** rất thấp.

---

## WS-4 — Seed dữ liệu thực tế quy mô lớn (perf)

**Mục tiêu:** Có bộ dữ liệu lớn để kiểm thử hiệu năng bảng/pagination + 3-way matching thực tế.

**Task cụ thể:**
1. Gom ~40 script `seed_*` rời rạc thành pipeline `seed-all.ts` idempotent (org → users → products → PR → RFQ → quote → PO → GRN → invoice → payment).
2. Thêm `seed-bulk.ts` sinh số lượng lớn (vd 1.000 PR, 2.000 PO, 5.000 invoice) bằng faker để đo pagination/sort/search client + query backend.
3. Đo: thời gian load trang list lớn (đã có client pagination 10–12/trang nên render OK; kiểm tra API trả full vs cần server-pagination).
4. Nếu list lớn chậm → đánh dấu trang cần chuyển **server-side pagination** (DataTable đã thiết kế interface sẵn sàng nâng cấp).

**Cách verify:** `npx ts-node prisma/seed-bulk.ts` chạy xong; mở trang list lớn → đo TTFB/render; ghi nhận trang nào cần server pagination.

**Effort:** ~1 ngày. **Rủi ro:** thấp (chỉ dữ liệu dev).

---

## Self-review (đã rà)
- 4 mục tiêu user nêu → ánh xạ đủ: mock→API + bỏ *** (WS-1), test luồng lõi (WS-2), dọn debug+warnings (WS-3), seed perf (WS-4). ✔
- Không placeholder mơ hồ: mỗi WS có file/script/service thật + cách verify. ✔
- Phụ thuộc đã nêu: WS-1 phụ thuộc sẵn sàng API; WS-2 nên sau WS-4 (data). ✔
