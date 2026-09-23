# Project Roadmap Plan (PLAN)
## Enterprise AI Access Management System

Lộ trình dự án được quản lý theo phương pháp tinh gọn (Lean). Mỗi giai đoạn chỉ được mở khi giai đoạn trước đó đã hoàn tất và đáp ứng đầy đủ điều kiện kiểm chứng thực tế.

---

## Bảng Lộ Trình Tổng Thể

| Phase | Tên Giai Đoạn | Trạng Thái | Điều Kiện Bắt Đầu / Mở Phase |
|:---:|---|:---:|---|
| **1** | **Real Identity, Root Admin & Grants Matrix** | 🚧 Đang nghiệm thu & Deploy | Đã có Google OAuth 2.0 Client ID thật, PostgreSQL managed thật và Upstash Redis thật. |
| **2** | **Direct Service Launch & Access Brokerage** | ⏳ Chưa mở | Chỉ mở khi Phase 1 đã triển khai thành công trên Vercel, hoạt động ổn định ≥ 1 tuần và có ít nhất 1 người dùng bên ngoài đăng nhập thành công. |
| **3** | **Third-Party Credential Brokerage & Rotation** | ⏳ Chưa mở | Chỉ mở khi Phase 2 hoàn thành và tổ chức có nhu cầu chia sẻ credential bản quyền AI thật cần quản lý xoay vòng. |

---

> **Nguyên tắc điều phối:**
> - Các giai đoạn chưa mở (`⏳ Chưa mở`) chỉ ghi nhận tên định hướng và điều kiện kích hoạt.
> - Tuyệt đối không phân rã task chi tiết hay viết trước giải pháp kỹ thuật cho các giai đoạn tương lai nhằm tránh lặp lại sai lầm thiết kế xa rời thực tế.
> - Chi tiết công việc thực thi của giai đoạn đang diễn ra (`🚧`) được trình bày độc quyền tại tệp [PHASE.md](./PHASE.md).
