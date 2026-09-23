# Active Phase Specification (PHASE)
## Giai Đoạn 5: Enterprise Compliance & WORM Audit Analytics
### Báo Cáo Tuân Thủ Doanh Nghiệp & Phân Tích Kiểm Toán Bất Biến WORM

---

## 1. Mục Tiêu Duy Nhất Của Phase

> Thiết lập cơ chế kiểm toán bất biến chuẩn WORM (Write-Once-Read-Many) với PostgreSQL Trigger chống sửa/xóa dữ liệu và mã băm toàn vẹn SHA-256 (Cryptographic Hash Chain), xây dựng bộ công cụ xuất báo cáo tuân thủ phục vụ chứng chỉ ISO 27001 / SOC 2 (CSV & JSON format), cùng bảng điều khiển phân tích hiệu quả đầu tư AI (Executive ROI & Compliance Analytics Dashboard) trên hạ tầng Neon PostgreSQL thật 100%.

---

## 2. Phạm Vi Thực Hiện (In Scope)

1. **Chuẩn Hóa Kiểm Toán Bất Biến WORM & Cryptographic Checksum (Data & Database Layer):**
   - Bổ sung cột `checksum` (varchar 64) vào bảng `audit_logs` để lưu mã băm toàn vẹn SHA-256 tính toán từ `actor_id + action + target_id + metadata + created_at`.
   - Thiết lập PostgreSQL Function và Trigger `trg_audit_logs_immutable` trên Neon PostgreSQL: Chặn 100% các câu lệnh `UPDATE` và `DELETE` trên bảng `audit_logs`, ném lỗi Exception nếu có bất kỳ hành vi can thiệp nào vào lịch sử kiểm toán.
   - Xây dựng module kiểm toán `apps/web/src/lib/audit.ts` tự động tính toán mã băm SHA-256 khi ghi log và cung cấp hàm kiểm tra tính toàn vẹn (Integrity Chain Validator).
   - Migration DDL tự động qua `scripts/migrate.ts`.

2. **Cổng Xuất Báo Cáo Tuân Thủ Doanh Nghiệp (/api/audit/export):**
   - Xây dựng Route Handler `/api/audit/export`:
     - Định dạng CSV chuẩn RFC 4180 (`?format=csv`): Xuất đầy đủ lịch sử kiểm toán với tiêu đề, timestamp, actor, action, target, metadata và checksum để nộp cho đơn vị đánh giá kiểm toán độc lập.
     - Định dạng JSON Compliance Package (`?format=json`): Xuất gói chứng thực tuân thủ ISO 27001 / SOC 2 bao gồm tóm tắt số liệu, tổng số sự kiện, tỷ lệ toàn vẹn băm 100% và danh sách bản ghi.
     - Bảo vệ phân quyền: Chỉ Root Administrator hoặc phiên người dùng hợp lệ mới được phép xuất dữ liệu.

3. **Bảng Điều Khiển Phân Tích Tuân Thủ & ROI Doanh Nghiệp (/audit):**
   - Nâng cấp toàn diện trang `/audit` thành **Compliance & Audit Analytics Suite**:
     - **Thẻ WORM Integrity Badge:** Hiển thị chứng thực trạng thái bất biến WORM (PostgreSQL Trigger Active) và tỷ lệ toàn vẹn dữ liệu (100% Verified).
     - **Chỉ Số Phân Tích ROI Doanh Nghiệp:**
       - Tổng số sự kiện kiểm toán được ghi nhận.
       - Tổng số lượt hoàn thành tác vụ với công cụ AI.
       - Ước tính thời gian tiết kiệm cho nhân sự (~20 phút/lượt launch).
       - Tỷ suất ROI kinh tế (Quy đổi giá trị thời gian tiết kiệm so với chi phí tiêu hao AI).
     - **Biểu Đồ Phân Phối Sự Kiện (Event Breakdown):** Tỷ lệ các nhóm hành vi (Launch, Grants, Vault Access, Security Alerts).
     - **Bộ Lọc Sự Kiện (Audit Filter):** Lọc theo phân loại hành động (`ALL`, `AI_SERVICE_LAUNCHED`, `SESSION_LEASE_ACQUIRED`, `GRANT_ISSUED`, `BUDGET_THRESHOLD_ALERT`, `ROOT_ADMIN_LOGIN`).
     - **Nút Xuất Báo Cáo:** Tích hợp nút tải CSV và JSON trực tiếp ngay trên giao diện.

