# Project Roadmap Plan (PLAN)
## Enterprise AI Access Management System — Business Platform Edition

Tài liệu này xác lập lộ trình phát triển toàn diện của hệ thống từ một lát cắt định danh thực tế (Vertical Slice) tiến tới một **Nền tảng Quản trị & Phân quyền AI Doanh nghiệp (Enterprise AI Access & Governance Platform)** hoàn chỉnh.

Quản lý theo triết lý **Lean Architecture & Real Infrastructure**: Mỗi giai đoạn giải quyết một bài toán nghiệp vụ rõ ràng, chỉ mở khi giai đoạn trước đó đã hoàn tất và vượt qua tiêu chí kiểm chứng thực tế 100%.

---

## 1. Tầm Nhìn Nền Tảng Doanh Nghiệp (Business Platform Vision)

Nền tảng hướng đến giải quyết trọn vẹn 4 trụ cột quản trị AI trong tổ chức:
1. **Identity & Access Management (IAM):** Đăng nhập một lần (SSO) an toàn, phân tách vai trò quản trị (Admin) và người dùng cuối (Employee).
2. **Granular Grant Matrix:** Cấp phát và thu hồi quyền sử dụng dịch vụ AI theo thời hạn và mục đích công việc.
3. **Budget & Cost Governance:** Kiểm soát ngân sách, định mức chi phí AI theo từng phòng ban/dự án.
4. **Audit Trail & Enterprise Compliance:** Lưu vết kiểm toán minh bạch, bất biến phục vụ an toàn thông tin và tuân thủ tiêu chuẩn doanh nghiệp.

---

## 2. Bảng Lộ Trình Phát Triển Toàn Diện (Business Roadmap)

| Phase | Tên Giai Đoạn & Giá Trị Nghiệp Vụ | Trạng Thái | Điều Kiện Kích Hoạt / Mở Phase |
|:---:|---|:---:|---|
| **1** | **Real Identity, Root Admin & Grants Matrix**<br/>*Thiết lập nền tảng định danh thật 100%, phân quyền Root Admin và cấp/thu hồi quyền truy cập AI có lưu vết kiểm toán.* | ✅ **Hoàn thành** | Đã nghiệm thu dữ liệu thực tế trên Neon PostgreSQL, Upstash Redis và Google OAuth. |
| **2** | **Service Launch & Direct Access Portal**<br/>*Xây dựng cổng truy cập tập trung cho nhân viên: Khởi chạy trực tiếp các công cụ AI được cấp phép (ChatGPT, Claude, Gemini, Cursor) từ một giao diện duy nhất, tối ưu trải nghiệm làm việc.* | ✅ **Hoàn thành** | Đã nghiệm thu tính năng Launch Gateway, đo lường lượt dùng và nhật ký AI_SERVICE_LAUNCHED trên Neon PostgreSQL. |
| **3** | **Department Budget & Quota Governance**<br/>*Quản trị chi phí và hạn mức sử dụng AI theo phòng ban (Engineering, Marketing, HR...): Thiết lập trần chi phí hàng tháng, cảnh báo vượt ngưỡng và phân bổ hạn mức công bằng.* | ✅ **Hoàn thành** | Đã nghiệm thu schema phòng ban, tính toán chi phí thực tế, cảnh báo vượt ngưỡng BUDGET_THRESHOLD_ALERT trên Neon PostgreSQL. |
| **4** | **Shared Credential Vault & Dynamic Session Broker**<br/>*Quản trị tài khoản AI bản quyền dùng chung an toàn: Tích hợp kho bảo mật xoay vòng credential tự động, ủy quyền phiên làm việc mà không để lộ mật khẩu gốc cho nhân viên.* | ✅ **Hoàn thành** | Đã nghiệm thu mã hóa AES-256-GCM, quản lý Vault tại /admin, Concurrency Lease Mutex trên Upstash Redis và tính năng trả slot trên Employee Hub. |
| **5** | **Enterprise Compliance & WORM Audit Analytics**<br/>*Báo cáo tuân thủ cấp doanh nghiệp: Xuất báo cáo kiểm toán phục vụ chứng chỉ ISO 27001 / SOC 2, biểu đồ trực quan hóa tần suất và hiệu quả sử dụng AI toàn công ty.* | ✅ **Hoàn thành** | Đã nghiệm thu trigger WORM chặn sửa/xóa trên PostgreSQL, băm mật mã học SHA-256, API xuất báo cáo CSV/JSON và giao diện ROI tại /audit. |
| **6** | **Enterprise Production Transformation & Mint-Cream UI/UX Overhaul**<br/>*Chuyển đổi toàn diện sản phẩm thành bản Production thương mại: Áp dụng hệ thiết kế Mint & Cream cao cấp, loại bỏ hoàn toàn các khung debug/sandbox, hoàn thiện trải nghiệm yêu cầu cấp quyền và tối ưu luồng người dùng.* | ✅ **Hoàn thành** | Đã nghiệm thu hệ thiết kế Mint & Cream, xóa bỏ debug panel, build thành công và xuất báo cáo nghiệm thu Phase 6. |

