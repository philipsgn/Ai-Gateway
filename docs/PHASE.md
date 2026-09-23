# Active Phase Specification (PHASE)
## Giai Đoạn 1: Real Identity, Root Admin & Grants Matrix
### Nền Tảng Quản Trị Định Danh & Phân Quyền AI Cốt Lõi (Business Foundation Slice)

---

## 1. Mục Tiêu Duy Nhất Của Phase

> Một người dùng ngoài đời thực bấm vào liên kết Vercel công khai, đăng nhập bằng tài khoản Google thật, hệ thống tự động phân loại vai trò (Root Administrator hoặc Employee) trong cơ sở dữ liệu PostgreSQL thật, Quản trị viên cấp/thu hồi quyền sử dụng dịch vụ AI cho nhân viên và toàn bộ quá trình được lưu vết kiểm toán minh bạch.

---

## 2. Phạm Vi Thực Hiện (In Scope)

1. **Xác thực Định danh Doanh nghiệp (Google OAuth 2.0):**
   - Đăng nhập bảo mật thông qua Google OAuth 2.0 Client thật bằng thư viện chuẩn NextAuth.js v5.
   - Quản lý phiên làm việc bảo mật bằng JWT có ký mã hóa bảo vệ toàn vẹn.
2. **Cơ chế Phân loại Vai trò (Root Admin vs. Employee):**
   - Tự động nhận diện tài khoản Quản trị viên tối cao (Root Administrator) đối chiếu email Google với biến môi trường `ROOT_ADMIN_EMAIL`.
   - Gán vai trò mặc định `EMPLOYEE` cho toàn bộ nhân sự còn lại khi đăng nhập lần đầu.
   - Thao tác upsert idempotent vào PostgreSQL theo `google_sub`, không tạo bản ghi trùng lặp.
3. **Mô Hình Dữ Liệu Thực Tế (PostgreSQL Managed):**
   - Lưu trữ và quản lý tập trung trên 3 bảng: `employees`, `grants`, `audit_logs` thông qua Drizzle ORM.
   - Khóa ngoại cascade và chỉ mục tối ưu hóa tốc độ truy vấn.
4. **Cổng Quản Trị Phân Quyền AI (Admin Portal tại `/admin`):**
   - Bảo vệ route nghiêm ngặt phía máy chủ (Server Component Route Guard): Chặn người dùng không có vai trò `ROOT_ADMIN` với màn hình cảnh báo 403 Forbidden.
   - Danh bạ nhân viên hệ thống (Registered Employees) hiển thị toàn bộ người dùng đã đồng bộ từ Google.
   - Biểu mẫu Cấp Quyền AI (Server Action `handleCreateGrant`): Cho phép chọn nhân viên, chỉ định công cụ (ChatGPT Team, Claude 3.5 Sonnet Pro, Gemini Advanced, Cursor Pro/Business...), thiết lập thời hạn và tự động ghi log `GRANT_ISSUED`.
   - Bảng Quản lý Quyền (Grants Management): Theo dõi trạng thái `ACTIVE` / `REVOKED`, thực hiện thu hồi quyền tức thì qua Server Action `handleRevokeGrant` và tự động ghi log `GRANT_REVOKED`.
5. **Cổng Dịch Vụ Phía Nhân Viên (Employee Dashboard tại `/`):**
   - Truy vấn trực tiếp từ PostgreSQL để hiển thị danh mục các dịch vụ AI đang ở trạng thái kích hoạt mà nhân viên được phép sử dụng.
   - Hiển thị lối tắt nhanh đến Admin Portal nếu người dùng đăng nhập là Root Admin.
6. **Bảo Vệ Tần Suất Bằng Upstash Redis:**
   - Giới hạn 10 yêu cầu đăng nhập/phút/IP bằng thuật toán Sliding Window qua REST API, bảo vệ chống brute-force và lạm dụng endpoint.
7. **Triển Khai & Nghiệm Thu Hạ Tầng Thực Tế:**
   - Đồng bộ biến môi trường cho cả môi trường local (`.env.local` tại root và `apps/web/.env.local`) và môi trường Vercel.
   - Áp dụng migration lên PostgreSQL đám mây (Neon) và kiểm chứng luồng hoạt động thực tế.

