# Task Tracking: Phase 1 — Real Identity, Root Admin & Grants Matrix

Tài liệu theo dõi tiến độ nhiệm vụ cho Phase 1, bám sát 100% phân rã công việc từ [docs/PHASE.md](./docs/PHASE.md). Không tự thêm task ngoài phạm vi.

---

## Nhóm 1: Xác thực & Phân quyền (Auth & Roles)
- [x] Cài đặt và cấu hình NextAuth.js v5 với Google Provider
- [x] Xây dựng logic phân biệt vai trò tự động dựa trên biến `ROOT_ADMIN_EMAIL`
- [x] Bổ sung định nghĩa kiểu dữ liệu TypeScript cho NextAuth Session và JWT (`apps/web/src/types/next-auth.d.ts`)
- [x] Ghi nhận nhật ký kiểm toán tương ứng khi đăng nhập (`ROOT_ADMIN_LOGIN` hoặc `EMPLOYEE_LOGIN`)

## Nhóm 2: Dữ liệu & Phân quyền AI (Data & Grants)
- [x] Định nghĩa bảng `grants` trong Drizzle ORM (`apps/web/src/db/schema.ts`)
- [x] Bổ sung DDL migration tạo bảng `grants` và các chỉ mục (`scripts/migrate.ts`)
- [x] Xây dựng Server Action `handleCreateGrant` với kiểm tra quyền `ROOT_ADMIN` và ghi log `GRANT_ISSUED`
- [x] Xây dựng Server Action `handleRevokeGrant` với kiểm tra quyền `ROOT_ADMIN` và ghi log `GRANT_REVOKED`

## Nhóm 3: Giao diện & Trải nghiệm Người Dùng (UI & UX)
- [x] Cập nhật Top Navigation hiển thị liên kết `Admin Portal` khi người dùng là `ROOT_ADMIN`
- [x] Xây dựng trang Admin Portal (`apps/web/src/app/admin/page.tsx`) với Route Guard chặn 403 Forbidden
- [x] Xây dựng danh bạ nhân viên và bảng quản lý phân quyền AI tại `/admin`
- [x] Cập nhật trang chủ `/` hiển thị danh mục các dịch vụ AI đang kích hoạt của nhân viên
- [x] Xây dựng banner thông báo lối tắt cho Root Administrator trên trang chủ

## Nhóm 4: Hạ tầng & Triển khai Đám Mây (Infra & Deploy)
- [x] Chuẩn hóa kịch bản chạy migration `npm run db:migrate`
- [x] Bổ sung cấu hình `ROOT_ADMIN_EMAIL` vào `.env.local` đồng bộ với `.env.example`
- [x] Thiết lập cơ sở dữ liệu PostgreSQL managed (Neon / Supabase) và cấu hình connection string
- [x] Thiết lập Upstash Redis instance và lấy REST URL cùng REST Token
- [ ] Cấu hình biến môi trường trên Vercel:
  - `DATABASE_URL`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `AUTH_SECRET`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `ROOT_ADMIN_EMAIL`
- [ ] Triển khai ứng dụng lên Vercel và cập nhật đường dẫn Live Demo vào `README.md`

## Nhóm 5: Kiểm chứng & Nghiệm thu Thực Tế (Verification)
- [x] Kiểm tra biên dịch mã nguồn `npx turbo build` thành công 100%
- [x] Kiểm tra rà soát không tồn tại chuỗi mã giả lập trong mã nguồn ứng dụng (`grep -rn "Mock" apps/`)
- [ ] Kiểm chứng đăng nhập thực tế bằng tài khoản Root Admin:
  - Hiển thị huy hiệu `ROOT_ADMIN`
  - Truy cập được `/admin`
  - Cấp quyền thành công một dịch vụ AI cho nhân viên
- [ ] Kiểm chứng đăng nhập thực tế bằng tài khoản Nhân viên (email khác):
  - Hiển thị vai trò `EMPLOYEE`
  - Cố tình truy cập `/admin` nhận cảnh báo 403 Access Denied
  - Trang chủ hiển thị đúng dịch vụ AI vừa được cấp
- [ ] Kiểm tra dashboard Neon/Supabase: Xác nhận dữ liệu xuất hiện trong 3 bảng `employees`, `grants`, `audit_logs`