---

## 3. Các Cột Mốc Năng Lực Nghiệp Vụ (Key Business Deliverables)

Để định hình rõ giá trị nền tảng doanh nghiệp nhưng vẫn tuân thủ nguyên tắc không đặc tả mã nguồn sớm, mỗi giai đoạn được xác lập các cột mốc năng lực nghiệp vụ cấp cao như sau:

### Phase 1: Real Identity, Root Admin & Grants Matrix (✅ Hoàn thành)
> *Báo cáo nghiệm thu chi tiết: Xem tại [docs/reports/PHASE-1-IMPLEMENTATION-REPORT.md](./reports/PHASE-1-IMPLEMENTATION-REPORT.md).*

### Phase 2: Service Launch & Direct Access Portal (✅ Hoàn thành)
> *Báo cáo nghiệm thu chi tiết: Xem tại [docs/reports/PHASE-2-IMPLEMENTATION-REPORT.md](./reports/PHASE-2-IMPLEMENTATION-REPORT.md).*

### Phase 3: Department Budget & Quota Governance (✅ Hoàn thành)
> *Báo cáo nghiệm thu chi tiết: Xem tại [docs/reports/PHASE-3-IMPLEMENTATION-REPORT.md](./reports/PHASE-3-IMPLEMENTATION-REPORT.md).*

### Phase 4: Shared Credential Vault & Dynamic Session Broker (✅ Hoàn thành)
> *Báo cáo nghiệm thu chi tiết: Xem tại [docs/reports/PHASE-4-IMPLEMENTATION-REPORT.md](./reports/PHASE-4-IMPLEMENTATION-REPORT.md).*
- **Cột mốc M4.1 (Zero-Knowledge Shared Store):** Kho lưu trữ bảo mật thông tin đăng nhập dùng chung `vault_credentials` trên Neon PostgreSQL, mã hóa AES-256-GCM với Auth Tag 128-bit chống giả mạo.
- **Cột mốc M4.2 (Session Injection Broker):** Cơ chế chia sẻ phiên làm việc an toàn cho nhân viên qua Launch Gateway mà không để lộ mật khẩu gốc của tài khoản doanh nghiệp.
- **Cột mốc M4.3 (Automatic Credential Rotation):** Tính năng xoay vòng mật khẩu `handleRotateVaultCredential`, tự động cập nhật mốc `lastRotatedAt` và lưu vết kiểm toán.
- **Cột mốc M4.4 (Concurrency Management):** Giới hạn số lượng nhân viên truy cập đồng thời qua Upstash Redis Lease Mutex, tự động chặn khi đầy chỗ và cho phép trả slot tự nguyện.

