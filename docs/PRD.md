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

## 4. Mô Hình Quản Trị Bản Quyền Thực Tế (Production Shared License Pool Model)

### 4.1 Bản chất chi phí bản quyền AI doanh nghiệp
- Các nhà cung cấp AI lớn (OpenAI ChatGPT Team, Anthropic Claude for Work, Google Workspace Gemini, Cursor Business) tính phí theo mô hình **Per-Seat Licensing** ($20 – $40/user/tháng).
- Nếu doanh nghiệp 100 nhân sự mua 100 tài khoản riêng lẻ, tổng chi phí lên tới $3,000 – $4,000/tháng, trong khi tần suất sử dụng thực tế của phần lớn nhân viên là không liên tục (vài giờ/tuần).

### 4.2 Cơ chế Cổng Dùng Chung Thông Minh (Shared License Pool)
- Doanh nghiệp chỉ cần mua một số lượng giấy phép vừa đủ (ví dụ: mua 5 ghế ChatGPT Team, 3 ghế Claude Pro).
- Quản trị viên (Admin) nhập thông tin tài khoản doanh nghiệp đó vào **Kho Mật Mã Dùng Chung (`vault_credentials`)** trên Cổng Quản Trị, cấu hình số ghế tối đa `maxConcurrency = 5`.
- Cổng Gateway tự động điều phối phiên làm việc cho toàn bộ 100 nhân viên thông qua cơ chế Lease Mutex trên Upstash Redis:
  - Khi nhân viên bấm "Mở công cụ ngay", hệ thống cấp 1 chỗ ngồi (thời hạn 30 phút).
  - Khi hoàn thành công việc, nhân viên bấm "Trả lại chỗ" để nhường ghế cho đồng nghiệp.
  - Nếu ghế đã đầy (5/5 người đang dùng), hệ thống tạm thời báo bận để tránh bị nhà cung cấp khóa tài khoản vì đăng nhập bất thường.

### 4.3 Vòng đời kích hoạt công cụ (Vault Activation Lifecycle)
1. **Chờ kết nối bản quyền (`UNCONFIGURED / PENDING_VAULT`):** Công cụ có trong danh mục mẫu của công ty, nhưng Admin chưa nạp tài khoản doanh nghiệp vào Vault. Giao diện hiển thị nhãn *"Chưa kích hoạt / Chờ Admin kết nối"*, ngăn ngừa nhân viên truy cập nhầm vào liên kết trống.
2. **Đã kích hoạt & Sẵn sàng (`ACTIVE & READY`):** Admin đã nạp tài khoản vào Vault. Nhân viên được cấp quyền thấy trạng thái *"Sẵn sàng (X/Y người đang dùng)"* và có thể mở làm việc ngay.
3. **Đầy ghế (`SEAT_FULL / BUSY`):** Toàn bộ số ghế đồng thời đã có người giữ. Hiển thị nhãn *"Đang bận (X/X người)"* và nhắc nhân viên thử lại sau ít phút.

---

## 5. Tiêu Chí Nghiệm Thu (Definition of Done)

1. Giao diện trực quan mang đúng tông màu **Trầm dịu nhẹ, thanh lịch (Muted Warm Stone & Calming Sage)**.
2. 100% nội dung debug/sandbox bị loại bỏ khỏi giao diện người dùng; các từ ngữ chuyên ngành rườm rà được chuyển vào trang **"Hệ Thống" (`/he-thong`)**.
3. Trang chủ phân biệt rõ ràng giữa công cụ **Đã kích hoạt Vault** (cho phép mở làm việc, hiển thị ghế) và công cụ **Chưa kết nối bản quyền** (hiển thị nhãn chờ Admin).
4. Mọi tính năng cốt lõi (OAuth, Launch Gateway, Upstash Redis Mutex, Vault AES-256-GCM, WORM Trigger) tiếp tục hoạt động chính xác 100% trên hạ tầng thật.
5. Kiểm tra build `npx turbo build` đạt mã 0, không có bất kỳ cảnh báo type hay lint nghiêm trọng nào.