4. **Tích Hợp Giao Diện Quản Trị (/admin):**
   - Bổ sung nút truy cập nhanh "Xuất Báo Cáo Tuân Thủ (Compliance Export)" trên Admin Portal.
   - Hiển thị tóm tắt trạng thái toàn vẹn WORM trong khu vực kiểm toán.

5. **Kiểm Chứng Toàn Diện & Nghiệm Thu Dữ Liệu Thật:**
   - Đảm bảo 100% mã nguồn không mock (`git grep -i "Mock"` trả về 0 kết quả).
   - Viết và chạy script xác thực `scripts/test-phase5-compliance.ts` trực tiếp trên Neon PostgreSQL:
     - Thử thực thi lệnh `UPDATE` hoặc `DELETE` trên `audit_logs` -> Xác nhận PostgreSQL Trigger chặn đứng và ném lỗi WORM Exception!
     - Kiểm tra hàm tính toán `checksum` SHA-256 và xác thực toàn vẹn 100% bản ghi.
     - Kiểm thử tải file CSV và JSON từ `/api/audit/export`.
   - `npx turbo build` hoàn tất với mã thoát 0.
   - Lập báo cáo nghiệm thu `docs/reports/PHASE-5-IMPLEMENTATION-REPORT.md`.

---

## 3. Ngoài Phạm Vi (Out of Scope)

- ❌ Không liên kết API nộp trực tiếp lên cơ quan cấp chứng chỉ (xuất file chuẩn để doanh nghiệp nộp trong kỳ đánh giá kiểm toán).
- ❌ Không can thiệp sửa đổi các bản ghi kiểm toán lịch sử đã tồn tại (tuân thủ nguyên tắc WORM bất biến).

---

## 4. Kế Hoạch Phân Rã Nhiệm Vụ (Task Breakdown)

### Nhóm 1: Cơ Sở Dữ Liệu WORM & Checksum Bất Biến (Data & WORM Policy)
- [x] Mở rộng bảng `audit_logs` thêm cột `checksum VARCHAR(64)` trong `apps/web/src/db/schema.ts`
- [x] Cập nhật migration script `scripts/migrate.ts`: Thêm cột `checksum`, tạo trigger `trg_audit_logs_immutable` chặn `UPDATE/DELETE`
- [x] Thực thi `npm run db:migrate` áp dụng WORM trigger lên Neon PostgreSQL thật
- [x] Xây dựng module kiểm toán `apps/web/src/lib/audit.ts` hỗ trợ tính checksum SHA-256 và hàm xác thực toàn vẹn `verifyAuditIntegrity`

### Nhóm 2: API Xuất Báo Cáo Tuân Thủ Chuẩn Doanh Nghiệp (Compliance Export Engine)
- [x] Xây dựng Route Handler `/api/audit/export/route.ts` hỗ trợ định dạng `?format=csv` (RFC 4180)
- [x] Bổ sung hỗ trợ định dạng `?format=json` (Gói chứng thực ISO 27001 / SOC 2 Compliance Package)
- [x] Kiểm tra xác thực phân quyền an toàn khi xuất báo cáo

### Nhóm 3: Bảng Phân Tích ROI & Trực Quan Hóa Tuân Thủ Tại /audit (Compliance Dashboard)
- [x] Nâng cấp giao diện `/audit`:
  - [x] Thẻ chứng nhận WORM Immutability & Checksum Status
  - [x] Thẻ phân tích ROI (Giờ làm việc tiết kiệm, giá trị kinh tế tạo ra)
  - [x] Biểu đồ phân bổ tỷ lệ các loại sự kiện (Event Distribution)
  - [x] Bộ lọc sự kiện theo phân loại (Category Filter)
  - [x] Nút bấm xuất nhanh CSV và JSON Compliance Package

### Nhóm 4: Tích Hợp Kiểm Toán & Báo Cáo Tại Admin Portal (/admin)
- [x] Bổ sung liên kết xuất báo cáo tuân thủ nhanh trên header Admin Portal
- [x] Cập nhật module Launch Gateway và các Server Actions để ghi `checksum` SHA-256 cho mọi bản ghi audit mới

### Nhóm 5: Kiểm Chứng & Nghiệm Thu Toàn Diện (Verification)
- [x] Chạy `git grep -i "Mock" apps/web/src/` đảm bảo 0 kết quả
- [x] Viết và chạy script xác thực `scripts/test-phase5-compliance.ts` chứng minh WORM trigger chặn lệnh sửa/xóa và verify toàn vẹn checksum trên Neon PostgreSQL
- [x] Chạy `npx turbo build` kiểm tra type-safety và build production
- [x] Tạo báo cáo nghiệm thu `docs/reports/PHASE-5-IMPLEMENTATION-REPORT.md`
