# Phase 7: Human-Centric UI/UX Simplification & Interactive Platform Guide

## 1. Bối Cảnh & Mục Tiêu Nghiệp Vụ (Context & Objective)

Hệ thống đã đạt mức độ hoàn thiện kỹ thuật cao (100% Real Infrastructure, Zero Mock, AES-256-GCM, Redis Lease Mutex, WORM Trigger). Tuy nhiên, phản hồi thực tế từ người dùng cho thấy:
1. **Rào cản ngôn ngữ chuyên ngành (Hardcore Jargon):** Các trang chính hiện tại lạm dụng quá nhiều thuật ngữ kỹ thuật rườm rà (*"Zero-Knowledge Vault", "WORM Immutability", "SHA-256 Checksum", "Concurrency Lease Mutex", "RFC 4180", "SOC 2 Type II"*), gây bối rối cho nhân viên thông thường và nhà phát triển theo định hướng VibeCoder.
2. **Thiếu một trang hướng dẫn trực quan (Platform Guide):** Người dùng cần một nơi tập trung để hiểu được: Nền tảng hoạt động như thế nào? Tại sao phải dùng qua Gateway? Cách khởi chạy, cách xin quyền và cách trả ghế ra sao?
3. **Thị giác & Phong cách thiết kế:** Cần điều chỉnh sang **tông màu trầm dịu nhẹ, thanh lịch (Muted Warm Stone & Calming Sage)**, giảm độ tương phản chói mắt, tạo cảm giác thư thái, tinh tế chuẩn Production SaaS (tương tự Linear, Notion, Raycast).

**Mục tiêu Phase 7:**
1. Tạo trang chuyên biệt **"Hệ Thống Nền Tảng" (`/he-thong`)** giải thích trọn vẹn cơ chế vận hành, quy trình sử dụng, bảo mật và hỏi đáp (FAQ) trực quan.
2. **Tinh gọn hóa 100% các trang chính (`/`, `/admin`, `/audit`)**: Chuyển đổi toàn bộ ngôn ngữ sang từ ngữ thông dụng, dễ hiểu, thân thiện ("Công cụ AI", "Mở ứng dụng", "Đang bận / Còn chỗ", "Xin quyền sử dụng", "Nhật ký hoạt động").
3. **Nâng cấp Design Tokens:** Tông màu trầm nhẹ nhàng, nền đá ấm dịu (`#F8F7F4`), điểm nhấn sage thanh lịch (`#3B7A57`, `#EBF3EE`), viền mờ tối giản (`#E5E3DC`).

---

## 2. Tiêu Chí Nghiệm Thu (Definition of Done)

- [ ] **Trang Hệ Thống Nền Tảng (`/he-thong`):** Đã khởi tạo và hoạt động mượt mà, bao gồm: Sơ đồ cơ chế hoạt động, Hướng dẫn 3 bước cho nhân viên, Cơ chế bảo mật không lộ mật khẩu, và mục Hỏi-Đáp (FAQ).
- [ ] **Giao Diện Tông Trầm Thanh Lịch (Calm Muted Palette):** Nền web và các thẻ card sở hữu sắc độ trầm ấm dịu mắt, độ tương phản hài hòa, không lòe loẹt.
- [ ] **Loại Bỏ Thuật Ngữ Hardcore Trên Trang Chính:**
  - Trang chủ (`/`): Ngôn từ thân thiện, thể hiện rõ danh sách công cụ AI, trạng thái ghế dễ hiểu ("Đang có 1/3 người dùng", "Mở công cụ", "Trả lại ghế", "Gửi yêu cầu").
  - Thanh Header: Các liên kết chuẩn mực: `Không Gian Làm Việc`, `Hệ Thống`, `Nhật Ký Sử Dụng`, `Quản Trị`.
  - Cổng Quản Trị (`/admin`): Chuyển sang thuật ngữ quản trị thực tế (Ngân sách, Tài khoản dùng chung, Phân quyền).
  - Cổng Kiểm Toán (`/audit`): Chuyển thành "Nhật Ký Hoạt Động & Thống Kê" gần gũi.
- [ ] **Bảo Toàn 100% Hạ Tầng Kỹ Thuật Thật:** Không mock, toàn bộ kết nối PostgreSQL, Upstash Redis, Google OAuth, mã hóa AES-256-GCM tiếp tục vận hành chuẩn xác.
- [ ] **Kiểm Tra Không Mock:** `git grep -i "Mock" apps/web/src/` cho ra 0 kết quả.
- [ ] **Build Thành Công:** `npx turbo build` thành công với mã thoát 0.

---

## 3. Ngoài Phạm Vi (Out of Scope)

- ❌ Không thay đổi logic backend nghiệp vụ hay cấu trúc schema cơ sở dữ liệu đã kiểm thử thành công.
- ❌ Không thêm các thư viện CSS nặng nề làm giảm tốc độ tải trang.

