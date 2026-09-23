# Product Requirements Document (PRD)
## Enterprise AI Access Management System

---

## 1. Vấn Đề Thực Tế (Problem Statement)

Trong môi trường doanh nghiệp hiện nay, nhu cầu sử dụng các công cụ trí tuệ nhân tạo (như ChatGPT, Claude, Gemini, Cursor) đang bùng nổ. Tuy nhiên, các tổ chức đối mặt với những rủi ro vận hành và bảo mật nghiêm trọng:

1. **Chia sẻ tài khoản bừa bãi:** Nhân viên thường dùng chung tài khoản hoặc mật khẩu chia sẻ qua ứng dụng chat nội bộ, gây nguy cơ rò rỉ dữ liệu doanh nghiệp.
2. **Thiếu khả năng phân quyền tập trung:** Quản lý không nắm được chính xác nhân viên nào đang được phép sử dụng công cụ AI nào, hạn mức và thời hạn đến khi nào.
3. **Mất dấu vết kiểm toán (Audit Trail):** Khi xảy ra sự cố dữ liệu hoặc cần rà soát chi phí, tổ chức không có nhật ký lưu lại ai đã truy cập, ai đã cấp quyền và vào thời điểm nào.
4. **Không thể thu hồi quyền tức thời:** Khi nhân viên thay đổi dự án hoặc nghỉ việc, quyền truy cập vào các công cụ AI trả phí không được ngắt kịp thời.

---

## 2. Đối Tượng Người Dùng (Target Personas)

### 2.1. Nhân viên doanh nghiệp (Employee)
- **Mong muốn:** Đăng nhập nhanh chóng, an toàn bằng tài khoản Google công việc của chính mình (Single Sign-On).
- **Trải nghiệm:** Xem rõ ràng danh sách các công cụ AI mà tổ chức đã phê duyệt và cấp quyền cho mình, sẵn sàng sử dụng trong công việc hàng ngày mà không cần hỏi xin mật khẩu dùng chung.

### 2.2. Quản trị viên hệ thống (Root Administrator)
- **Mong muốn:** Quản lý tập trung toàn bộ danh bạ nhân sự và quyền sử dụng dịch vụ AI.
- **Trải nghiệm:** Truy cập Cổng Quản Trị để cấp quyền cho nhân viên theo từng công cụ cụ thể (kèm thời hạn nếu có), thu hồi quyền ngay lập tức khi cần, và tra cứu nhật ký kiểm toán minh bạch của toàn hệ thống.

---

## 3. Phạm Vi Sản Phẩm Hiện Tại (Current Scope)

Hệ thống hiện tại tập trung hoàn toàn vào luồng nghiệp vụ cốt lõi, trung thực và chạy trên hạ tầng thực tế 100%:

1. **Đăng nhập định danh thực tế:** Người dùng đăng nhập trực tiếp bằng tài khoản Google cá nhân hoặc doanh nghiệp thông qua giao thức chuẩn Google OAuth 2.0.
2. **Nhận diện vai trò tự động:** Hệ thống tự động nhận diện tài khoản Quản trị viên tối cao (Root Administrator) dựa trên email quản trị đã định cấu hình. Tất cả người dùng còn lại mặc định nhận vai trò Nhân viên (Employee).
3. **Cổng Quản Trị phân quyền (Admin Portal):**
   - Chỉ cho phép Quản trị viên truy cập; chặn mọi hành vi truy cập trái phép từ phía nhân viên với thông báo từ chối truy cập rõ ràng.
   - Hiển thị danh bạ toàn bộ nhân viên đã từng tham gia hệ thống.
   - Biểu mẫu cấp quyền sử dụng dịch vụ AI (chọn nhân viên, chọn công cụ như ChatGPT, Claude, Gemini, Cursor; chọn thời hạn hiệu lực).
   - Danh sách theo dõi trạng thái các quyền đã cấp và nút thu hồi quyền tức thì.
4. **Trang tổng quan cho nhân viên (Employee Dashboard):**
   - Hiển thị thông tin hồ sơ cá nhân đã được xác thực từ cơ sở dữ liệu.
   - Hiển thị danh mục các dịch vụ AI đang ở trạng thái kích hoạt mà nhân viên được phép sử dụng.
5. **Nhật ký kiểm toán minh bạch (Audit Logging):** Tự động ghi lại các sự kiện quan trọng (đăng nhập, cấp quyền, thu hồi quyền) với thời gian, người thực hiện và đối tượng nhận tác động.
6. **Bảo vệ an toàn tần suất (Rate Limiting):** Tự động giới hạn số lần yêu cầu đăng nhập trên mỗi địa chỉ mạng nhằm bảo vệ hệ thống khỏi các hành vi lạm dụng.

---

## 4. Ngoài Phạm Vi Hiện Tại (Explicit Non-Goals)

Những tính năng dưới đây được **chủ động hoãn lại** để giữ hệ thống gọn gàng, trung thực và chỉ mở ra khi có nhu cầu cùng điều kiện thực tế tương ứng:

| Tính năng ngoài phạm vi | Lý do hoãn có chủ đích | Điều kiện để mở lại |
|---|---|---|
| **Kho bí mật & Quản lý API Key (Vault/SecretStore)** | Hệ thống hiện tại chỉ quản lý danh tính và quyền hạn, chưa trực tiếp lưu giữ khóa bí mật bên thứ ba. | Khi có credential trả phí thực tế cần cơ chế xoay vòng và bảo mật phần cứng. |
| **Đồng bộ tự động tài khoản AI (SSO/SCIM với OpenAI, Anthropic)** | Các nhà cung cấp AI chỉ mở giao thức SCIM/Admin API cho gói doanh nghiệp lớn (Enterprise). | Khi có tài khoản hợp đồng Enterprise thực tế để kiểm thử API chính thức. |
| **Kho tài khoản dùng chung (Seat Pooling / Lease Mutex)** | Triết lý hiện tại khuyến khích cấp quyền minh bạch theo từng cá nhân, không cổ vũ việc lách cơ chế chia sẻ tài khoản. | Khi xuất hiện mô hình chia sẻ tài khoản có kiểm soát được phê duyệt. |
| **Ứng dụng mở rộng trình duyệt (Browser Extension)** | Trọng tâm là nền tảng quản trị web trực tiếp, không phụ thuộc vào tiện ích cài thêm trên máy người dùng. | Khi quy trình ủy quyền trên web đã hoàn toàn ổn định và được người dùng yêu cầu. |

---

## 5. Tiêu Chí Thành Công Của Sản Phẩm (Success Metrics)

Sản phẩm được xác nhận đạt yêu cầu khi thỏa mãn toàn bộ các điều kiện đo lường thực tế sau:

1. **Khả năng tiếp cận công khai:** Bất kỳ ai từ Internet bấm vào liên kết triển khai công khai đều mở được ứng dụng với chứng chỉ bảo mật HTTPS hợp lệ.
2. **Xác thực thực tế thành công:** Một người dùng ngoài đời thực đăng nhập bằng tài khoản Google thật của họ và thấy dữ liệu hồ sơ cá nhân xuất hiện chính xác.
3. **Phân quyền hoạt động trơn tru:** Quản trị viên cấp quyền thành công cho một nhân viên; nhân viên đó sau khi đăng nhập nhìn thấy đúng dịch vụ AI vừa được cấp trên giao diện của mình.
4. **Không có bất kỳ dữ liệu hay thành phần giả lập nào:** Toàn bộ dữ liệu hiển thị trên ứng dụng được truy vấn trực tiếp từ cơ sở dữ liệu đám mây thực tế.
