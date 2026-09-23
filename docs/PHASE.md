# Active Phase Specification (PHASE)
## Giai Đoạn 1: Real Identity, Root Admin & Grants Matrix

---

## 1. Mục Tiêu Duy Nhất Của Phase

> Một người dùng ngoài đời thực bấm vào liên kết Vercel công khai, đăng nhập bằng tài khoản Google thật, hệ thống tự động phân loại vai trò (Root Administrator hoặc Employee) trong PostgreSQL thật, Quản trị viên cấp quyền sử dụng dịch vụ AI cho nhân viên và toàn bộ quá trình được lưu vết kiểm toán minh bạch.

---

## 2. Phạm Vi Thực Hiện (In Scope)

1. **Xác thực Google OAuth 2.0:** Đăng nhập thông qua Google Client ID/Secret thật bằng thư viện NextAuth.js v5.
2. **Cơ chế phân quyền Root Admin:** Đối chiếu email Google với biến môi trường `ROOT_ADMIN_EMAIL` để cấp vai trò `ROOT_ADMIN` hoặc `EMPLOYEE`.
3. **Mô hình dữ liệu PostgreSQL:** Lưu trữ và quản lý dữ liệu trên 3 bảng `employees`, `grants`, `audit_logs` thông qua Drizzle ORM.
4. **Cổng Quản Trị (Admin Portal tại `/admin`):**
   - Chặn người dùng không có vai trò `ROOT_ADMIN` bằng Server Component Route Guard (403 Access Denied).
   - Biểu mẫu cấp quyền dịch vụ AI (chọn nhân viên, chọn công cụ, đặt thời hạn).
   - Bảng quản lý trạng thái quyền và nút thao tác thu hồi quyền (Revoke).
   - Danh bạ toàn bộ nhân viên đã đăng nhập từ Google.
5. **Giao diện người dùng & Phía Nhân viên:**
   - Trang chủ `/` hiển thị danh sách các dịch vụ AI đang ở trạng thái `ACTIVE` của riêng nhân viên đó.
   - Hiển thị lối tắt nhanh đến Admin Portal nếu người dùng đăng nhập là Quản trị viên.
6. **Bảo vệ tần suất bằng Upstash Redis:** Giới hạn 10 yêu cầu đăng nhập/phút/IP bằng thuật toán Sliding Window.
7. **Triển khai & Kiểm chứng thực tế:** Đưa ứng dụng lên nền tảng đám mây Vercel và kết nối cơ sở dữ liệu thật.

---

## 3. Ngoài Phạm Vi (Out of Scope)

- ❌ Không xây dựng form đăng nhập bằng mật khẩu tự tạo hoặc tài khoản người dùng giả định.
- ❌ Không tích hợp Vault hoặc SecretStore riêng (tiếp tục sử dụng biến môi trường Vercel).
- ❌ Không xây dựng hệ thống hàng đợi chia sẻ tài khoản (Seat Pool / Lease Mutex).
- ❌ Không tích hợp API quản trị Enterprise tự động của OpenAI hoặc Google Workspace (hoãn đến khi có tài khoản doanh nghiệp đối tác).
- ❌ Không viết tiện ích mở rộng trình duyệt (Chrome Extension).

---

## 4. Kế Hoạch Nhiệm Vụ Chi Tiết (Task Breakdown)

### Nhóm 1: Xác thực & Phân quyền (Auth & Roles)
- [x] Cài đặt và cấu hình NextAuth.js v5 với Google Provider
- [x] Xây dựng logic phân biệt vai trò tự động dựa trên biến `ROOT_ADMIN_EMAIL`
- [x] Bổ sung định nghĩa kiểu dữ liệu TypeScript cho NextAuth Session và JWT (`apps/web/src/types/next-auth.d.ts`)
- [x] Ghi nhận nhật ký kiểm toán tương ứng khi đăng nhập (`ROOT_ADMIN_LOGIN` hoặc `EMPLOYEE_LOGIN`)

