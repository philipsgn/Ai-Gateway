# Task Tracking: Phase 2 — Service Launch & Direct Access Portal

Tài liệu theo dõi tiến độ nhiệm vụ cho Phase 2, bám sát 100% phân rã công việc từ [docs/PHASE.md](./docs/PHASE.md). Không tự thêm task ngoài phạm vi.

---

## Nhóm 1: Cơ Sở Dữ Liệu & Đo Lường Sử Dụng (Data & Schema)
- [x] Cập nhật schema Drizzle bảng `grants` thêm `accessCount` và `lastAccessedAt` (`apps/web/src/db/schema.ts`)
- [x] Cập nhật migration script `scripts/migrate.ts` thêm lệnh `ALTER TABLE grants ADD COLUMN IF NOT EXISTS ...`
- [x] Thực thi `npm run db:migrate` áp dụng cột mới lên Neon PostgreSQL thật
- [x] Cập nhật script kiểm tra `scripts/verify-db.ts` hiển thị thông tin đo lường lượt dùng

## Nhóm 2: Launch Gateway & Kiểm Soát An Toàn (Security & Launch Gateway)
- [x] Định nghĩa bảng ánh xạ tài nguyên AI chuẩn (`resourceCatalog`) với URL chính thức, icon và danh mục
- [x] Xây dựng Server Action hoặc Route Handler khởi chạy an toàn:
  - Kiểm tra xác thực phiên đăng nhập
  - Kiểm tra quyền sở hữu grant
  - Kiểm tra trạng thái `ACTIVE` và hạn sử dụng
  - Cập nhật `access_count` và `last_accessed_at`
  - Ghi nhận nhật ký kiểm toán `AI_SERVICE_LAUNCHED`
  - Chuyển hướng an toàn (Safe Redirect) đến URL dịch vụ AI

## Nhóm 3: Giao Diện AI Launcher Hub Cho Nhân Viên (UI & UX)
- [x] Nâng cấp thẻ dịch vụ AI trên trang chủ `/` thành thẻ tương tác hiện đại:
  - Hiển thị icon nhận diện chính thức
  - Hiển thị danh mục (Coding, Writing, Chat, Design)
  - Hiển thị số lượt đã truy cập và hạn dùng
  - Nút bấm "Khởi chạy dịch vụ" kích hoạt trực tiếp Launch Gateway
- [x] Xây dựng trạng thái xử lý khi không có quyền hoặc quyền đã hết hạn (grant_revoked, grant_expired, forbidden, grant_not_found)

## Nhóm 4: Bảng Giám Sát Mức Độ Sử Dụng Cho Admin (Admin Portal Analytics)
- [ ] Cập nhật bảng quản lý phân quyền tại `/admin`: Bổ sung hiển thị `Lượt truy cập` và `Truy cập gần nhất`
- [ ] Thêm chỉ số tổng quan trên Admin Dashboard: Tổng số lượt khởi chạy AI toàn doanh nghiệp

## Nhóm 5: Kiểm Chứng & Nghiệm Thu Thực Tế (Verification)
- [ ] Chạy `npx turbo build` xác nhận zero lỗi TypeScript / Lint
- [ ] Chạy kiểm tra rà soát `git grep -i "Mock" apps/web/src/` cho ra 0 kết quả
- [ ] Kiểm chứng thực tế trên browser:
  - Đăng nhập tài khoản Root Admin hoặc Nhân viên có quyền
  - Bấm "Khởi chạy" một dịch vụ AI (như ChatGPT Team)
  - Xác nhận trình duyệt mở ra trang dịch vụ AI chính thức
  - Xác nhận trong cơ sở dữ liệu Neon PostgreSQL: `access_count` tăng lên, `last_accessed_at` được cập nhật, và 1 dòng `AI_SERVICE_LAUNCHED` xuất hiện trong `audit_logs`
