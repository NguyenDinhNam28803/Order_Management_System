# Spec: Tạm dừng tính năng AI (frontend)

- **Ngày:** 2026-08-11
- **Trạng thái:** Đã duyệt, triển khai
- **Phạm vi:** Chỉ frontend (`client/`). Backend `server/src/rag/*` giữ nguyên.

## 1. Mục tiêu

Tạm dừng (không xoá) toàn bộ tính năng AI ở frontend. Bật lại phải dễ — đổi đúng **một** giá trị cờ. Khi AI tắt, các điểm vào AI vẫn hiển thị nhưng ở trạng thái **disabled**, hover hiện thông báo _"Tính năng AI đang trong quá trình phát triển"_.

## 2. Quyết định thiết kế

| Vấn đề | Quyết định |
|--------|-----------|
| Cơ chế | Cờ trung tâm dạng constant (không dùng env var, không xoá code) |
| Phạm vi | Chỉ frontend; không đụng backend `/rag` |
| Hiển thị | Giữ điểm vào, làm disabled + tooltip "đang phát triển" (không ẩn hẳn) |
| Khôi phục | Đổi `AI_ENABLED: true` là bật lại toàn bộ |

## 3. Thành phần mới

### 3.1 `client/app/config/features.ts`
```ts
export const FEATURES = { AI_ENABLED: false } as const;
export const AI_DISABLED_MESSAGE = "Tính năng AI đang trong quá trình phát triển";
```

### 3.2 `client/app/components/AiDisabledNotice.tsx`
Component placeholder dùng chung cho các **trang AI-only** (khi vào bằng URL trực tiếp). Hiển thị một thông báo gọn, có nút "Quay lại trang chủ". Dùng lại primitives/typography sẵn có để đồng bộ giao diện.

## 4. Sáu điểm vào AI — hành vi khi `AI_ENABLED = false`

Tất cả đều import và gate bằng `FEATURES.AI_ENABLED`; tooltip dùng `AI_DISABLED_MESSAGE`.

| # | File | Hành vi khi tắt |
|---|------|------------------|
| 1 | `client/app/components/GlobalAISearch.tsx` | Nút nổi vẫn hiện nhưng disabled (mờ, `cursor-not-allowed`), `title = message`; click **không** mở modal; **vô hiệu hoá** listener phím tắt Ctrl/⌘+K. Không mount RAGChat/AIPrGenerator. |
| 2 | `client/app/pr/create/page.tsx` | Tab "Tạo bằng AI Chat" disabled + badge "Đang phát triển", `title = message`; ép `activeTab` luôn = `manual`; hàm gọi `/rag/generate-pr-draft` không chạy. |
| 3 | `client/app/procurement/rfq/create/page.tsx` | Chặn `useEffect` auto-gọi `fetchAiSuggestions()`; hàm `fetchAiSuggestions` early-return; nút "Chạy lại gợi ý AI" disabled + tooltip; khu vực trạng thái AI hiện `message`. Không gọi `/rag/query`. |
| 4 | `client/app/po/consolidate/page.tsx` | Chặn `useEffect` auto-trigger khi chọn ≥2 PR; `fetchAiSuggestions` early-return; panel AI hiện `message`. Không gọi `/rag/query`. |
| 5 | `client/app/components/Sidebar.tsx` | Mục "AI Admin / RAG Sync" render ở trạng thái disabled (không điều hướng) + tooltip `message`. |
| 6 | `client/app/ai-report/page.tsx` và `client/app/admin/ai-sync/page.tsx` | Nếu `!AI_ENABLED`, render `<AiDisabledNotice />` thay cho nội dung AI. |

## 5. Không đụng tới

- Backend `server/src/rag/*`.
- Dead code không được import ở đâu: `client/app/components/SmartSearch.tsx`, `client/app/components/SupplierSuggestionWidget.tsx`.
- Không xoá logic AI nào — chỉ thêm nhánh gate.

## 6. Kiểm chứng

1. `client/`: build + lint pass (chú ý không tạo biến/He import thừa gây lỗi lint).
2. Rà soát: 6 điểm vào đều disabled + tooltip đúng nội dung; khi flag off không có request nào tới `/rag` (kiểm qua Network / đọc code path).
3. Đổi `AI_ENABLED: true` → mọi thứ hoạt động lại như cũ (không bị xoá).

## 7. Rủi ro

- Một số điểm vào tự chạy khi load (rfq/create, po/consolidate) — phải gate **cả** `useEffect` lẫn thân hàm, tránh gọi mạng thừa.
- Lint `no-unused-vars`: sau khi gate, có thể còn state/handler AI "chưa dùng" — giữ nguyên code cũ trong nhánh `AI_ENABLED === true` để không phát sinh unused.
