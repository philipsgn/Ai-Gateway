# Active Phase Specification (PHASE)
## Giai Đoạn 4: Shared Credential Vault & Dynamic Session Broker
### Quản Trị Tài Khoản Bản Quyền Dùng Chung & Ủy Quyền Phiên Động

---

## 1. Mục Tiêu Duy Nhất Của Phase

> Thiết lập kho lưu trữ bảo mật thông tin đăng nhập dùng chung (Shared Credential Vault) được mã hóa AES-256-GCM trên Neon PostgreSQL, kết hợp với bộ điều phối phiên làm việc thời gian thực (Dynamic Session Broker) trên Upstash Redis nhằm kiểm soát số lượng nhân viên truy cập đồng thời (Concurrency Lease Mutex), tự động thu hồi phiên hết hạn và bảo vệ tài khoản AI dùng chung của doanh nghiệp không bị rò rỉ mật khẩu gốc.

---

## 2. Phạm Vi Thực Hiện (In Scope)

1. **Cơ Sở Dữ Liệu Credential Vault & Mã Hóa AES-256-GCM (Data & Security Layer):**
   - Tạo bảng `vault_credentials` trong Neon PostgreSQL (`id`, `resource_name`, `account_email`, `encrypted_secret`, `iv`, `auth_tag`, `max_concurrency`, `status`, `last_rotated_at`, `created_at`).
   - Xây dựng module mã hóa chuẩn doanh nghiệp `apps/web/src/lib/vault.ts` sử dụng `crypto` native của Node.js (AES-256-GCM với Auth Tag 128-bit và IV ngẫu nhiên) để bảo vệ tuyệt đối chuỗi bí mật/API key trước khi lưu xuống PostgreSQL.
   - Migration an toàn qua `scripts/migrate.ts` lên Neon PostgreSQL thật.

2. **Bộ Điều Phối Phiên Động & Quản Lý Đồng Thời (Session Broker & Concurrency Leases):**
   - Xây dựng module `apps/web/src/lib/session-broker.ts` tích hợp trực tiếp Upstash Redis:
     - `acquireSessionLease(credentialId, employeeId, ttlSeconds)`: Kiểm tra số lượng phiên đồng thời đang hoạt động. Nếu `activeLeases >= max_concurrency`, từ chối cấp phiên (`CONCURRENCY_LIMIT_EXCEEDED`). Nếu còn chỗ, cấp lease có thời hạn (TTL, mặc định 30 phút).
     - `releaseSessionLease(credentialId, employeeId)`: Cho phép nhân viên giải phóng chỗ ngồi (seat) ngay khi hoàn thành tác vụ để nhường slot cho đồng nghiệp.
     - `getActiveLeases(credentialId)`: Truy vấn danh sách và số lượng phiên đồng thời đang hoạt động từ Redis.

3. **Tích Hợp Launch Gateway (/api/launch/[grantId]):**
   - Khi nhân viên bấm "Khởi chạy dịch vụ", nếu công cụ AI được cấu hình qua Shared Vault:
     - Launch Gateway tự động gọi Session Broker yêu cầu cấp lease trong Upstash Redis.
     - Nếu đã hết slot truy cập đồng thời: Điều hướng an toàn về `/?error=concurrency_limit_exceeded&resource=...` kèm thông báo trực quan.
     - Nếu thành công: Cấp lease, ghi nhận nhật ký kiểm toán `SESSION_LEASE_ACQUIRED` và điều hướng an toàn tới dịch vụ.

4. **Giao Diện Quản Trị Cổng Admin Portal (/admin):**
   - Bổ sung khu vực **Shared Credential Vault & Concurrency Management**:
     - Thống kê: Tổng số tài khoản dùng chung trong Vault, Tổng số phiên đồng thời đang hoạt động thời gian thực (real-time Redis).
     - Biểu mẫu Thêm tài khoản dùng chung mới (Server Action `handleCreateVaultCredential`): Chọn công cụ AI, Email tài khoản, Mật khẩu/Khóa bí mật (tự động mã hóa AES-256-GCM), và Số lượt truy cập đồng thời tối đa (`max_concurrency`).
     - Biểu mẫu Xoay vòng mật khẩu (Server Action `handleRotateVaultCredential`): Cập nhật mật khẩu mới, cập nhật mốc thời gian xoay vòng `last_rotated_at`.
     - Bảng theo dõi Vault: Tên công cụ, Email, Giới hạn đồng thời, Số phiên đang hoạt động trực tiếp từ Redis, Trạng thái (`ACTIVE`, `ROTATING`, `SUSPENDED`).