### Phase 5: Enterprise Compliance & WORM Audit Analytics (✅ Hoàn thành)
> *Báo cáo nghiệm thu chi tiết: Xem tại [docs/reports/PHASE-5-IMPLEMENTATION-REPORT.md](./reports/PHASE-5-IMPLEMENTATION-REPORT.md).*
- **Cột mốc M5.1 (WORM Immutable Log):** Chuẩn hóa nhật ký kiểm toán bất biến (Write Once, Read Many) với Database Trigger `trg_audit_logs_immutable` chặn 100% lệnh `UPDATE` & `DELETE`.
- **Cột mốc M5.2 (Cryptographic Integrity):** Chữ ký băm SHA-256 tất định cho từng bản ghi audit log, chống chối bỏ và đối soát toàn vẹn dữ liệu tự động.
- **Cột mốc M5.3 (Compliance Audit Export):** Route Handler `/api/audit/export` xuất báo cáo kiểm toán định dạng RFC 4180 CSV và gói chứng thực ISO 27001 / SOC 2 JSON.
- **Cột mốc M5.4 (Executive ROI Dashboard):** Bảng điều khiển `/audit` phân tích thời gian tiết kiệm (~20 phút/phiên), giá trị kinh tế ($40/h), biểu đồ phân bổ sự kiện và bộ lọc danh mục.

### Phase 6: Enterprise Production Transformation & Mint-Cream UI/UX Overhaul (✅ Hoàn thành)
> *Báo cáo nghiệm thu chi tiết: Xem tại [docs/reports/PHASE-6-IMPLEMENTATION-REPORT.md](./reports/PHASE-6-IMPLEMENTATION-REPORT.md).*
- **Cột mốc M6.1 (Mint & Cream Design Tokens & Theme Engine):** Tái cấu trúc Tailwind và CSS sang bảng màu kem ấm và xanh ngọt ngào cao cấp (`#FAF7F2`, `#10B981`, `#ECFDF5`).
- **Cột mốc M6.2 (Clean Production Navigation & Layout):** Loại bỏ 100% bảng hiển thị debug PostgreSQL, câu lệnh SQL và thông báo kỹ thuật nội bộ khỏi giao diện người dùng.
- **Cột mốc M6.3 (Employee Workspace & Self-Service Catalog):** Nâng cấp trang chủ `/` thành không gian làm việc AI danh giá với thẻ công cụ tương tác, chỉ số cá nhân, và tính năng "Yêu cầu cấp quyền (Request Access)" tự phục vụ khi chưa có quyền.
- **Cột mốc M6.4 (Executive Admin Portal & Compliance Polish):** Tái thiết kế toàn bộ `/admin` và `/audit` theo chuẩn thẩm mỹ Senior Fullstack Developer, mang lại trải nghiệm SaaS thương mại đẳng cấp.

---

## 4. Quy Tắc Điều Phối & Quản Trị Phạm Vi

1. **Gate Condition Tuyệt Đối:** Các phase chưa mở (`⏳ Chưa mở`) chỉ mang tính định hướng giá trị kinh doanh. Tuyệt đối không đặc tả task kỹ thuật hay viết code giả lập trước cho phase tương lai.
2. **Một Phase Thực Thi Duy Nhất:** Tại mọi thời điểm, chỉ có **duy nhất 1 Phase đang ở trạng thái `🚧`** và toàn bộ task breakdown chi tiết của nó được trình bày độc quyền tại tệp [PHASE.md](./PHASE.md).
3. **Quy trình đóng Phase:** Khi phase hiện tại hoàn thành:
   - Đổi tên `PHASE.md` thành `docs/phases/PHASE-N-IMPLEMENTATION-REPORT.md`.
   - Cập nhật `PLAN.md`: chuyển Phase vừa xong sang `✅ Hoàn thành`, Phase kế tiếp sang `🚧 Đang làm`.
   - Tạo file `PHASE.md` mới cho phase tiếp theo sau khi người dùng xác nhận phạm vi.
