# Task Tracking: Phase 3 — Department Budget & Quota Governance

Tài liệu theo dõi tiến độ nhiệm vụ cho Phase 3, bám sát 100% phân rã công việc từ [docs/PHASE.md](./docs/PHASE.md). Không tự thêm task ngoài phạm vi.

---

## Nhóm 1: Cơ Sở Dữ Liệu Phòng Ban & Migration (Data & Schema)
- [x] Định nghĩa schema Drizzle bảng `departments` và thêm `departmentId` vào `employees` (`apps/web/src/db/schema.ts`)
- [x] Cập nhật migration script `scripts/migrate.ts` tạo bảng `departments` và cột `department_id` trong `employees`
- [x] Thực thi `npm run db:migrate` áp dụng lên Neon PostgreSQL thật
- [x] Cập nhật script `scripts/verify-db.ts` hỗ trợ xác thực bảng departments

## Nhóm 2: Đơn Giá Dịch Vụ & Budget Governance Engine (Cost Calculation & Quota)
- [x] Cập nhật `apps/web/src/lib/catalog.ts` bổ sung `costPerLaunch` cho từng công cụ AI
- [x] Xây dựng module tính toán ngân sách `apps/web/src/lib/budget.ts` tính toán chi tiêu, % sử dụng và trạng thái ngưỡng (`NORMAL`, `WARNING`, `EXCEEDED`)
- [x] Cập nhật Launch Gateway `/api/launch/[grantId]` ghi audit log `BUDGET_THRESHOLD_ALERT` khi phòng ban đạt ngưỡng cảnh báo

## Nhóm 3: Giao Diện Quản Trị Phòng Ban & Ngân Sách (Admin Portal Management)
- [x] Mở rộng giao diện `/admin`:
  - Thêm thẻ thống kê ngân sách tổng quan (Tổng ngân sách, Chi phí đã dùng, Số phòng ban cảnh báo)
  - Thêm biểu mẫu Tạo phòng ban mới (`handleCreateDepartment`)
  - Thêm chức năng Gán phòng ban cho nhân viên (`handleAssignDepartment`)
  - Thêm bảng chi tiết Quản lý ngân sách phòng ban kèm Progress Bar trực quan và cảnh báo màu sắc (Normal / Warning / Exceeded)
  - Bổ sung hiển thị thông tin Phòng ban trong danh bạ nhân viên Registered Employees

## Nhóm 4: Giao Diện Phía Nhân Viên (Employee UI Visibility)
- [x] Cập nhật trang chủ `/`: Hiển thị phòng ban trực thuộc và thanh tiến trình ngân sách AI của bộ phận
- [x] Cảnh báo trạng thái ngân sách phòng ban và đơn giá ước tính trên thẻ khởi chạy công cụ AI

## Nhóm 5: Kiểm Chứng & Nghiệm Thu Thực Tế (Verification)
- [ ] Chạy `npx turbo build` xác nhận zero lỗi TypeScript / Lint
- [ ] Chạy kiểm tra rà soát `git grep -i "Mock" apps/web/src/` cho ra 0 kết quả
- [ ] Tạo phòng ban mẫu (`Engineering`, `Marketing`), gán nhân viên vào phòng ban trên Neon PostgreSQL
- [ ] Khởi chạy công cụ AI, xác nhận chi phí phòng ban tăng lên tương ứng và audit log được lưu vết
