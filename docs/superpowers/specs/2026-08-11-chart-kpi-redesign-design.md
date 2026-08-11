# Spec: Tái thiết kế biểu đồ tròn (Donut) + thẻ KPI dashboard

- **Ngày:** 2026-08-11
- **Trạng thái:** Đã duyệt, triển khai
- **Nhánh:** `feat/chart-kpi-redesign` (stack trên `chore/pause-frontend-ai`)
- **Người dùng mục tiêu:** admin quản trị thu mua — cần nhìn nhận nhanh, chính xác.

## 1. Mục tiêu

Giúp admin thu mua đọc biểu đồ tròn và thẻ KPI dễ hơn: hiển thị **giá trị thật** (không chỉ %), xử lý **vượt ngân sách**, bỏ **card lồng card**, và chuẩn hoá thẻ KPI dashboard. Không đụng bảng dữ liệu, không đụng trang marketing `about`.

## 2. Phạm vi

**Trong phạm vi:**
- Component `client/app/components/charts/DonutChart.tsx` (nâng cấp).
- 4 call-site dùng DonutChart: `page.tsx`, `manager/spend-tracking`, `reports/spend`, `finance/dashboard`.
- Component `client/app/components/charts/StatsCard.tsx` (chuẩn hoá nhẹ).

**Ngoài phạm vi:** ~56 trang bảng; `StatCard`/`StatGrid` của trang list (`components/shared`); `about/page.tsx` (recharts Pie marketing); nguồn dữ liệu (không re-wire query).

## 3. Audit chính xác (đã xác minh)

- Biểu đồ tròn thật = **1 component `DonutChart`** (SVG tự vẽ), dùng ở **4 trang** trên.
- Các `PieChart` ở `budget-planning`/`budget-allocation`/`page.tsx` là **icon lucide**, không phải biểu đồ.
- recharts `<Pie>` thật chỉ ở `about` (ngoài phạm vi).
- 2 KPI systems: `charts/StatsCard` (dashboard) vs `shared/StatCard` (list). Chỉ chuẩn hoá cái đầu.

## 4. Thiết kế

### 4.A. `DonutChart` — nâng cấp (tương thích ngược)

Props hiện có giữ nguyên: `data[]`, `title?`, `centerLabel?`, `centerValue?`, `size?`.

Props mới (đều optional):
- `valueFormatter?: (v: number) => string` — mặc định `v => v.toLocaleString('vi-VN')`. Trang tiền truyền `formatVNDCompact` (helper mới, xem 4.D).
- `bare?: boolean` — mặc định `false`. `true` = bỏ khung card tự thân (nền/border/padding) để nhúng vào card sẵn có.
- `showValues?: boolean` — mặc định `true`. Legend hiện giá trị đã format.

Hành vi mới:
1. **Legend** mỗi dòng: chấm màu · nhãn (truncate) · **giá trị format** · **%** (canh phải). Thêm dòng **"Tổng"** ở cuối legend.
2. **Giá trị âm** (vd `Còn lại` khi vượt ngân sách): kẹp cung hình học về 0 để không vỡ SVG; vẫn hiện giá trị âm thật trong legend; hiện **chip cảnh báo** "⚠ Vượt {số}" cạnh tổng.
3. **Center**: nếu không truyền `centerValue`, tự hiện tổng (đã format). Giữ `centerLabel`.
4. **A11y**: `role="img"` + `aria-label` tóm tắt; mỗi cung có `<title>` (nhãn + giá trị + %).
5. Giữ theme enterprise: nền trắng/`#F1F5F9`, border `#E2E8F0`, bo `rounded-xl`, không đổi palette.

### 4.B. Call-site

| Trang | Đổi |
|---|---|
| `manager/spend-tracking` | `bare` + `valueFormatter={formatVNDCompact}` → bỏ card lồng; legend hiện tiền |
| `reports/spend` | `bare` + `valueFormatter={formatVNDCompact}` → 1 card duy nhất |
| `page.tsx` | Giữ self-card; legend tự hiện số đếm (formatter mặc định) |
| `finance/dashboard` | Giữ self-card; số đếm hóa đơn hiện ở legend |

Không đổi mảng `data`/nguồn dữ liệu.

### 4.D. Helper mới `formatVNDCompact` (utils/formatUtils)

`formatVNDCompact(val)`: rút gọn tiền VND kiểu Việt — `≥1e9 → "X,X tỷ"`, `≥1e6 → "X tr"`, `≥1e3 → "Xk"`, còn lại số thường; xử lý Prisma Decimal qua `convertPrismaDecimal` như `formatVND`. Dùng cho legend + center của 2 trang tiền.

### 4.C. `StatsCard` — chuẩn hoá nhẹ (tương thích ngược)

- `value` thêm class `num-display` (mono) để thẳng cột số.
- `trend` thêm field optional `label?: string` (caption vd "so kỳ trước"); render nhỏ dưới/bên % trend.
- Trạng thái trend trung tính khi `value === 0`.
- Giữ nguyên mọi props/call-site cũ; các field mới opt-in.

## 5. Tương thích ngược

Mọi call-site hiện tại chạy nguyên không cần sửa; các cải tiến mặc định (legend hiện giá trị, tổng) áp dụng tự động và an toàn cho cả số đếm lẫn tiền.

## 6. Kiểm chứng

1. `client/` biên dịch sạch (Next dev đang chạy — hot reload không lỗi; hoặc `npm run build`).
2. Rà soát 4 trang donut: legend hiện **giá trị + %**, có dòng Tổng; `spend-tracking`/`reports/spend` chỉ còn **1 card**; ép một segment âm → thấy chip "Vượt".
3. Thẻ KPI dashboard: số canh mono thẳng cột; trend caption hiển thị nếu truyền.
4. Không có thay đổi ở bảng dữ liệu / trang About.

## 7. Rủi ro

- `formatVND` tham số 2 là `includeSymbol` (KHÔNG compact) → phải thêm helper `formatVNDCompact` riêng.
- `bare` phải không phá layout 2 card đang bọc (card cha giữ header/nền).
- Không tạo unused import/var gây cảnh báo mới.
