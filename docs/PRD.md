# Product Requirements Document (PRD)
## Enterprise AI Access Management System — Production Edition

---

## 1. Tầm Nhìn Sản Phẩm & Bài Toán Nghiệp Vụ (Vision & Problem Statement)

Trong môi trường doanh nghiệp hiện đại, việc ứng dụng trí tuệ nhân tạo (Generative AI) là bắt buộc để gia tăng năng suất. Tuy nhiên, việc trang bị và quản trị các công cụ AI (ChatGPT Enterprise/Team, Claude, Gemini Advanced, Cursor Pro...) đang tạo ra nhiều rủi ro lớn:

1. **Rò rỉ bảo mật & Chia sẻ mật khẩu tùy tiện:** Nhân viên dùng chung tài khoản qua chat nội bộ, vi phạm điều khoản nhà cung cấp và rò rỉ dữ liệu nhạy cảm.
2. **Mất kiểm soát ngân sách & Chi phí ẩn:** Các phòng ban chi tiêu tự phát, không có trần ngân sách hoặc cảnh báo vượt hạn mức thời gian thực.
3. **Thiếu khả năng ủy quyền phiên an toàn:** Doanh nghiệp trả phí bản quyền nhóm nhưng không thể điều phối số ghế (seats) đồng thời, dẫn đến nghẽn truy cập hoặc lãng phí license.
4. **Vi phạm tiêu chuẩn kiểm toán doanh nghiệp (Compliance Deficit):** Thiếu nhật ký bất biến (WORM), không có bằng chứng chống sửa đổi cho các kỳ thanh tra ISO 27001, SOC 2.
5. **Trải nghiệm vụng về, mang tính thử nghiệm (Prototype UX):** Giao diện trước đây mang nặng tính chất kiểm thử kỹ thuật (hiển thị bảng DB, câu lệnh SQL, thông báo lỗi nội bộ), chưa đạt tiêu chuẩn sản phẩm thương mại cho người dùng cuối.

**Giải pháp:** Xây dựng một **Nền tảng Quản trị & Phân quyền AI Doanh nghiệp Hoàn chỉnh (Enterprise AI Access & Governance Platform)** đạt chuẩn thương phẩm (Production SaaS), sở hữu ngôn ngữ thiết kế **Mint & Cream** cao cấp, tinh tế, loại bỏ 100% dấu vết thử nghiệm, mang lại trải nghiệm mượt mà cho cả Nhân viên và Quản trị viên.

---

## 2. Đối Tượng Người Dùng & Hành Trình Trải Nghiệm (Target Personas & UX Journeys)

### 2.1. Nhân viên doanh nghiệp (Employee)
- **Định danh nhanh chóng:** Đăng nhập 1-click qua Google OAuth (SSO) doanh nghiệp.
- **Không gian làm việc AI cá nhân hóa:**
  - Nhận diện tức thời phòng ban, hạn mức ngân sách được phân bổ và số công cụ được cấp quyền.
  - Khởi chạy dịch vụ AI an toàn qua Gateway chỉ với 1 click mà không cần biết mật khẩu gốc.
  - Quản lý phiên làm việc dùng chung (giữ ghế / chủ động trả ghế cho đồng nghiệp).
  - Tự động hiển thị Danh mục công cụ doanh nghiệp (Catalog) với tính năng **"Yêu cầu cấp quyền (Request Access)"** khi chưa có quyền, thay vì màn hình trống hoặc thông báo kỹ thuật.

### 2.2. Quản trị viên cấp cao (Root Administrator)
- **Cổng điều hành trung tâm (Executive Admin Portal):**
  - Giám sát toàn cảnh: Số nhân sự, số lượng dịch vụ cấp phép, chi tiêu thực tế của các phòng ban so với trần ngân sách.
  - Quản lý Kho bản quyền dùng chung (Shared Vault) với mã hóa AES-256-GCM, giới hạn số ghế đồng thời (Concurrency Leases Mutex trên Redis) và cơ chế xoay vòng mật khẩu.
  - Cấp phát và thu hồi quyền truy cập tức thời (Instant Provisioning & Revocation).
  - Xuất báo cáo kiểm toán tuân thủ (RFC 4180 CSV & ISO 27001 / SOC 2 JSON) chỉ với 1 thao tác.

---

## 3. Tiêu Chuẩn Thiết Kế & Ngôn Ngữ Trực Quan (Mint & Cream Design System)

Sản phẩm được định hình lại toàn diện về mặt thẩm mỹ theo phong cách **High-End Enterprise SaaS (Linear / Notion / Stripe Aesthetic)**:

* **Tông màu chủ đạo (Color Palette):**
  * **Kem & Ngà Ấm (Warm Cream / Ivory / Alabaster):**
    * Nền trang (Canvas): `#FDFBF7` / `#FAF7F2`
    * Bề mặt thẻ (Surface / Cards): `#FFFFFF` với viền kem nhẹ `#EFE8DC`
    * Bề mặt phụ (Sub-panels): `#F5F0E8`
  * **Xanh nhạt, Xanh ngọt & Ngọc Bích (Pastel Mint / Sweet Sage / Aqua Emerald):**
    * Điểm nhấn thương hiệu (Brand Accent): `#10B981` (Emerald), `#059669` (Dark Mint)
    * Nền trạng thái / Badge: `#ECFDF5` (Mint Cream), `#D1FAE5` (Soft Mint)
    * Đường viền điểm nhấn: `#A7F3D0` / `#6EE7B7`
  * **Độ tương phản chữ (Typography & Contrast):**
    * Tiêu đề & Văn bản chính: Deep Slate Coffee `#1F2937` / `#111827` (dễ đọc, sang trọng)
    * Văn bản phụ (Muted): Warm Charcoal `#6B7280` / `#4B5563`
* **Hình khối & Tương tác:**
  * Bo góc mềm mại (`rounded-2xl`, `rounded-xl`).
  * Đổ bóng phân tầng tinh tế (`shadow-sm`, `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`).
  * Phản hồi tương tác vi mô (micro-interactions, smooth hover transitions, feedback toast).
* **Tuyệt đối không còn yếu tố Prototype:**
  * Xóa bỏ hoàn toàn các khung "CHI TIẾT BẢN GHI POSTGRESQL (TABLE: EMPLOYEES)", "Dữ liệu được truy vấn THẬT", các câu lệnh SQL hay hướng dẫn sửa lỗi cấu hình môi trường hiển thị cho người dùng.

---

## 4. Phạm Vi Nâng Cấp Thành Bản Production (Phase 6 Scope)

1. **Mint & Cream Design System & Typography:**
   - Thay thế theme tối bằng hệ màu Kem ấm kết hợp Xanh ngọt ngào (Pastel Mint & Warm Cream).
   - Thiết lập các component chuẩn doanh nghiệp: Navigation Bar, Profile Dropdown, Stat Cards, Tool Cards, Badges, Modals.
2. **Trải Nghiệm Nhân Viên Hoàn Chỉnh (Employee Experience):**
   - Khu vực "AI Workspace" với các công cụ đã được cấp phép.
   - Khu vực "AI Catalog & Self-Service" cho phép gửi yêu cầu cấp quyền ngay khi tài khoản mới tạo.
   - Đồng bộ trạng thái session tự động nếu người dùng có session hợp lệ nhưng dữ liệu chưa liên kết.
3. **Cổng Quản Trị Doanh Nghiệp Tinh Hoa (Admin Portal Experience):**
   - Thiết kế lại 4 trụ cột: Ngân sách phòng ban, Kho mật mã Vault, Ma trận phân quyền, Báo cáo kiểm toán theo phong cách Mint & Cream.
   - Bộ lọc, tìm kiếm nhân viên và quản lý linh hoạt.
4. **Trung Tâm Tuân Thủ & Phân Tích ROI (Compliance & ROI Center):**
   - Bảng chứng nhận WORM Immutability chuẩn ISO 27001.
   - Chỉ số toàn vẹn SHA-256 100% với giao diện thẩm mỹ cao.
   - Bộ xuất file báo cáo tiện lợi.
5. **Kiểm Thử & Đóng Gói Production:**
   - Đảm bảo 100% không mock class (`git grep -i "Mock"` = 0).
   - `npx turbo build` thành công mã thoát 0.
   - Deploy mượt mà trên Vercel với trải nghiệm hoàn thiện.

---

## 5. Tiêu Chí Nghiệm Thu (Definition of Done)

1. Giao diện trực quan mang đúng tông màu **Kem ấm (#FAF7F2)** và **Xanh ngọt ngào (#10B981, #ECFDF5)**.
2. 100% nội dung debug/sandbox bị loại bỏ khỏi giao diện người dùng.
3. Người dùng mới chưa có quyền được chào đón bằng Catalog công cụ đẹp mắt và nút "Yêu cầu cấp quyền" tiện ích.
4. Mọi tính năng cốt lõi (OAuth, Launch Gateway, Upstash Redis Mutex, Vault AES-256-GCM, WORM Trigger) tiếp tục hoạt động chính xác 100% trên hạ tầng thật.
5. Kiểm tra build `npx turbo build` đạt mã 0, không có bất kỳ cảnh báo type hay lint nghiêm trọng nào.
