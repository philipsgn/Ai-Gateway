# Task Tracking: Phase 5 — Enterprise Compliance & WORM Audit Analytics

Tài liệu theo dõi tiến độ nhiệm vụ cho Phase 5, bám sát 100% phân rã công việc từ [docs/PHASE.md](./docs/PHASE.md). Không tự thêm task ngoài phạm vi.

---

## Nhóm 1: Cơ Sở Dữ Liệu WORM & Checksum Bất Biến (Data & WORM Policy)
- [x] Mở rộng bảng `audit_logs` thêm cột `checksum VARCHAR(64)` trong `apps/web/src/db/schema.ts`
- [x] Cập nhật migration script `scripts/migrate.ts`: Thêm cột `checksum`, tạo trigger `trg_audit_logs_immutable` chặn `UPDATE/DELETE`
- [x] Thực thi `npm run db:migrate` áp dụng WORM trigger lên Neon PostgreSQL thật
- [x] Xây dựng module kiểm toán `apps/web/src/lib/audit.ts` hỗ trợ tính checksum SHA-256 và hàm xác thực toàn vẹn `verifyAuditIntegrity`

## Nhóm 2: API Xuất Báo Cáo Tuân Thủ Chuẩn Doanh Nghiệp (Compliance Export Engine)
- [ ] Xây dựng Route Handler `/api/audit/export/route.ts` hỗ trợ định dạng `?format=csv` (RFC 4180)
- [ ] Bổ sung hỗ trợ định dạng `?format=json` (Gói chứng thực ISO 27001 / SOC 2 Compliance Package)
- [ ] Kiểm tra xác thực phân quyền an toàn khi xuất báo cáo

## Nhóm 3: Bảng Phân Tích ROI & Trực Quan Hóa Tuân Thủ Tại /audit (Compliance Dashboard)
- [ ] Nâng cấp giao diện `/audit`:
  - Thẻ chứng nhận WORM Immutability & Checksum Status
  - Thẻ phân tích ROI (Giờ làm việc tiết kiệm, giá trị kinh tế tạo ra)
  - Biểu đồ phân bổ tỷ lệ các loại sự kiện (Event Distribution)
  - Bộ lọc sự kiện theo phân loại (Category Filter)
  - Nút bấm xuất nhanh CSV và JSON Compliance Package

## Nhóm 4: Tích Hợp Kiểm Toán & Báo Cáo Tại Admin Portal (/admin)
- [ ] Bổ sung liên kết xuất báo cáo tuân thủ nhanh trên header Admin Portal
- [ ] Cập nhật module Launch Gateway và các Server Actions để ghi `checksum` SHA-256 cho mọi bản ghi audit mới

## Nhóm 5: Kiểm Chứng & Nghiệm Thu Toàn Diện (Verification)
- [ ] Chạy `git grep -i "Mock" apps/web/src/` đảm bảo 0 kết quả
- [ ] Viết và chạy script xác thực `scripts/test-phase5-compliance.ts` chứng minh WORM trigger chặn lệnh sửa/xóa và verify toàn vẹn checksum trên Neon PostgreSQL
- [ ] Chạy `npx turbo build` kiểm tra type-safety và build production
- [ ] Tạo báo cáo nghiệm thu `docs/reports/PHASE-5-IMPLEMENTATION-REPORT.md`
