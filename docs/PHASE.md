# Phase 9: Interactive Access Request & Approval Workflow

## 1. Bối Cảnh & Mục Tiêu Nghiệp Vụ (Context & Objective)

Trong môi trường doanh nghiệp thực tế, khi nhân viên có nhu cầu sử dụng công cụ AI (ví dụ: Designer cần Midjourney, lập trình viên cần Cursor, chuyên viên dữ liệu cần Gemini), họ gửi yêu cầu cấp quyền từ Không Gian Làm Việc. 
Trước Phase 9, hệ thống chỉ mới ghi nhận sự kiện `ACCESS_REQUESTED` vào nhật ký kiểm toán mà chưa có màn hình phê duyệt trực quan cho Quản trị viên. Quản trị viên phải tự tra cứu và gán quyền thủ công, gây đứt gãy luồng vận hành.

**Mục tiêu của Phase 9:**
1. **Thiết kế bảng dữ liệu `access_requests` trên PostgreSQL:** Lưu trữ chi tiết yêu cầu cấp quyền (`id`, `employee_id`, `resource_name`, `status` [PENDING, APPROVED, REJECTED], `reviewed_by`, `reviewed_at`, `created_at`).
2. **Nâng cấp Cổng Quản Trị (`/admin`):** Xây dựng phân mục **"Hàng Đợi Yêu Cầu Chờ Phê Duyệt (Access Requests Queue)"** với huy hiệu đếm số lượng thời gian thực.
   - Nút **[Phê Duyệt / Approve]**: 1-click tự động insert bản ghi quyền vào bảng `grants`, chuyển trạng thái yêu cầu thành `APPROVED`, và ghi nhật ký kiểm toán `REQUEST_APPROVED`.
   - Nút **[Từ Chối / Reject]**: 1-click chuyển trạng thái yêu cầu thành `REJECTED`, ghi nhật ký kiểm toán `REQUEST_REJECTED`.
3. **Nâng cấp Không Gian Làm Việc Nhân Viên (`/`):** 
   - Sau khi gửi yêu cầu, thẻ công cụ trong Catalog hiển thị huy hiệu `ĐANG CHỜ DUYỆT (PENDING REVIEW)` ngăn chặn việc gửi trùng lặp.
   - Khi được phê duyệt, công cụ tự động xuất hiện trên danh sách "Công Cụ Được Cấp Quyền Của Bạn".
4. **Bảo toàn 100% Zero Mock:** Mọi thao tác đều ghi và đọc trực tiếp từ Neon PostgreSQL và lưu audit log WORM.

---

## 2. Tiêu Chí Nghiệm Thu (Definition of Done)

- [x] **Bảng Dữ Liệu `access_requests`:** Tạo và migrate thành công bảng `access_requests` trên Neon PostgreSQL; export schema trong `apps/web/src/db/schema.ts`.
- [x] **Hàng Đợi Yêu Cầu Tại `/admin`:** Hiển thị danh sách yêu cầu chờ duyệt với đầy đủ thông tin nhân viên, công cụ yêu cầu, thời gian gửi.
- [x] **1-Click Phê Duyệt / Từ Chối:** Thao tác phê duyệt ngay lập tức kích hoạt grant và audit log mà không cần tải lại trang phức tạp.
- [x] **Phản Hồi Trạng Thái Trên Trang Chủ (`/`):** Hiển thị nhãn `ĐANG CHỜ DUYỆT` đối với các công cụ nhân viên đã nộp đơn.
- [x] **Giữ Vững 100% Zero Mock:** Không dùng class giả lập, kiểm tra `git grep -i "Mock"` = 0.
- [x] **Kiểm Tra Build Thành Công:** `npx turbo build` hoàn tất với mã thoát 0.

---

## 3. Kế Hoạch Phân Rã Nhiệm Vụ (Task Breakdown)

### Nhóm 1: Cơ Sở Dữ Liệu & Schema Migration
- [x] Cập nhật `apps/web/src/db/schema.ts`: Khai báo bảng `accessRequests`.
- [x] Chạy migration script tạo bảng `access_requests` trên Neon PostgreSQL với các chỉ mục (`employee_id`, `status`).

### Nhóm 2: Nâng Cấp Luồng Gửi Yêu Cầu Của Nhân Viên (`/`)
- [x] Cập nhật `handleRequestAccess` trong `apps/web/src/app/page.tsx`:
  - Insert bản ghi vào bảng `accessRequests` với `status: 'PENDING'`.
  - Ghi audit log `ACCESS_REQUESTED`.
- [x] Truy vấn các yêu cầu đang chờ (`PENDING`) của nhân viên hiện tại để render nhãn `Đang Chờ Duyệt` thay vì cho phép gửi lặp lại.

### Nhóm 3: Xây Dựng Hàng Đợi Phê Duyệt Tại Cổng Quản Trị (`/admin`)
- [x] Cập nhật `apps/web/src/app/admin/page.tsx`:
  - Truy vấn danh sách `accessRequests` (kèm join thông tin nhân viên và phòng ban).
  - Viết Server Action `handleApproveRequest(requestId)`:
    - Tạo grant trong `grants`.
    - Update `accessRequests` thành `APPROVED`.
    - Ghi audit log `REQUEST_APPROVED`.
  - Viết Server Action `handleRejectRequest(requestId)`:
    - Update `accessRequests` thành `REJECTED`.
    - Ghi audit log `REQUEST_REJECTED`.
  - Render giao diện hàng đợi chờ duyệt với giao diện sang trọng chuẩn Muted Sage & Warm Stone.

### Nhóm 4: Kiểm Chứng Kỹ Thuật & Nghiệm Thu
- [x] Kiểm tra 0 mock: `git grep -i "Mock" apps/web/src/`.
- [x] Kiểm tra TypeScript compilation: `npx tsc --project apps/web/tsconfig.json --noEmit`.
- [x] Chạy `npx turbo build` đảm bảo mã thoát 0.
- [x] Lập báo cáo nghiệm thu `docs/reports/PHASE-9-IMPLEMENTATION-REPORT.md`.
