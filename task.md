# Task Tracking: Phase 6 — Enterprise Production Transformation & Mint-Cream UI/UX Overhaul

Tài liệu theo dõi tiến độ nhiệm vụ cho Phase 6, bám sát 100% phân rã công việc từ [docs/PHASE.md](./docs/PHASE.md). Không tự thêm task ngoài phạm vi.

---

## Nhóm 1: Hệ Thống Design Tokens & Theme Engine Mint & Cream
- [x] Tinh chỉnh `apps/web/tailwind.config.js` bổ sung bảng màu mint-cream chuẩn cao cấp (`cream`, `mint`, `ink`)
- [x] Cập nhật `apps/web/src/app/globals.css` định nghĩa các utility classes: `bg-cream-canvas`, `card-cream`, `badge-mint`, `btn-mint-primary`, `btn-cream-secondary`

## Nhóm 2: Cổng Điều Hướng Chung & Dọn Dẹp Prototype (Navigation & Clean Layout)
- [x] Nâng cấp thanh điều hướng chính `apps/web/src/components/Navbar.tsx` (hoặc header layout):
  - [x] Brand Logo cao cấp "AI Access Gateway • Enterprise Portal" với icon xanh ngọt và kem sang trọng
  - [x] Trạng thái hệ thống doanh nghiệp (Enterprise SLA Indicator) thay vì hiển thị tên driver DB
  - [x] Dropdown/Avatar người dùng tinh gọn, liên kết nhanh giữa Cổng Nhân Viên, Quản Trị và Tuân Thủ
- [x] Xóa bỏ hoàn toàn khung hiển thị bảng DB `CHI TIẾT BẢN GHI POSTGRESQL` và các banner kỹ thuật

## Nhóm 3: Không Gian Làm Việc Nhân Viên & Danh Mục Self-Service (`apps/web/src/app/page.tsx`)
- [x] Xây dựng lại Hero Header Nhân Viên: Tên, avatar, vai trò (`EMPLOYEE` / `ROOT_ADMIN`), phòng ban và chỉ số tóm tắt (Công cụ hoạt động, phiên đang giữ)
- [x] Xây dựng khu vực "Không Gian Làm Việc AI Của Bạn" (Active AI Workspace):
  - [x] Thẻ dịch vụ AI thiết kế Mint & Cream với biểu tượng thương hiệu sắc nét
  - [x] Hiển thị tình trạng ghế dùng chung thời gian thực từ Redis (`X/Y slots`)
  - [x] Nút khởi chạy qua Gateway với animation mượt mà
  - [x] Nút "Trả slot (Release)" khi nhân viên đang giữ ghế
- [x] Xây dựng khu vực "Danh Mục Công Cụ Doanh Nghiệp & Yêu Cầu Cấp Quyền" (AI Catalog & Access Request):
  - [x] Hiển thị các công cụ khả dụng trong công ty
  - [x] Thêm Server Action `handleRequestAccess`: Cho phép nhân viên bấm "Yêu cầu cấp quyền", tự động ghi nhận sự kiện `ACCESS_REQUESTED` vào `audit_logs` có ký SHA-256

## Nhóm 4: Cổng Quản Trị Doanh Nghiệp Tinh Hoa (`apps/web/src/app/admin/page.tsx`)
- [x] Chuyển đổi toàn bộ giao diện Cổng Quản Trị sang hệ thiết kế Mint & Cream:
  - [x] Bảng tổng quan KPI với thẻ số liệu tương phản cao, đổ bóng nhẹ
  - [x] Tab Quản lý Ngân sách phòng ban & Hạn mức chi tiêu
  - [x] Tab Kho Mật Mã Bản Quyền Dùng Chung (Shared Vault): Thẻ tài khoản mã hóa AES-256-GCM, số ghế trực tiếp từ Redis, nút xoay vòng mật khẩu và tạm dừng/kích hoạt
  - [x] Tab Ma Trận Phân Quyền Nhân Sự: Tìm kiếm, cấp mới quyền AI với thời hạn, thu hồi tức thì
  - [x] Nút xuất nhanh báo cáo tuân thủ CSV

## Nhóm 5: Trung Tâm Tuân Thủ & Phân Tích ROI (`apps/web/src/app/audit/page.tsx`)
- [x] Tái thiết kế trang Kiểm toán Tuân thủ:
  - [x] Chứng nhận WORM Immutability với thiết kế trang trọng, chuẩn mực
  - [x] Thước đo toàn vẹn Checksum SHA-256 (100% Verified)
  - [x] Thẻ tính toán ROI doanh nghiệp (Thời gian tiết kiệm, giá trị kinh tế)
  - [x] Thanh phân bổ sự kiện màu pastel và bộ lọc sự kiện trực quan
  - [x] Nút xuất CSV (RFC 4180) và ISO 27001 / SOC 2 JSON

## Nhóm 6: Kiểm Chứng Toàn Diện & Nghiệm Thu
- [x] Kiểm tra 0 mock: `git grep -i "Mock" apps/web/src/`
- [x] Kiểm tra TypeScript compilation: `npx tsc --noEmit`
- [x] Chạy `npx turbo build` đảm bảo mã thoát 0
- [x] Lập báo cáo nghiệm thu `docs/reports/PHASE-6-IMPLEMENTATION-REPORT.md`