### Nhóm 2: Dữ liệu & Phân quyền AI (Data & Grants)
- [x] Định nghĩa bảng `grants` trong Drizzle ORM (`apps/web/src/db/schema.ts`)
- [x] Bổ sung DDL migration tạo bảng `grants` và các chỉ mục (`scripts/migrate.ts`)
- [x] Xây dựng Server Action `handleCreateGrant` với kiểm tra quyền `ROOT_ADMIN` và ghi log `GRANT_ISSUED`
- [x] Xây dựng Server Action `handleRevokeGrant` với kiểm tra quyền `ROOT_ADMIN` và ghi log `GRANT_REVOKED`

### Nhóm 3: Giao diện & Trải nghiệm Người Dùng (UI & UX)
- [x] Cập nhật Top Navigation hiển thị liên kết `Admin Portal` khi người dùng là `ROOT_ADMIN`
- [x] Xây dựng trang Admin Portal (`apps/web/src/app/admin/page.tsx`) với Route Guard chặn 403 Forbidden
- [x] Xây dựng danh bạ nhân viên và bảng quản lý phân quyền AI tại `/admin`
- [x] Cập nhật trang chủ `/` hiển thị danh mục các dịch vụ AI đang kích hoạt của nhân viên
- [x] Xây dựng banner thông báo lối tắt cho Root Administrator trên trang chủ

### Nhóm 4: Hạ tầng & Triển khai Đám Mây (Infra & Deploy)
- [x] Chuẩn hóa kịch bản chạy migration `npm run db:migrate`
- [ ] Thiết lập cơ sở dữ liệu PostgreSQL managed (Neon / Supabase) và cấu hình connection string
- [ ] Thiết lập Upstash Redis instance và lấy REST URL cùng REST Token
- [ ] Cấu hình biến môi trường trên Vercel:
  - `DATABASE_URL`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `AUTH_SECRET`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `ROOT_ADMIN_EMAIL`
- [ ] Triển khai ứng dụng lên Vercel và cập nhật đường dẫn Live Demo vào `README.md`

### Nhóm 5: Kiểm chứng & Nghiệm thu Thực Tế (Verification)
- [x] Kiểm tra biên dịch mã nguồn `npx turbo build` thành công 100%
- [x] Kiểm tra rà soát không tồn tại chuỗi `Mock` trong mã nguồn ứng dụng (`grep -rn "Mock" apps/`)
- [ ] Kiểm chứng đăng nhập thực tế bằng tài khoản Root Admin:
  - Hiển thị huy hiệu `ROOT_ADMIN`
  - Truy cập được `/admin`
  - Cấp quyền thành công một dịch vụ AI cho nhân viên
- [ ] Kiểm chứng đăng nhập thực tế bằng tài khoản Nhân viên (email khác):
  - Hiển thị vai trò `EMPLOYEE`
  - Cố tình truy cập `/admin` nhận cảnh báo 403 Access Denied
  - Trang chủ hiển thị đúng dịch vụ AI vừa được cấp
- [ ] Kiểm tra dashboard Neon/Supabase: Xác nhận dữ liệu xuất hiện trong 3 bảng `employees`, `grants`, `audit_logs`

---

## 5. Định Nghĩa Hoàn Thành (Definition of Done)

| Tiêu chí | Phương thức kiểm chứng cụ thể |
|---|---|
| **Clean Build** | Chạy `npx turbo build` trên môi trường CI/CD và local kết thúc với mã thoát `0`. |
| **Không mã giả lập** | Chạy lệnh `grep -rn "Mock" apps/web/src/` không trả về bất kỳ dòng kết quả nào. |
| **Đường dẫn triển khai công khai** | Truy cập được qua domain HTTPS do Vercel cấp phát từ thiết bị không thuộc mạng nội bộ. |
| **Bảo vệ Route Guard** | Tài khoản có vai trò `EMPLOYEE` khi điều hướng đến `/admin` nhìn thấy màn hình "403 Access Denied", không đọc được danh bạ nhân sự. |
| **Luồng cấp và thu hồi quyền thật** | Root Admin cấp quyền một dịch vụ AI, nhân viên đăng nhập thấy dịch vụ đó ở trạng thái `ACTIVE`; khi Root Admin bấm "Thu hồi", trạng thái chuyển sang `REVOKED`. |
| **Dữ liệu thật trong PostgreSQL** | Mở bảng điều khiển SQL Console trên Neon/Supabase, chạy truy vấn `SELECT count(*) FROM grants` và `SELECT count(*) FROM audit_logs` cho ra kết quả lớn hơn 0. |
