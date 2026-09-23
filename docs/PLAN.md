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
| **1** | **Real Identity, Root Admin & Grants Matrix**<br/>*Thiết lập nền tảng định danh thật 100%, phân quyền Root Admin và cấp/thu hồi quyền truy cập AI có lưu vết kiểm toán.* | 🚧 **Đang nghiệm thu & Deploy** | Đã cấu hình Google OAuth Client ID thật, PostgreSQL Neon managed thật và Upstash Redis thật. |
| **2** | **Service Launch & Direct Access Portal**<br/>*Xây dựng cổng truy cập tập trung cho nhân viên: Khởi chạy trực tiếp các công cụ AI được cấp phép (ChatGPT, Claude, Gemini, Cursor) từ một giao diện duy nhất, tối ưu trải nghiệm làm việc.* | ⏳ Chưa mở | Chỉ mở khi **Phase 1** đã triển khai public thành công trên Vercel, hoạt động ổn định ≥ 1 tuần và có ít nhất 1 người dùng bên ngoài đăng nhập thành công. |
| **3** | **Department Budget & Quota Governance**<br/>*Quản trị chi phí và hạn mức sử dụng AI theo phòng ban (Engineering, Marketing, HR...): Thiết lập trần chi phí hàng tháng, cảnh báo vượt ngưỡng và phân bổ hạn mức công bằng.* | ⏳ Chưa mở | Chỉ mở khi **Phase 2** hoàn thành, hệ thống có nhiều nhân viên thuộc các phòng ban khác nhau cần kiểm soát quota chi phí AI. |
| **4** | **Shared Credential Vault & Dynamic Session Broker**<br/>*Quản trị tài khoản AI bản quyền dùng chung an toàn: Tích hợp kho bảo mật xoay vòng credential tự động, ủy quyền phiên làm việc mà không để lộ mật khẩu gốc cho nhân viên.* | ⏳ Chưa mở | Chỉ mở khi **Phase 3** hoàn thành, tổ chức có tài khoản bản quyền AI trả phí thực tế cần chia sẻ an toàn. |
| **5** | **Enterprise Compliance & WORM Audit Analytics**<br/>*Báo cáo tuân thủ cấp doanh nghiệp: Xuất báo cáo kiểm toán phục vụ chứng chỉ ISO 27001 / SOC 2, biểu đồ trực quan hóa tần suất và hiệu quả sử dụng AI toàn công ty.* | ⏳ Chưa mở | Chỉ mở khi **Phase 4** hoàn thành, dữ liệu kiểm toán hoạt động tích lũy trên 30 ngày và có nhu cầu xuất báo cáo tuân thủ thực tế. |

---

## 3. Quy Tắc Điều Phối & Quản Trị Phạm Vi

1. **Gate Condition Tuyệt Đối:** Các phase chưa mở (`⏳ Chưa mở`) chỉ mang tính định hướng giá trị kinh doanh. Tuyệt đối không đặc tả task kỹ thuật hay viết code giả lập trước cho phase tương lai.
2. **Một Phase Thực Thi Duy Nhất:** Tại mọi thời điểm, chỉ có **duy nhất 1 Phase đang ở trạng thái `🚧`** và toàn bộ task breakdown chi tiết của nó được trình bày độc quyền tại tệp [PHASE.md](./PHASE.md).
3. **Quy trình đóng Phase:** Khi phase hiện tại hoàn thành:
   - Đổi tên `PHASE.md` thành `docs/phases/PHASE-N-IMPLEMENTATION-REPORT.md`.
   - Cập nhật `PLAN.md`: chuyển Phase vừa xong sang `✅ Hoàn thành`, Phase kế tiếp sang `🚧 Đang làm`.
   - Tạo file `PHASE.md` mới cho phase tiếp theo sau khi người dùng xác nhận phạm vi.
