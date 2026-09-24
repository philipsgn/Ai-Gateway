# Task Tracking: Phase 9 — Interactive Access Request & Approval Workflow

Tài liệu theo dõi tiến độ nhiệm vụ cho Phase 9, bám sát 100% phân rã công việc từ [docs/PHASE.md](./docs/PHASE.md). Không tự thêm task ngoài phạm vi.

---

## Nhóm 1: Cơ Sở Dữ Liệu & Schema Migration
- [x] Cập nhật `apps/web/src/db/schema.ts`: Khai báo bảng `accessRequests` và types `AccessRequest`, `NewAccessRequest`.
- [x] Cập nhật `scripts/migrate.ts`: Thêm migration tạo bảng `access_requests` và 3 indexes trên Neon PostgreSQL.
- [x] Chạy migration script thật trên Neon PostgreSQL: Table `access_requests` và indexes tạo thành công.

## Nhóm 2: Nâng Cấp Luồng Gửi Yêu Cầu Của Nhân Viên (`/`)
- [x] Cập nhật `handleRequestAccess` trong `apps/web/src/app/page.tsx`:
  - [x] Insert bản ghi vào bảng `accessRequests` với `status: 'PENDING'`.
  - [x] Ghi nhật ký kiểm toán bất biến `ACCESS_REQUESTED`.
- [x] Truy vấn các yêu cầu đang chờ (`PENDING`) của nhân viên hiện tại để render nhãn `Đang Chờ Quản Trị Duyệt` thay vì cho phép gửi trùng lặp.

## Nhóm 3: Xây Dựng Hàng Đợi Phê Duyệt Tại Cổng Quản Trị (`/admin`)
- [x] Cập nhật `apps/web/src/app/admin/page.tsx`:
  - [x] Bổ sung KPI "Chờ duyệt" thời gian thực trên thanh điều hành.
  - [x] Truy vấn danh sách `accessRequests` (kèm join thông tin nhân viên).
  - [x] Viết Server Action `handleApproveRequest(requestId)`: Tự động insert grant vào `grants`, update `APPROVED`, ghi audit log `REQUEST_APPROVED`.
  - [x] Viết Server Action `handleRejectRequest(requestId)`: Update `REJECTED`, ghi audit log `REQUEST_REJECTED`.
  - [x] Render giao diện "Hàng Đợi Yêu Cầu Cấp Quyền (Access Requests Queue)" với 2 nút [Phê Duyệt] và [Từ Chối].
  - [x] Render danh sách tóm tắt các yêu cầu đã xử lý gần đây.

## Nhóm 4: Kiểm Chứng Kỹ Thuật & Nghiệm Thu
- [x] Kiểm tra 0 mock: `git grep -i "Mock" apps/web/src/` (Kết quả: 0 mock, tuân thủ 100% Zero Mock).
- [x] Kiểm tra TypeScript compilation: `npx tsc --project apps/web/tsconfig.json --noEmit` (0 lỗi).
- [x] Chạy `npx turbo build` đảm bảo mã thoát 0 (Build thành công).
- [x] Lập báo cáo nghiệm thu `docs/reports/PHASE-9-IMPLEMENTATION-REPORT.md`.
