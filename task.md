# Task Tracking: Phase 4 — Shared Credential Vault & Dynamic Session Broker

Tài liệu theo dõi tiến độ nhiệm vụ cho Phase 4, bám sát 100% phân rã công việc từ [docs/PHASE.md](./docs/PHASE.md). Không tự thêm task ngoài phạm vi.

---

## Nhóm 1: Cơ Sở Dữ Liệu Vault & Mã Hóa AES-256-GCM (Data & Cryptography)
- [x] Định nghĩa schema Drizzle bảng `vault_credentials` trong `apps/web/src/db/schema.ts`
- [x] Cập nhật migration script `scripts/migrate.ts` tạo bảng `vault_credentials`
- [x] Thực thi `npm run db:migrate` áp dụng DDL lên Neon PostgreSQL thật
- [x] Xây dựng module mã hóa `apps/web/src/lib/vault.ts` hỗ trợ AES-256-GCM (encrypt, decrypt, verify)

## Nhóm 2: Bộ Điều Phối Phiên Động & Concurrency Lease Mutex (Session Broker Engine)
- [x] Xây dựng module `apps/web/src/lib/session-broker.ts` sử dụng Upstash Redis
- [x] Xây dựng logic `acquireSessionLease` với kiểm tra trần đồng thời `max_concurrency`
- [x] Xây dựng logic `releaseSessionLease` thu hồi phiên ngay lập tức
- [x] Cập nhật Launch Gateway `/api/launch/[grantId]` tự động kiểm tra và chiếm slot phiên trước khi chuyển hướng

## Nhóm 3: Giao Diện Quản Trị Vault Tại Admin Portal (/admin)
- [x] Thêm các thẻ thống kê tổng quan Vault & Phiên đồng thời đang chạy
- [x] Xây dựng Server Action `handleCreateVaultCredential` mã hóa và lưu trữ credential vào Neon DB
- [x] Xây dựng Server Action `handleRotateVaultCredential` và `handleUpdateVaultStatus`
- [x] Bảng quản lý Shared Vault Credentials hiển thị trạng thái và số phiên active theo thời gian thực từ Redis

## Nhóm 4: Giao Diện Phía Nhân Viên & Trả Phiên (Employee Session Visibility)
- [x] Hiển thị thông số tải ghế dùng chung (Active Slots / Max Slots) trên thẻ công cụ AI tại trang chủ `/`
- [x] Thêm chỉ báo phiên đang giữ kèm nút **"Trả slot (Release)"** qua Server Action `handleReleaseSession`
- [x] Xử lý thông báo lỗi người dùng khi phòng ban hoặc công cụ hết slot truy cập đồng thời (`concurrency_limit_exceeded`)

## Nhóm 5: Kiểm Chứng Toàn Diện & Nghiệm Thu Dữ Liệu Thật (Verification)
- [ ] Chạy `git grep -i "Mock" apps/web/src/` đảm bảo 0 kết quả
- [ ] Viết và chạy script xác thực `scripts/test-phase4-vault.ts` thao tác trực tiếp trên Neon PostgreSQL & Upstash Redis
- [ ] Chạy `npx turbo build` kiểm tra type-safety và build production
- [ ] Tạo báo cáo nghiệm thu `docs/reports/PHASE-4-IMPLEMENTATION-REPORT.md`
