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
6. **Tuân thủ chu trình: Đọc Docs -> Lên Tasks -> Thực thi -> Cập nhật Docs (Không trùng lặp).** Mỗi khi nhận prompt từ người dùng, Agent bắt buộc phải đọc lại các file tài liệu để nắm đúng bối cảnh, lên danh sách task cụ thể và thực thi, sau đó cập nhật tài liệu tương ứng mà TUYỆT ĐỐI KHÔNG cập nhật lại các nội dung/cột mốc đã tồn tại gây lặp lại.

## Vai trò 4 file tài liệu — đọc theo thứ tự này khi bắt đầu phiên mới

1. `PLAN.md` — phase nào đang active, phase nào đã xong.
2. `PHASE.md` — task breakdown chi tiết của phase đang active. Đây là nguồn việc cần làm ngay.
3. `TECH_ARCHITECTURE.md` — tech stack, mô hình dữ liệu, ngoài phạm vi kỹ thuật.
4. `PRD.md` — chỉ đọc khi cần hiểu lại mục tiêu sản phẩm tổng thể, hiếm khi cần cho task code hàng ngày.

Nếu `DECISIONS.md` tồn tại, đọc trước khi đề xuất bất kỳ thay đổi tech stack nào — tránh đề xuất lại quyết định đã chốt.

## Chu trình thực thi bắt buộc cho MỌI prompt (Mandatory Prompt Execution Lifecycle)

Mỗi khi nhận một yêu cầu (prompt) mới từ người dùng, Agent phải tuân thủ nghiêm ngặt 4 bước theo đúng thứ tự sau:

1. **Đọc tài liệu trước (Mandatory Pre-read):**
   - Đọc các tài liệu dự án liên quan (`PLAN.md`, `PHASE.md`, `TECH_ARCHITECTURE.md`, `PRD.md`) trước khi thực hiện bất kỳ hành động nào.
   - Nắm rõ trạng thái hiện tại, các quyết định kiến trúc đã chốt, và phạm vi công việc để không lạc hướng.
2. **Lên kế hoạch task (Task Breakdown) & Thực thi (Execution):**
   - Lập danh sách các task cụ thể, rõ ràng, bám sát yêu cầu người dùng.
   - Tiến hành code, kiểm thử hoặc xử lý trên hạ tầng thật (Real Infrastructure, 100% Zero Mock).
3. **Cập nhật tài liệu (Documentation Sync):**
   - Sau khi hoàn thành việc triển khai hoặc thay đổi logic/tính năng quan trọng, đồng bộ ngay lập tức vào các file docs (`PLAN.md`, `PHASE.md`, `TECH_ARCHITECTURE.md` hoặc báo cáo phase tương ứng).
4. **Nguyên tắc Không Trùng Lặp (No Duplicate Updates / DRY Docs):**
   - TUYỆT ĐỐI KHÔNG cập nhật lại hoặc viết lặp lại các nội dung, task, giải thích, hay cột mốc đã có sẵn trong tài liệu.
   - Chỉ bổ sung những thông tin mới, thay đổi mới phát sinh hoặc cập nhật tiến độ thực tế để giữ tài liệu luôn tinh gọn, sắc bén và chuẩn xác.

## Tuân thủ Workflows (.agents/workflows/)

1. **Khi bắt đầu một phase mới:** Bắt buộc tuân thủ `.agents/workflows/start-phase.md`:
   - Sinh artifact `implementation_plan.md` và file `task.md` ở root workspace dựa đúng theo task breakdown trong `PHASE.md`.
   - DỪNG LẠI chờ người dùng review và duyệt `implementation_plan.md` trước khi viết bất kỳ dòng code nào.
2. **Khi hoàn thành một phase:** Bắt buộc tuân thủ `.agents/workflows/close-phase.md`:
   - Kiểm chứng từng mục Definition of Done bằng output lệnh thật.
   - Tổng hợp toàn bộ bằng chứng vào artifact `walkthrough.md`.
   - Đổi tên `PHASE.md` hiện tại thành `docs/phases/PHASE-N-IMPLEMENTATION-REPORT.md` (hoặc `docs/reports/PHASE-N-IMPLEMENTATION-REPORT.md`).
   - Cập nhật `PLAN.md`: đánh dấu phase vừa xong là ✅, phase kế tiếp là 🚧.
   - Tạo `PHASE.md` mới cho phase kế tiếp — chỉ sau khi người dùng xác nhận phạm vi.
   - Đề xuất các lệnh git cho người dùng hoặc thực hiện theo thỏa thuận.

## Khi không chắc chắn

Nếu 1 yêu cầu có vẻ mở rộng scope ra ngoài `PHASE.md` hiện tại, hoặc có mùi "làm cho đẹp/đầy đủ hơn" giống mô hình Track B cũ (nhiều mock, nhiều tính năng giả lập, báo cáo PASS dài dòng không bằng chứng) — dừng lại, hỏi người dùng xác nhận trước khi viết code, thay vì tự động mở rộng.