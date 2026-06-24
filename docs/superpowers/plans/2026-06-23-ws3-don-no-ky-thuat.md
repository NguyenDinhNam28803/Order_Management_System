# WS-3: Dọn nợ kỹ thuật — Implementation Plan

> **For agentic workers:** Dùng superpowers:executing-plans (inline) để thực thi. Steps dùng checkbox `- [ ]`.

**Goal:** Repo sạch hơn: tách script debug khỏi `prisma/`, tự động gỡ unused imports (273 warning), thêm `client/.env.example`.

**Architecture:** 3 task độc lập, mỗi task 1 commit. Không đụng logic nghiệp vụ.

**Tech Stack:** Next.js 16, ESLint 9 (flat config), NestJS/Prisma scripts (ts-node).

## Global Constraints
- `npx tsc --noEmit` (client) 0 lỗi sau mỗi task.
- KHÔNG chạy `next build` khi `next dev` đang chạy chung `.next`.
- Mỗi task 1 commit nhỏ, prefix `chore:`.
- Chạy mọi lệnh client trong `d:/Order_management_system/client`, server trong `server`.

---

### Task 1: Thêm `client/.env.example`

**Files:**
- Create: `client/.env.example`

- [ ] **Step 1: Tạo file** với nội dung chính xác:

```bash
# Biến môi trường cho Next.js client (sao chép sang .env.local và điền giá trị)
# URL API backend (NestJS)
NEXT_PUBLIC_API_URL=http://localhost:5000
# URL WebSocket cho realtime notifications
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

- [ ] **Step 2: Xác nhận `.env.example` KHÔNG bị gitignore**

Run: `cd /d/Order_management_system/client && git check-ignore .env.example || echo "OK tracked"`
Expected: in `OK tracked` (nếu in `.env.example` nghĩa là bị ignore → sửa `.gitignore` cho phép `!.env.example`).

- [ ] **Step 3: Commit**

```bash
git add client/.env.example
git commit -m "chore(client): add .env.example with NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL"
```

---

### Task 2: Tự động gỡ unused imports (giảm phần lớn 273 warning)

**Lý do:** 273 warning chủ yếu là unused imports/vars. Tự động hóa bằng `eslint-plugin-unused-imports` an toàn & nhanh hơn sửa tay 260+ chỗ.

**Files:**
- Modify: `client/package.json` (devDependency)
- Modify: `client/eslint.config.mjs`

- [ ] **Step 1: Cài plugin**

Run: `cd /d/Order_management_system/client && npm i -D eslint-plugin-unused-imports`
Expected: cài thành công, xuất hiện trong devDependencies.

- [ ] **Step 2: Cấu hình rule trong `eslint.config.mjs`**

Sửa file thành (giữ nguyên phần có sẵn, thêm import + block rules):

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
```

- [ ] **Step 3: Chạy auto-fix (gỡ unused imports)**

Run: `cd /d/Order_management_system/client && npx eslint . --fix`
Expected: số warning giảm mạnh (unused imports bị gỡ tự động).

- [ ] **Step 4: Kiểm tra không vỡ type**

Run: `npx tsc --noEmit`
Expected: 0 lỗi. (Nếu lỗi do gỡ nhầm import dùng-qua-type, thêm lại import cụ thể đó.)

- [ ] **Step 5: Kiểm tra còn 0 ESLint error**

Run: `npx eslint . 2>&1 | tail -2`
Expected: `0 errors` (warning còn lại là unused assigned vars / react-hooks deps — chấp nhận hoặc dọn ở Task 2b).

- [ ] **Step 6: Commit**

```bash
git add client/package.json client/package-lock.json client/eslint.config.mjs client/app
git commit -m "chore(client): auto-remove unused imports via eslint-plugin-unused-imports"
```

---

### Task 2b (tùy chọn): Dọn unused assigned vars còn lại theo module

