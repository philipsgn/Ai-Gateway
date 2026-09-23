# Active Phase Specification (PHASE)
## Giai Đoạn 3: Department Budget & Quota Governance
### Quản Trị Chi Phí & Định Mức Ngân Sách AI Theo Phòng Ban

---

## 1. Mục Tiêu Duy Nhất Của Phase

> Thiết lập cơ chế kiểm soát ngân sách và định mức sử dụng AI theo phòng ban (Department Budget & Quota Governance): Quản trị viên có thể tạo phòng ban, thiết lập trần chi phí hàng tháng, gán nhân viên vào phòng ban, theo dõi chi phí sử dụng AI phát sinh thực tế từ các lượt khởi chạy, và tự động cảnh báo các ngưỡng ngân sách (80%, 100%) trên hạ tầng Neon PostgreSQL thật.

---

## 2. Phạm Vi Thực Hiện (In Scope)

1. **Cơ Cấu Tổ Chức & Phòng Ban (Department Hierarchy):**
   - Tạo bảng `departments` trong PostgreSQL (`id`, `name`, `code`, `monthly_budget_usd`, `currency`, `created_at`).
   - Mở rộng bảng `employees`: Thêm liên kết khóa ngoại `department_id` tham chiếu tới bảng `departments`.
   - Migration an toàn qua `scripts/migrate.ts` lên Neon PostgreSQL thật.
2. **Quota & Budget Engine (Mô Hình Tính Chi Phí Thực Tế):**
   - Bổ sung đơn giá ước tính tiêu thụ vào danh mục dịch vụ AI (`catalog.ts`):
     - `ChatGPT Team`: $0.10 / lượt
     - `Claude 3.5 Sonnet Pro`: $0.15 / lượt
     - `Cursor Pro / Business`: $0.20 / lượt
     - `Gemini Advanced`: $0.08 / lượt
     - `GitHub Copilot Enterprise`: $0.12 / lượt
     - `Midjourney Organization`: $0.25 / lượt
   - Xây dựng logic tính toán tổng chi phí đã tiêu thụ của từng phòng ban dựa trên số lượt khởi chạy (`access_count`) của các nhân viên thuộc phòng ban đó.
   - Phân loại trạng thái ngân sách:
     - Dưới 80%: `NORMAL` (An toàn - Xanh)
     - Từ 80% đến dưới 100%: `WARNING` (Cảnh báo tiệm cận trần - Vàng)
     - Từ 100% trở lên: `EXCEEDED` (Vượt hạn mức - Đỏ)
3. **Cổng Quản Trị Ngân Sách Phòng Ban (Admin Department & Budget Portal):**
   - Khu vực quản lý phòng ban tại `/admin`:
     - Thống kê tổng quan: Tổng ngân sách công ty, Tổng chi phí AI đã dùng tháng này, Số phòng ban tiệm cận hoặc vượt trần ngân sách.
     - Biểu mẫu Tạo phòng ban mới: Tên phòng ban, Mã phòng ban (ENG, MKT, HR...), Hạn mức ngân sách tháng ($).
     - Biểu mẫu Gán nhân viên vào phòng ban (Server Action `handleAssignDepartment`).
     - Bảng Quản lý Phòng Ban: Hiển thị tên, mã, số nhân viên, hạn mức tháng, chi phí đã sử dụng, thanh tiến trình ngân sách (Progress bar) đổi màu theo ngưỡng, và nút cập nhật hạn mức.
4. **Hiển Thị Ngân Sách Phía Nhân Viên (Employee Budget Visibility):**
   - Trên Dashboard trang chủ `/`: Hiển thị phòng ban trực thuộc của nhân viên và trạng thái ngân sách AI của bộ phận đó.
   - Khi nhân viên khởi chạy AI qua Gateway: Nếu phòng ban đã chạm ngưỡng 80% hoặc 100%, ghi nhận sự kiện cảnh báo `BUDGET_THRESHOLD_ALERT` vào bảng `audit_logs`.
5. **Kiểm Chứng & Báo Cáo Nghiệm Thu:**
   - Script `scripts/verify-db.ts` truy vấn xác thực các bảng `departments`, `employees` (với `department_id`), và các bản ghi kiểm toán ngân sách.

---

## 3. Ngoài Phạm Vi (Out of Scope)

- ❌ Không tích hợp cổng thanh toán Stripe/PayPal (chỉ quản trị định mức ngân sách nội bộ doanh nghiệp).
- ❌ Không xây dựng kho lưu trữ credential dùng chung bí mật (thuộc Phase 4 Vault).
- ❌ Không xuất chứng chỉ ISO/SOC 2 (thuộc Phase 5 Compliance).

---

## 4. Kế Hoạch Nhiệm Vụ Chi Tiết (Task Breakdown)

### Nhóm 1: Cơ Sở Dữ Liệu Phòng Ban & Migration (Data & Schema)
- [ ] Định nghĩa schema Drizzle bảng `departments` và thêm `departmentId` vào `employees` (`apps/web/src/db/schema.ts`)
- [ ] Cập nhật migration script `scripts/migrate.ts` tạo bảng `departments` và cột `department_id` trong `employees`
- [ ] Thực thi `npm run db:migrate` áp dụng lên Neon PostgreSQL thật
- [ ] Cập nhật script `scripts/verify-db.ts` hỗ trợ xác thực bảng departments

### Nhóm 2: Đơn Giá Dịch Vụ & Budget Governance Engine (Cost Calculation & Quota)
- [ ] Cập nhật `apps/web/src/lib/catalog.ts` bổ sung `costPerLaunch` cho từng công cụ AI
- [ ] Xây dựng module tính toán ngân sách `apps/web/src/lib/budget.ts` tính toán chi tiêu, % sử dụng và trạng thái ngưỡng (`NORMAL`, `WARNING`, `EXCEEDED`)
- [ ] Cập nhật Launch Gateway `/api/launch/[grantId]` ghi audit log `BUDGET_THRESHOLD_ALERT` khi phòng ban đạt ngưỡng cảnh báo

### Nhóm 3: Giao Diện Quản Trị Phòng Ban & Ngân Sách (Admin Portal Management)
- [ ] Mở rộng giao diện `/admin`:
  - Thêm thẻ thống kê ngân sách tổng quan
  - Thêm biểu mẫu Tạo phòng ban mới (`handleCreateDepartment`)
  - Thêm chức năng Gán phòng ban cho nhân viên (`handleAssignDepartment`)
  - Thêm bảng chi tiết Quản lý ngân sách phòng ban kèm Progress Bar trực quan và cảnh báo màu sắc

### Nhóm 4: Giao Diện Phía Nhân Viên (Employee UI Visibility)
- [ ] Cập nhật trang chủ `/`: Hiển thị phòng ban trực thuộc và thanh tiến trình ngân sách AI của bộ phận
- [ ] Cảnh báo trạng thái ngân sách phòng ban trên thẻ khởi chạy công cụ AI

### Nhóm 5: Kiểm Chứng & Nghiệm Thu Thực Tế (Verification)
- [ ] Chạy `npx turbo build` xác nhận zero lỗi TypeScript / Lint
- [ ] Chạy kiểm tra rà soát `git grep -i "Mock" apps/web/src/` cho ra 0 kết quả
- [ ] Tạo phòng ban mẫu (`Engineering`, `Marketing`), gán nhân viên vào phòng ban trên Neon PostgreSQL
- [ ] Khởi chạy công cụ AI, xác nhận chi phí phòng ban tăng lên tương ứng và audit log được lưu vết