---

## 4. Kế Hoạch Phân Rã Nhiệm Vụ (Task Breakdown)

### Nhóm 1: Hệ Thống Bảng Màu Trầm Dịu Mắt (Calm Muted Design System)
- [ ] Cập nhật `apps/web/tailwind.config.js`: Tinh chỉnh bảng màu sang tông trầm ấm (Muted Warm Stone, Gentle Sage, Soft Slate):
  - `stone`: `#FAF9F6`, `#F4F2EC`, `#ECE8E0`, `#DDD8CD`
  - `sage`: `#427A5B`, `#EAF2ED`, `#D5E5DB`, `#2D5940`
  - `slate`: `#24292F`, `#4A5568`, `#718096`
- [ ] Cập nhật `apps/web/src/styles/globals.css`: Tối ưu các thẻ `card-muted`, hiệu ứng hover nhẹ nhàng, nền êm dịu.

### Nhóm 2: Xây Dựng Trang "Hệ Thống Nền Tảng" (`apps/web/src/app/he-thong/page.tsx`)
- [ ] Thiết kế trang `/he-thong` với bố cục thông thoáng, thanh lịch:
  - [ ] **Phần 1: Giới thiệu & Triết lý vận hành**: Tại sao doanh nghiệp cần AI Access Gateway? (Quản lý tập trung, tối ưu chi phí bản quyền).
  - [ ] **Phần 2: Cơ chế hoạt động trực quan**: Minh họa cách tài khoản dùng chung được ủy quyền bảo mật mà không để lộ mật khẩu gốc.
  - [ ] **Phần 3: Hướng dẫn nhanh cho nhân viên**: 3 bước làm việc (Chọn công cụ -> Khởi chạy an toàn -> Trả ghế khi hoàn tất).
  - [ ] **Phần 4: Cơ chế tự phục vụ**: Hướng dẫn gửi yêu cầu cấp quyền và cách ban quản trị phê duyệt.
  - [ ] **Phần 5: Câu hỏi thường gặp (FAQ)**: Giải đáp các băn khoăn về quyền riêng tư, hạn mức sử dụng và xử lý khi hết ghế.

### Nhóm 3: Tinh Gọn Hóa Header & Footer (`apps/web/src/app/layout.tsx`)
- [ ] Nâng cấp thanh điều hướng:
  - Thêm liên kết nổi bật tới trang **"Hệ Thống"**.
  - Đổi tên "Tuân Thủ & WORM" thành **"Nhật Ký Sử Dụng"** (hoặc "Hoạt Động").
  - Đổi huy hiệu SLA sang ngôn ngữ thân thiện: `Hệ thống ổn định 99.9%`.
- [ ] Tinh giản Footer: Ngôn từ cô đọng, thanh lịch, liên kết nhanh.

### Nhóm 4: Tinh Gọn Hóa Không Gian Làm Việc Nhân Viên (`apps/web/src/app/page.tsx`)
- [ ] Rà soát và loại bỏ toàn bộ từ ngữ đao to búa lớn khỏi Hero Section và màn hình đăng nhập.
- [ ] Tinh gọn thẻ dịch vụ AI:
  - Hiển thị rõ ràng: Tên công cụ, Trạng thái (`Sẵn sàng` / `Đang bận: X/Y người dùng`).
  - Nút bấm trực quan: `Mở công cụ ngay` và `Trả lại chỗ`.
  - Thông báo nhẹ nhàng khi đầy người: *"Công cụ hiện có đủ người dùng, bạn vui lòng quay lại sau ít phút nhé"*.
- [ ] Danh mục công cụ yêu cầu cấp quyền: Thiết kế dạng danh sách tối giản, 1-click gửi yêu cầu với lời nhắc thân thiện.

### Nhóm 5: Tinh Gọn Hóa Cổng Quản Trị & Trang Nhật Ký
- [ ] Trang Quản Trị (`apps/web/src/app/admin/page.tsx`): Dùng từ ngữ nghiệp vụ đời thường (Ngân sách phòng ban, Quản lý tài khoản công ty, Cấp quyền sử dụng).
- [ ] Trang Nhật Ký (`apps/web/src/app/audit/page.tsx`): Đổi tên thành "Nhật Ký Hoạt Động", trình bày dòng thời gian sự kiện trực quan, dễ hiểu ai đã mở công cụ nào.

### Nhóm 6: Kiểm Chứng Kỹ Thuật & Đóng Giai Đoạn
- [ ] Kiểm tra 0 mock: `git grep -i "Mock" apps/web/src/`.
- [ ] Kiểm tra TypeScript compilation: `npx tsc --noEmit`.
- [ ] Chạy `npx turbo build` đảm bảo mã thoát 0.
- [ ] Đẩy commit và cập nhật báo cáo nghiệm thu.
