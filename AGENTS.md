# AGENTS.md

File này được Antigravity, Claude Code, Cursor và các agentic tool khác tự động đọc ở đầu mỗi phiên làm việc trong repo (chuẩn AGENTS.md, cross-tool). Mọi quy tắc dưới đây là bắt buộc, không cần người dùng nhắc lại.

## Bối cảnh dự án

Enterprise AI Access Management System — personal project portfolio. Đã trải qua 1 lần tái cấu trúc lớn: bỏ toàn bộ kiến trúc "thiết kế doanh nghiệp mô phỏng" (Mock driver, InMemoryDatabase, Vault/SAML/SCIM giả lập) để chuyển sang **một kiến trúc duy nhất, tối giản, chạy thật 100%**.

## Quy tắc bất biến — áp dụng cho MỌI task, không ngoại lệ

1. **Không mock.** Không tạo class/service nào có bản chất giả lập dữ liệu hoặc hành vi bên thứ ba. Nếu tính năng chưa có credential/hạ tầng thật đứng sau, nó không nằm trong scope hiện tại — dừng lại và hỏi, không tự viết mock để "chờ tích hợp sau".
2. **Không dùng thuật ngữ "Track A / Track B".** Chỉ có một hướng đi duy nhất.
3. **Không đặc tả trước cho phase chưa bắt đầu.** Chỉ phase đang active trong `PHASE.md` mới có task breakdown chi tiết. Nếu được yêu cầu viết trước cho phase tương lai, chỉ viết tên + điều kiện mở, từ chối viết task chi tiết.
4. **Definition of Done phải kiểm chứng được**, không chấp nhận tự ghi "PASS" mà không kèm bằng chứng (link deploy, output lệnh, ảnh chụp dashboard).
5. **Không tạo file tài liệu mới** ngoài 4 file đã có (`PRD.md`, `TECH_ARCHITECTURE.md`, `PLAN.md`, `PHASE.md`) trừ khi người dùng yêu cầu rõ ràng.

## Vai trò 4 file tài liệu — đọc theo thứ tự này khi bắt đầu phiên mới

1. `PLAN.md` — phase nào đang active, phase nào đã xong.
2. `PHASE.md` — task breakdown chi tiết của phase đang active. Đây là nguồn việc cần làm ngay.
3. `TECH_ARCHITECTURE.md` — tech stack, mô hình dữ liệu, ngoài phạm vi kỹ thuật.
4. `PRD.md` — chỉ đọc khi cần hiểu lại mục tiêu sản phẩm tổng thể, hiếm khi cần cho task code hàng ngày.

Nếu `DECISIONS.md` tồn tại, đọc trước khi đề xuất bất kỳ thay đổi tech stack nào — tránh đề xuất lại quyết định đã chốt.

## Quy trình khi hoàn thành 1 phase

1. Đổi tên `PHASE.md` hiện tại thành `docs/phases/PHASE-N-IMPLEMENTATION-REPORT.md`.
2. Cập nhật `PLAN.md`: đánh dấu phase vừa xong là ✅, phase kế tiếp là 🚧.
3. Tạo `PHASE.md` mới cho phase kế tiếp — chỉ sau khi người dùng xác nhận phạm vi.
4. Đề xuất người dùng chạy: `git add -A && git commit -m "..." && git tag phase-N-done`.

## Khi không chắc chắn

Nếu 1 yêu cầu có vẻ mở rộng scope ra ngoài `PHASE.md` hiện tại, hoặc có mùi "làm cho đẹp/đầy đủ hơn" giống mô hình Track B cũ (nhiều mock, nhiều tính năng giả lập, báo cáo PASS dài dòng không bằng chứng) — dừng lại, hỏi người dùng xác nhận trước khi viết code, thay vì tự động mở rộng.