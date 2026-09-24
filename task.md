# Task Tracking: Phase 8 — Production Shared License Pool & Dynamic Vault Activation Engine

Tài liệu theo dõi tiến độ nhiệm vụ cho Phase 8, bám sát 100% phân rã công việc từ [docs/PHASE.md](./docs/PHASE.md). Không tự thêm task ngoài phạm vi.

---

## Nhóm 1: Nâng Cấp Logic Trang Chủ & Trạng Thái Kích Hoạt Vault
- [x] Cập nhật `apps/web/src/app/page.tsx`:
  - [x] Truy vấn và liên kết trạng thái `vaultCredentials` của từng grant
  - [x] Hiển thị nhãn `SẴN SÀNG` và số ghế cho công cụ đã nạp Vault
  - [x] Hiển thị nhãn `Chờ Admin kết nối` và vô hiệu hóa nút mở cho công cụ chưa nạp Vault

## Nhóm 2: Nâng Cấp Cẩm Nang Hệ Thống Nền Tảng (`/he-thong`)
- [x] Cập nhật `apps/web/src/app/he-thong/page.tsx`:
  - [x] Thêm phần: "Mô Hình Bản Quyền Dùng Chung (Shared License Pool) & Cách Admin Kích Hoạt"
  - [x] Minh họa sơ đồ mua gói Team/Business, nạp vào Vault và phân phối ghế qua Redis

## Nhóm 3: Kiểm Chứng Kỹ Thuật & Nghiệm Thu
- [x] Kiểm tra 0 mock: `git grep -i "Mock" apps/web/src/`
- [x] Kiểm tra TypeScript compilation: `npx tsc --project apps/web/tsconfig.json --noEmit`
- [x] Chạy `npx turbo build` đảm bảo mã thoát 0
- [x] Lập báo cáo nghiệm thu `docs/reports/PHASE-8-IMPLEMENTATION-REPORT.md`
