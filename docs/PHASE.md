# Phase 8: Production Shared License Pool & Dynamic Vault Activation Engine

## 1. Bối Cảnh & Mục Tiêu Nghiệp Vụ (Context & Objective)

Sau phiên thẩm vấn chuyên sâu (/grill-me) cùng người dùng, hệ thống cần giải quyết bài toán bản chất kinh doanh thực tế của các tài khoản AI doanh nghiệp:
1. **Bản chất Per-Seat Licensing:** Các nhà cung cấp (OpenAI ChatGPT Team, Claude for Work, Google Workspace Gemini, Cursor Business) tính phí theo số lượng người dùng ($20 – $40/user/tháng). Nếu mua 1:1 cho toàn bộ nhân sự thì chi phí cực kỳ lãng phí.
2. **Cơ chế Shared License Pool:** Công ty mua một số lượng ghế hợp lý (ví dụ: 5 ghế), Admin cấu hình tài khoản doanh nghiệp đó vào **Kho Mật Mã Dùng Chung (`vault_credentials`)** trên Gateway với `maxConcurrency = 5`. Gateway điều phối phiên làm việc an toàn qua Upstash Redis, giúp 50–100 nhân viên dùng chung 5 ghế mà không bị nhà cung cấp khóa tài khoản.
3. **Cơ chế Kích hoạt Trực quan (Hybrid Template):**
   - Nếu công cụ có trong Catalog nhưng Admin chưa nạp tài khoản vào Vault: Hiển thị trạng thái `Chưa kích hoạt / Chờ Admin kết nối` (nút mở ứng dụng bị vô hiệu hóa an toàn, không để nhân viên nhảy vào URL rỗng).
   - Khi Admin nạp tài khoản vào Vault: Trở thành `SẴN SÀNG (X/Y ghế)` và cho phép nhân viên có quyền truy cập làm việc ngay.

**Mục tiêu Phase 8:**
1. Đồng bộ tài liệu kỹ thuật (`PRD.md`, `TECH_ARCHITECTURE.md`, `PLAN.md`, `PHASE.md`) chuẩn hóa 100% cơ chế Shared License Pool và Vòng đời kích hoạt Vault.
2. Bổ sung mục giải thích chuyên sâu trực quan tại trang **"Hệ Thống" (`/he-thong`)** về cách doanh nghiệp mua gói bản quyền, nạp vào Vault và chia sẻ ghế.
3. Nâng cấp giao diện thẻ công cụ trên **Trang Chủ (`/`)**: Phân biệt rành mạch giữa công cụ đã nạp Vault (`SẴN SÀNG (X/Y ghế)`) vs công cụ chưa nạp Vault (`Chưa kích hoạt / Chờ Admin kết nối`).

---

## 2. Tiêu Chí Nghiệm Thu (Definition of Done)

- [ ] **Đồng Bộ Tài Liệu 100%:** 4 file tài liệu chuẩn (`PRD.md`, `TECH_ARCHITECTURE.md`, `PLAN.md`, `PHASE.md`) phản ánh chính xác mô hình Shared License Pool và vòng đời Vault.
- [ ] **Cập Nhật Cẩm Nang Trực Quan (`/he-thong`):** Trang web hiển thị sơ đồ và hướng dẫn rõ ràng: Tại sao mua 5 ghế dùng cho 50 người, Admin nạp vào Vault thế nào và Gateway điều phối ra sao.
- [ ] **Nâng Cấp Giao Diện Trang Chủ (`/`):**
  - Thẻ công cụ có tài khoản Vault: Hiển thị số ghế thời gian thực, nút *"Mở công cụ ngay"*.
  - Thẻ công cụ chưa có tài khoản Vault: Hiển thị nhãn *"Chưa kích hoạt"* và hướng dẫn Admin kết nối tại `/admin`.
- [ ] **Giữ Vững 100% Zero Mock:** Không dùng class giả lập, kiểm tra `git grep -i "Mock"` = 0.
- [ ] **Kiểm Tra Build Thành Công:** `npx turbo build` hoàn tất với mã thoát 0.

---

## 3. Kế Hoạch Phân Rã Nhiệm Vụ (Task Breakdown)

### Nhóm 1: Nâng Cấp Logic Trang Chủ & Trạng Thái Kích Hoạt Vault
- [ ] Cập nhật `apps/web/src/app/page.tsx`:
  - Truy vấn thông tin `vaultCredentials` để xác định trạng thái kích hoạt thực tế của từng dịch vụ.
  - Render trạng thái công cụ:
    - Nếu đã có Vault: `SẴN SÀNG` + Tình trạng ghế (`X/Y người đang dùng`).
    - Nếu chưa có Vault: `Chờ Admin kết nối` + Vô hiệu hóa nút mở ứng dụng, gợi ý Admin vào `/admin` nạp tài khoản.

### Nhóm 2: Nâng Cấp Cẩm Nang Hệ Thống Nền Tảng (`/he-thong`)
- [ ] Cập nhật `apps/web/src/app/he-thong/page.tsx`:
  - Thêm phần minh họa trực quan: **"Mô Hình Bản Quyền Dùng Chung (Shared License Pool) & Cách Admin Kích Hoạt"**.
  - Giải thích rõ: Mua gói Team/Business theo ghế thế nào, Admin nạp vào Vault ra sao, và tại sao tiết kiệm chi phí mà không lo bị khóa tài khoản.

### Nhóm 3: Kiểm Chứng Kỹ Thuật & Nghiệm Thu
- [ ] Kiểm tra 0 mock: `git grep -i "Mock" apps/web/src/`.
- [ ] Kiểm tra TypeScript compilation: `npx tsc --project apps/web/tsconfig.json --noEmit`.
- [ ] Chạy `npx turbo build` đảm bảo mã thoát 0.
- [ ] Lập báo cáo nghiệm thu `docs/reports/PHASE-8-IMPLEMENTATION-REPORT.md`.
