# Task Tracking: Phase 7 — Human-Centric UI/UX Simplification & Interactive Platform Guide

Tài liệu theo dõi tiến độ nhiệm vụ cho Phase 7, bám sát 100% phân rã công việc từ [docs/PHASE.md](./docs/PHASE.md). Không tự thêm task ngoài phạm vi.

---

## Nhóm 1: Hệ Thống Bảng Màu Trầm Dịu Mắt (Calm Muted Design System)
- [x] Cập nhật `apps/web/tailwind.config.js`: Tinh chỉnh bảng màu sang tông trầm ấm (Muted Warm Stone, Gentle Sage, Soft Slate)
- [x] Cập nhật `apps/web/src/styles/globals.css`: Tối ưu các thẻ `card-muted`, hiệu ứng hover nhẹ nhàng, nền êm dịu

## Nhóm 2: Xây Dựng Trang "Hệ Thống Nền Tảng" (`apps/web/src/app/he-thong/page.tsx`)
- [x] Thiết kế trang `/he-thong` với bố cục thông thoáng, thanh lịch:
  - [x] Phần 1: Giới thiệu & Triết lý vận hành (Tại sao doanh nghiệp cần AI Access Gateway?)
  - [x] Phần 2: Cơ chế hoạt động trực quan (Ủy quyền an toàn, không lộ mật khẩu gốc)
  - [x] Phần 3: Hướng dẫn nhanh cho nhân viên (3 bước làm việc: Chọn công cụ -> Khởi chạy -> Trả ghế)
  - [x] Phần 4: Cơ chế tự phục vụ (Gửi yêu cầu cấp quyền và quy trình phê duyệt)
  - [x] Phần 5: Câu hỏi thường gặp (FAQ giải đáp băn khoăn cho người mới)

## Nhóm 3: Tinh Gọn Hóa Header & Footer (`apps/web/src/app/layout.tsx`)
- [x] Nâng cấp thanh điều hướng:
  - [x] Thêm liên kết nổi bật tới trang "Hệ Thống"
  - [x] Đổi tên "Tuân Thủ & WORM" thành "Nhật Ký Sử Dụng"
  - [x] Đổi huy hiệu SLA sang ngôn ngữ thân thiện: `Hệ thống ổn định 99.9%`
- [x] Tinh giản Footer: Ngôn từ cô đọng, thanh lịch, liên kết nhanh

## Nhóm 4: Tinh Gọn Hóa Không Gian Làm Việc Nhân Viên (`apps/web/src/app/page.tsx`)
- [x] Rà soát và loại bỏ toàn bộ từ ngữ đao to búa lớn khỏi Hero Section và màn hình đăng nhập
- [x] Tinh gọn thẻ dịch vụ AI:
  - [x] Hiển thị rõ ràng: Tên công cụ, Trạng thái (`Sẵn sàng` / `Đang bận: X/Y người dùng`)
  - [x] Nút bấm trực quan: `Mở công cụ ngay` và `Trả lại chỗ`
  - [x] Thông báo nhẹ nhàng khi đầy người: *"Công cụ hiện có đủ người dùng, bạn vui lòng quay lại sau ít phút nhé"*
- [x] Danh mục công cụ yêu cầu cấp quyền: Thiết kế dạng danh sách tối giản, 1-click gửi yêu cầu với lời nhắc thân thiện

## Nhóm 5: Tinh Gọn Hóa Cổng Quản Trị & Trang Nhật Ký
- [x] Trang Quản Trị (`apps/web/src/app/admin/page.tsx`): Dùng từ ngữ nghiệp vụ đời thường (Ngân sách phòng ban, Quản lý tài khoản công ty, Cấp quyền sử dụng)
- [x] Trang Nhật Ký (`apps/web/src/app/audit/page.tsx`): Đổi tên thành "Nhật Ký Hoạt Động", trình bày dòng thời gian sự kiện trực quan, dễ hiểu ai đã mở công cụ nào

## Nhóm 6: Kiểm Chứng Kỹ Thuật & Đóng Giai Đoạn
- [x] Kiểm tra 0 mock: `git grep -i "Mock" apps/web/src/`
- [x] Kiểm tra TypeScript compilation: `npx tsc --project apps/web/tsconfig.json --noEmit`
- [x] Chạy `npx turbo build` đảm bảo mã thoát 0
- [x] Đẩy commit và cập nhật báo cáo nghiệm thu
