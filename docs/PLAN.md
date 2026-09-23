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
| **2** | **Service Launch & Direct Access Portal**<br/>*Xây dựng cổng truy cập tập trung cho nhân viên: Khởi chạy trực tiếp các công cụ AI được cấp phép (ChatGPT, Claude, Gemini, Cursor) từ một giao diện duy nhất, tối ưu trải nghiệm làm việc.* | 🚧 **Kế tiếp (Chờ xác nhận phạm vi)** | Phase 1 đã hoàn thành nghiệm thu dữ liệu thật. |
| **3** | **Department Budget & Quota Governance**<br/>*Quản trị chi phí và hạn mức sử dụng AI theo phòng ban (Engineering, Marketing, HR...): Thiết lập trần chi phí hàng tháng, cảnh báo vượt ngưỡng và phân bổ hạn mức công bằng.* | ⏳ Chưa mở | Chỉ mở khi **Phase 2** hoàn thành, hệ thống có nhiều nhân viên thuộc các phòng ban khác nhau cần kiểm soát quota chi phí AI. |
| **4** | **Shared Credential Vault & Dynamic Session Broker**<br/>*Quản trị tài khoản AI bản quyền dùng chung an toàn: Tích hợp kho bảo mật xoay vòng credential tự động, ủy quyền phiên làm việc mà không để lộ mật khẩu gốc cho nhân viên.* | ⏳ Chưa mở | Chỉ mở khi **Phase 3** hoàn thành, tổ chức có tài khoản bản quyền AI trả phí thực tế cần chia sẻ an toàn. |
| **5** | **Enterprise Compliance & WORM Audit Analytics**<br/>*Báo cáo tuân thủ cấp doanh nghiệp: Xuất báo cáo kiểm toán phục vụ chứng chỉ ISO 27001 / SOC 2, biểu đồ trực quan hóa tần suất và hiệu quả sử dụng AI toàn công ty.* | ⏳ Chưa mở | Chỉ mở khi **Phase 4** hoàn thành, dữ liệu kiểm toán hoạt động tích lũy trên 30 ngày và có nhu cầu xuất báo cáo tuân thủ thực tế. |

---

## 3. Các Cột Mốc Năng Lực Nghiệp Vụ (Key Business Deliverables)

Để định hình rõ giá trị nền tảng doanh nghiệp nhưng vẫn tuân thủ nguyên tắc không đặc tả mã nguồn sớm, mỗi giai đoạn được xác lập các cột mốc năng lực nghiệp vụ cấp cao như sau:

### Phase 1: Real Identity, Root Admin & Grants Matrix (🚧 Đang nghiệm thu & Deploy)
> *Task breakdown chi tiết: Xem độc quyền tại [docs/PHASE.md](./PHASE.md) và [task.md](../task.md).*
- **Cột mốc M1.1:** Đăng nhập Single Sign-On (SSO) bằng Google OAuth 2.0 thật 100%.
- **Cột mốc M1.2:** Cơ chế nhận diện tự động vai trò Quản trị viên tối cao (Root Administrator) và Nhân viên (Employee).
- **Cột mốc M1.3:** Cổng Quản trị phân quyền (Admin Portal): Cấp quyền công cụ AI (ChatGPT, Claude, Gemini, Cursor) theo thời hạn và thu hồi quyền tức thì.
- **Cột mốc M1.4:** Nhật ký kiểm toán minh bạch trên PostgreSQL thật và cơ chế bảo vệ tần suất bằng Upstash Redis.

### Phase 2: Service Launch & Direct Access Portal (⏳ Chưa mở)
- **Cột mốc M2.1 (AI Launcher Hub):** Cổng khởi chạy tập trung hiển thị trực quan các dịch vụ AI được cấp phép, phân nhóm theo lĩnh vực (Lập trình, Sáng tạo nội dung, Phân tích dữ liệu, Thiết kế).
- **Cột mốc M2.2 (Controlled Direct Access):** Cơ chế điều hướng và ủy quyền truy cập an toàn, giảm thiểu thao tác đăng nhập thủ công cho nhân viên.
- **Cột mốc M2.3 (Usage Heartbeat):** Ghi nhận tần suất kích hoạt dịch vụ của nhân viên phục vụ đánh giá mức độ đón nhận công cụ trong doanh nghiệp.