- [ ] **Step 1: Liệt kê warning còn lại**

Run: `npx eslint . 2>&1 | grep "no-unused-vars" | head -40`

- [ ] **Step 2:** Với mỗi biến/`useState` setter không dùng: xóa khai báo hoặc đổi tên thành `_prefix`. Sửa theo từng file, chạy `npx tsc --noEmit` sau mỗi vài file.

- [ ] **Step 3: Commit** `chore(client): clean remaining unused variables`

---

### Task 3: Tách script debug khỏi `prisma/`

**Bối cảnh:** `server/package.json` KHÔNG tham chiếu các script này (an toàn). Phân loại:
- **Xóa (throwaway debug):** `check_actual_prs.ts`, `check_approval_setup.ts`, `check_orgs.ts`, `check_users.ts`, `get_info.ts`, `list_prs.ts`, `test_conn.ts`, `verify_user.ts`
- **Giữ làm ops, chuyển sang `server/scripts/ops/`:** `reset_password.ts`, `cleanup_budget_duplicates.ts`, `export_training_data.ts`
- **Giữ nguyên:** mọi file `seed*.ts` (dữ liệu — sẽ gom ở WS-4).

**Files:**
- Delete: 8 file debug ở trên
- Create dir + move: `server/scripts/ops/{reset_password,cleanup_budget_duplicates,export_training_data}.ts`

- [ ] **Step 1: Kiểm tra không file nào import các script này**

Run: `cd /d/Order_management_system/server && grep -rlE "check_orgs|check_users|list_prs|get_info|test_conn|verify_user|check_actual_prs|check_approval_setup" src prisma | grep -v node_modules`
Expected: trống (không ai import) → an toàn xóa.

- [ ] **Step 2: Xóa 8 file debug**

```bash
cd /d/Order_management_system/server/prisma
rm check_actual_prs.ts check_approval_setup.ts check_orgs.ts check_users.ts get_info.ts list_prs.ts test_conn.ts verify_user.ts
```

- [ ] **Step 3: Tạo thư mục ops + di chuyển 3 script giữ lại**

```bash
mkdir -p /d/Order_management_system/server/scripts/ops
cd /d/Order_management_system/server/prisma
git mv reset_password.ts cleanup_budget_duplicates.ts export_training_data.ts ../scripts/ops/
```

- [ ] **Step 4: Sửa import path tương đối (prisma/ → scripts/ops/ sâu hơn 1 cấp nếu cần)**

Run: `grep -nE "from ['\"]\.\./src|from ['\"]\.\./" /d/Order_management_system/server/scripts/ops/*.ts`
Nếu có `../src/...` → đổi thành `../../src/...`. Nếu chỉ import `@prisma/client` (tuyệt đối) → không cần sửa.

- [ ] **Step 5: Verify 1 script ops vẫn chạy được (build TypeScript check)**

Run: `cd /d/Order_management_system/server && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "scripts/ops" || echo "ops scripts compile OK"`
Expected: `ops scripts compile OK`.

- [ ] **Step 6: Verify server build vẫn xanh**

Run: `cd /d/Order_management_system/server && npm run build 2>&1 | tail -3`
Expected: build thành công (nest build không gồm prisma scripts nên không bị ảnh hưởng).

- [ ] **Step 7: Commit**

```bash
cd /d/Order_management_system
git add -A server/prisma server/scripts
git commit -m "chore(server): remove throwaway debug scripts, move ops scripts to scripts/ops/"
```

---

## Self-review
- Mục tiêu WS-3 (debug scripts, warnings, env example) → Task 3, Task 2, Task 1. ✔
- Không placeholder: nội dung .env.example đầy đủ; cấu hình eslint đầy đủ; danh sách file xóa/giữ chính xác từ quét thật. ✔
- Rủi ro thấp: đã verify package.json không tham chiếu script debug; có step kiểm tra import trước khi xóa. ✔