---

## 3. Ngoài Phạm Vi (Out of Scope)

- ❌ Không xây dựng form đăng nhập bằng mật khẩu tự tạo hoặc tài khoản người dùng giả định.
- ❌ Không tích hợp Vault hoặc SecretStore riêng (tiếp tục sử dụng biến môi trường Vercel ở giai đoạn này).
- ❌ Không xây dựng hệ thống hàng đợi chia sẻ tài khoản (Seat Pool / Lease Mutex) — thuộc Phase 4.
- ❌ Không tích hợp API quản trị SCIM doanh nghiệp của OpenAI hoặc Google Workspace (hoãn đến khi có tài khoản Enterprise đối tác).
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
- [x] Cấu hình và đồng bộ `ROOT_ADMIN_EMAIL` vào `.env.local` (root và `apps/web/.env.local`)
- [x] Thiết lập cơ sở dữ liệu PostgreSQL managed (Neon AWS Singapore) và kiểm chứng migration thành công
- [x] Thiết lập Upstash Redis instance và kiểm chứng phản hồi PING/PONG qua REST API
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
- [x] Kiểm tra rà soát không tồn tại chuỗi mã giả lập trong mã nguồn ứng dụng (`grep -rn "Mock" apps/`)
- [ ] Khởi động dev server (`npm run dev`) với biến môi trường thật và kiểm chứng đăng nhập tài khoản Root Admin:
  - Hiển thị huy hiệu `ROOT_ADMIN`
  - Truy cập được `/admin`
  - Cấp quyền thành công một dịch vụ AI (như ChatGPT Team)
- [ ] Kiểm chứng đăng nhập tài khoản Nhân viên (email khác):
  - Hiển thị vai trò `EMPLOYEE`
  - Cố tình truy cập `/admin` nhận cảnh báo 403 Access Denied
  - Trang chủ hiển thị đúng dịch vụ AI vừa được Root Admin cấp
- [ ] Kiểm tra cơ sở dữ liệu PostgreSQL Neon (`scripts/verify-db.ts`): Xác nhận bản ghi xuất hiện trong 3 bảng `employees`, `grants`, `audit_logs`

---

## 5. Định Nghĩa Hoàn Thành (Definition of Done)

| Tiêu chí | Phương thức kiểm chứng cụ thể | Trạng thái hiện tại |
|---|---|:---:|
| **Clean Build** | Chạy `npx turbo build` trên môi trường CI/CD và local kết thúc với mã thoát `0`. | ✅ **PASS** |
| **Không mã giả lập** | Chạy lệnh `grep -rn "Mock" apps/web/src/` không trả về bất kỳ dòng kết quả nào. | ✅ **PASS** |
| **Hạ tầng cơ sở dữ liệu** | Chạy `npx tsx scripts/verify-db.ts` kết nối thành công và xác nhận 3 bảng `employees`, `grants`, `audit_logs` tồn tại trong Neon. | ✅ **PASS** |
| **Hạ tầng Rate Limiting** | Gửi lệnh REST PING đến Upstash Redis nhận về `{"result":"PONG"}`. | ✅ **PASS** |
| **Bảo vệ Route Guard** | Tài khoản có vai trò `EMPLOYEE` khi điều hướng đến `/admin` nhìn thấy màn hình "403 Access Denied", không đọc được danh bạ nhân sự. | ⏳ Chờ test đăng nhập |
| **Luồng cấp và thu hồi quyền thật** | Root Admin cấp quyền một dịch vụ AI, nhân viên đăng nhập thấy dịch vụ đó ở trạng thái `ACTIVE`; khi Root Admin bấm "Thu hồi", trạng thái chuyển sang `REVOKED`. | ⏳ Chờ test đăng nhập |
| **Đường dẫn triển khai công khai** | Truy cập được qua domain HTTPS do Vercel cấp phát từ thiết bị không thuộc mạng nội bộ. | ⏳ Chờ deploy Vercel |