### Phase 3: Department Budget & Quota Governance (⏳ Chưa mở)
- **Cột mốc M3.1 (Organization Hierarchy):** Quản lý cơ cấu tổ chức theo phòng ban và nhóm dự án (Engineering, Marketing, Product, Operations...).
- **Cột mốc M3.2 (Department Budget Policy):** Thiết lập định mức chi phí AI hàng tháng cho từng phòng ban, ngăn chặn chi tiêu vượt tầm kiểm soát.
- **Cột mốc M3.3 (Threshold Alerts):** Cảnh báo ngưỡng ngân sách tự động cho trưởng bộ phận khi mức sử dụng đạt 80% và 100%.
- **Cột mốc M3.4 (Cost Allocation Report):** Báo cáo phân bổ chi phí AI minh bạch cho ban giám đốc và phòng kế toán.

### Phase 4: Shared Credential Vault & Dynamic Session Broker (⏳ Chưa mở)
- **Cột mốc M4.1 (Zero-Knowledge Shared Store):** Kho lưu trữ bảo mật thông tin đăng nhập dùng chung, mã hóa an toàn.
- **Cột mốc M4.2 (Session Injection Broker):** Cơ chế chia sẻ phiên làm việc an toàn cho nhân viên mà không để lộ mật khẩu gốc của tài khoản doanh nghiệp.
- **Cột mốc M4.3 (Automatic Credential Rotation):** Tự động thu hồi phiên và kích hoạt xoay vòng khóa bí mật theo chu kỳ bảo mật.
- **Cột mốc M4.4 (Concurrency Management):** Giới hạn số lượng nhân viên truy cập đồng thời trên mỗi tài khoản bản quyền nhóm.

### Phase 5: Enterprise Compliance & WORM Audit Analytics (⏳ Chưa mở)
- **Cột mốc M5.1 (WORM Immutable Log):** Chuẩn hóa nhật ký kiểm toán bất biến (Write Once, Read Many), chống sửa đổi và giả mạo dữ liệu.
- **Cột mốc M5.2 (Compliance Audit Export):** Xuất báo cáo kiểm toán định dạng chuẩn doanh nghiệp phục vụ đánh giá chứng chỉ ISO 27001 / SOC 2.
- **Cột mốc M5.3 (Executive ROI Dashboard):** Biểu đồ phân tích hiệu quả đầu tư AI (ROI), đo lường thời gian tiết kiệm và mức độ ứng dụng AI toàn công ty.
- **Cột mốc M5.4 (Data Retention Policy):** Quy chuẩn lưu trữ và xóa dữ liệu kiểm toán định kỳ theo luật an toàn thông tin.

---

## 4. Quy Tắc Điều Phối & Quản Trị Phạm Vi

1. **Gate Condition Tuyệt Đối:** Các phase chưa mở (`⏳ Chưa mở`) chỉ mang tính định hướng giá trị kinh doanh. Tuyệt đối không đặc tả task kỹ thuật hay viết code giả lập trước cho phase tương lai.
2. **Một Phase Thực Thi Duy Nhất:** Tại mọi thời điểm, chỉ có **duy nhất 1 Phase đang ở trạng thái `🚧`** và toàn bộ task breakdown chi tiết của nó được trình bày độc quyền tại tệp [PHASE.md](./PHASE.md).
3. **Quy trình đóng Phase:** Khi phase hiện tại hoàn thành:
   - Đổi tên `PHASE.md` thành `docs/phases/PHASE-N-IMPLEMENTATION-REPORT.md`.
   - Cập nhật `PLAN.md`: chuyển Phase vừa xong sang `✅ Hoàn thành`, Phase kế tiếp sang `🚧 Đang làm`.
   - Tạo file `PHASE.md` mới cho phase tiếp theo sau khi người dùng xác nhận phạm vi.