5. **Giao Diện Nhân Viên (Employee Hub Visibility /):**
   - Trên mỗi thẻ công cụ AI: Hiển thị trạng thái slot dùng chung (Ví dụ: `Slot đồng thời: 1/2 đang dùng`).
   - Nếu nhân viên đang giữ một phiên làm việc: Hiển thị Badge `Đang trong phiên (hết hạn sau X phút)` kèm nút bấm **"Trả slot (Release)"** (Server Action `handleReleaseSession`) để giải phóng slot cho đồng đội khi dùng xong.
   - Hiển thị thông báo thân thiện khi bị nghẽn lượt truy cập đồng thời.

6. **Kiểm Chứng Thực Tế & Báo Cáo Nghiệm Thu:**
   - Đảm bảo 100% mã nguồn không chứa mock (`git grep -i "Mock"` trả về 0 kết quả).
   - Kiểm thử đầu cuối với script chạy thật trên Neon PostgreSQL và Upstash Redis: Mã hóa -> Giải mã -> Cấp Lease -> Chặn Concurrency quá hạn mức -> Giải phóng Lease -> Xác nhận Audit Log `SESSION_LEASE_ACQUIRED` và `SESSION_LEASE_RELEASED`.
   - `npx turbo build` thành công mã thoát 0.

---

## 3. Ngoài Phạm Vi (Out of Scope)

- ❌ Không cài đặt HashiCorp Vault Server phần cứng độc lập (sử dụng chuẩn mã hóa AES-256-GCM quản lý trực tiếp qua Postgres và biến môi trường mã hóa).
- ❌ Không phát triển tiện ích mở rộng trình duyệt (Browser Extension) can thiệp cookie bên thứ ba (quản lý phiên qua Redis Lease Mutex an toàn).
- ❌ Không can thiệp API SCIM của nhà cung cấp AI khi chưa có hợp đồng Enterprise chính thức.

---

## 4. Kế Hoạch Phân Rã Nhiệm Vụ (Task Breakdown)

### Nhóm 1: Cơ Sở Dữ Liệu Vault & Mã Hóa AES-256-GCM (Data & Cryptography)
- [ ] Định nghĩa schema Drizzle bảng `vault_credentials` trong `apps/web/src/db/schema.ts`
- [ ] Cập nhật migration script `scripts/migrate.ts` tạo bảng `vault_credentials`
- [ ] Thực thi `npm run db:migrate` áp dụng DDL lên Neon PostgreSQL thật
- [ ] Xây dựng module mã hóa `apps/web/src/lib/vault.ts` hỗ trợ AES-256-GCM (encrypt, decrypt, verify)

### Nhóm 2: Bộ Điều Phối Phiên Động & Concurrency Lease Mutex (Session Broker Engine)
- [ ] Xây dựng module `apps/web/src/lib/session-broker.ts` sử dụng Upstash Redis
- [ ] Xây dựng logic `acquireSessionLease` với kiểm tra trần đồng thời `max_concurrency`
- [ ] Xây dựng logic `releaseSessionLease` thu hồi phiên ngay lập tức
- [ ] Cập nhật Launch Gateway `/api/launch/[grantId]` tự động kiểm tra và chiếm slot phiên trước khi chuyển hướng

### Nhóm 3: Giao Diện Quản Trị Vault Tại Admin Portal (/admin)
- [ ] Thêm các thẻ thống kê tổng quan Vault & Phiên đồng thời đang chạy
- [ ] Xây dựng Server Action `handleCreateVaultCredential` mã hóa và lưu trữ credential vào Neon DB
- [ ] Xây dựng Server Action `handleRotateVaultCredential` và `handleUpdateVaultStatus`
- [ ] Bảng quản lý Shared Vault Credentials hiển thị trạng thái và số phiên active theo thời gian thực từ Redis

### Nhóm 4: Giao Diện Phía Nhân Viên & Trả Phiên (Employee Session Visibility)
- [ ] Hiển thị thông số tải ghế dùng chung (Active Slots / Max Slots) trên thẻ công cụ AI tại trang chủ `/`
- [ ] Thêm chỉ báo phiên đang giữ kèm nút **"Trả slot (Release)"** qua Server Action `handleReleaseSession`
- [ ] Xử lý thông báo lỗi người dùng khi phòng ban hoặc công cụ hết slot truy cập đồng thời (`concurrency_limit_exceeded`)

### Nhóm 5: Kiểm Chứng Toàn Diện & Nghiệm Thu Dữ Liệu Thật (Verification)
- [ ] Chạy `git grep -i "Mock" apps/web/src/` đảm bảo 0 kết quả
- [ ] Viết và chạy script xác thực `scripts/test-phase4-vault.ts` thao tác trực tiếp trên Neon PostgreSQL & Upstash Redis
- [ ] Chạy `npx turbo build` kiểm tra type-safety và build production
- [ ] Tạo báo cáo nghiệm thu `docs/reports/PHASE-4-IMPLEMENTATION-REPORT.md`
