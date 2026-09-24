# Phase 6: Enterprise Production Transformation & Mint-Cream UI/UX Overhaul

## 1. Bối Cảnh & Mục Tiêu Nghiệp Vụ (Context & Objective)

Hệ thống đã hoàn tất 100% phần móng hạ tầng kỹ thuật (Real Identity Google OAuth, Launch Gateway, Department Budget, Shared Credential Vault AES-256-GCM, Concurrency Lease Mutex Redis, và WORM Audit Trigger). Tuy nhiên, giao diện hiện tại mang nặng tính chất **Developer Debug Harness** (hiển thị bảng DB thô, câu lệnh SQL, thông báo lỗi cookie/kết nối kỹ thuật) và tông màu tối chưa đạt chuẩn thương phẩm.

**Mục tiêu Phase 6:** Chuyển đổi toàn diện hệ thống thành một **Nền tảng Quản trị & Phân quyền AI Doanh nghiệp Hoàn Chỉnh (Enterprise Production SaaS)**:
1. Áp dụng ngôn ngữ thiết kế **Mint & Cream (Kem ấm #FAF7F2 & Xanh ngọt ngào #10B981, #ECFDF5)** mang lại cảm giác sang trọng, trang nhã, hiện đại tương tự các sản phẩm SaaS hàng đầu thế giới (Linear, Stripe, Notion).
2. Xóa bỏ 100% các khung chẩn đoán debug kỹ thuật hiển thị trên màn hình người dùng.
3. Hoàn thiện trải nghiệm người dùng mới: Khi nhân viên chưa có quyền, cung cấp **Danh mục công cụ AI doanh nghiệp (Self-Service Catalog)** với tính năng **"Yêu cầu cấp quyền (Request Access)"** 1-click, tự động ghi nhận sự kiện `ACCESS_REQUESTED` vào `audit_logs`.
4. Chuẩn hóa trải nghiệm Cổng Quản Trị `/admin` và Trung Tâm Tuân Thủ `/audit` theo tiêu chuẩn Senior Fullstack Developer.

---

## 2. Tiêu Chí Nghiệm Thu (Definition of Done)

- [ ] **Giao Diện Mint & Cream Thống Nhất:** Toàn bộ các trang (`/`, `/admin`, `/audit`, Navigation Bar) sử dụng nền kem ấm (`#FAF7F2`), thẻ trắng sữa viền kem tinh tế (`#EFE8DC`) và các điểm nhấn xanh ngọt ngào (`#10B981`, `#ECFDF5`).
- [ ] **Zero Prototype Elements:** 100% các khung "CHI TIẾT BẢN GHI POSTGRESQL (TABLE: EMPLOYEES)", "Dữ liệu được truy vấn THẬT...", và các câu lệnh SQL bị loại bỏ khỏi giao diện người dùng.
- [ ] **Trải Nghiệm Tự Phục Vụ (Self-Service AI Catalog):** Nhân viên chưa được cấp quyền có thể xem danh mục các công cụ (ChatGPT Team, Claude Enterprise, Gemini Advanced, Cursor Pro) và gửi yêu cầu cấp quyền ngay lập tức.
- [ ] **Giữ Vững 100% Logic Thật:** Mọi luồng xác thực Google OAuth, Launch Gateway, Redis Lease Mutex, Vault AES-256-GCM và WORM Trigger tiếp tục chạy thật trên Neon PostgreSQL và Upstash Redis.
- [ ] **Không Mock:** `git grep -i "Mock" apps/web/src/` cho ra 0 kết quả.
- [ ] **Build Production Thành Công:** `npx turbo build` hoàn tất với mã thoát 0.

---

## 3. Ngoài Phạm Vi (Out of Scope)

- ❌ Không phát triển hệ thống thanh toán qua cổng ngân hàng bên ngoài (Stripe/MoMo) trong phase này.
- ❌ Không thay đổi cấu trúc các bảng cơ sở dữ liệu đã ổn định (`employees`, `departments`, `grants`, `vault_credentials`, `audit_logs`).

---

## 4. Kế Hoạch Phân Rã Nhiệm Vụ (Task Breakdown)

### Nhóm 1: Hệ Thống Design Tokens & Theme Engine Mint & Cream
- [ ] Tinh chỉnh `apps/web/tailwind.config.js` bổ sung bảng màu mint-cream chuẩn cao cấp:
  - `cream`: 50: `#FDFBF7`, 100: `#FAF7F2`, 200: `#F4EFE6`, 300: `#EFE8DC`, 400: `#D8CEBC`
  - `mint`: 50: `#ECFDF5`, 100: `#D1FAE5`, 200: `#A7F3D0`, 300: `#6EE7B7`, 400: `#34D399`, 500: `#10B981`, 600: `#059669`, 700: `#047857`
  - `ink`: 900: `#111827`, 800: `#1F2937`, 700: `#374151`, 600: `#4B5563`, 500: `#6B7280`
- [ ] Cập nhật `apps/web/src/app/globals.css` định nghĩa các utility classes: `bg-cream-canvas`, `card-cream`, `badge-mint`, `btn-mint-primary`, `btn-cream-secondary`.

### Nhóm 2: Cổng Điều Hướng Chung & Dọn Dẹp Prototype (Navigation & Clean Layout)
- [ ] Nâng cấp thanh điều hướng chính `apps/web/src/components/Navbar.tsx` (hoặc header layout):
  - Brand Logo cao cấp "AI Access Gateway • Enterprise Portal" với icon xanh ngọt và kem sang trọng.
  - Trạng thái hệ thống doanh nghiệp (Enterprise SLA Indicator) thay vì hiển thị tên driver DB.
  - Dropdown/Avatar người dùng tinh gọn, liên kết nhanh giữa Cổng Nhân Viên, Quản Trị và Tuân Thủ.
- [ ] Xóa bỏ hoàn toàn khung hiển thị bảng DB `CHI TIẾT BẢN GHI POSTGRESQL` và các banner kỹ thuật.

### Nhóm 3: Không Gian Làm Việc Nhân Viên & Danh Mục Self-Service (`apps/web/src/app/page.tsx`)
- [ ] Xây dựng lại Hero Header Nhân Viên: Tên, avatar, vai trò (`EMPLOYEE` / `ROOT_ADMIN`), phòng ban và chỉ số tóm tắt (Công cụ hoạt động, phiên đang giữ).
- [ ] Xây dựng khu vực "Không Gian Làm Việc AI Của Bạn" (Active AI Workspace):
  - Thẻ dịch vụ AI thiết kế Mint & Cream với biểu tượng thương hiệu sắc nét.
  - Hiển thị tình trạng ghế dùng chung thời gian thực từ Redis (`X/Y slots`).
  - Nút khởi chạy qua Gateway với animation mượt mà.
  - Nút "Trả slot (Release)" khi nhân viên đang giữ ghế.
- [ ] Xây dựng khu vực "Danh Mục Công Cụ Doanh Nghiệp & Yêu Cầu Cấp Quyền" (AI Catalog & Access Request):
  - Hiển thị các công cụ khả dụng trong công ty.
  - Thêm Server Action `handleRequestAccess`: Cho phép nhân viên bấm "Yêu cầu cấp quyền", tự động ghi nhận sự kiện `ACCESS_REQUESTED` vào `audit_logs` có ký SHA-256.

### Nhóm 4: Cổng Quản Trị Doanh Nghiệp Tinh Hoa (`apps/web/src/app/admin/page.tsx`)
- [ ] Chuyển đổi toàn bộ giao diện Cổng Quản Trị sang hệ thiết kế Mint & Cream:
  - Bảng tổng quan KPI với thẻ số liệu tương phản cao, đổ bóng nhẹ.
  - Tab Quản lý Ngân sách phòng ban & Hạn mức chi tiêu.
  - Tab Kho Mật Mã Bản Quyền Dùng Chung (Shared Vault): Thẻ tài khoản mã hóa AES-256-GCM, số ghế trực tiếp từ Redis, nút xoay vòng mật khẩu và tạm dừng/kích hoạt.
  - Tab Ma Trận Phân Quyền Nhân Sự: Tìm kiếm, cấp mới quyền AI với thời hạn, thu hồi tức thì.
  - Nút xuất nhanh báo cáo tuân thủ CSV.

### Nhóm 5: Trung Tâm Tuân Thủ & Phân Tích ROI (`apps/web/src/app/audit/page.tsx`)
- [ ] Tái thiết kế trang Kiểm toán Tuân thủ:
  - Chứng nhận WORM Immutability với thiết kế trang trọng, chuẩn mực.
  - Thước đo toàn vẹn Checksum SHA-256 (100% Verified).
  - Thẻ tính toán ROI doanh nghiệp (Thời gian tiết kiệm, giá trị kinh tế).
  - Thanh phân bổ sự kiện màu pastel và bộ lọc sự kiện trực quan.
  - Nút xuất CSV (RFC 4180) và ISO 27001 / SOC 2 JSON.

### Nhóm 6: Kiểm Chứng Toàn Diện & Nghiệm Thu
- [ ] Kiểm tra 0 mock: `git grep -i "Mock" apps/web/src/`.
- [ ] Kiểm tra TypeScript compilation: `npx tsc --noEmit`.
- [ ] Chạy `npx turbo build` đảm bảo mã thoát 0.
- [ ] Lập báo cáo nghiệm thu `docs/reports/PHASE-6-IMPLEMENTATION-REPORT.md`.
