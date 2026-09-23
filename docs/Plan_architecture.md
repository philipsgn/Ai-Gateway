# Plan Architecture v3.0 — Hệ thống quản lý tài khoản & quyền truy cập dịch vụ AI doanh nghiệp

**Phiên bản:** 3.0 (Single Track — Real-World Only)
**Ngày cập nhật:** 21/09/2026
**Thay thế hoàn toàn:** mọi bản `Plan_architecture.md`/`Phases.md` trước đó. Không còn khái niệm "Track A/Track B" — chỉ còn một kiến trúc duy nhất, được xây từng phần thật, verify được từng phần.

---

## 0. NGUYÊN TẮC DUY NHẤT

Không có tính năng nào được viết ra nếu chưa có credential/hạ tầng thật đứng sau nó. Không mock, không giả lập, không "shell chờ tích hợp thật". Nếu một tính năng cần thứ chưa có thật (vd. hợp đồng OpenAI Enterprise), tính năng đó **chưa tồn tại trong roadmap** — chứ không tồn tại dưới dạng mock.

Hệ quả trực tiếp: roadmap ngắn hơn, chậm hơn, nhưng **mọi dòng trong tài liệu này đều có thể click vào để kiểm chứng**.

---

## 1. MỤC TIÊU HỆ THỐNG (RÚT GỌN)

1. Nhân viên đăng nhập bằng danh tính công ty thật (Google OAuth) — không mật khẩu dùng chung.
2. Admin cấp/thu hồi quyền truy cập thật, ghi nhận thật.
3. Mọi hành động được audit thật, truy vấn được thật.
4. Toàn bộ chạy trên hạ tầng managed, public, 24/7 — không phụ thuộc máy cá nhân.

---

## 2. KIẾN TRÚC TỔNG THỂ

```
┌─────────────────────────────────────────────────────────────┐
│                  Employee (Google Account thật)               │
└───────────────────────────┬─────────────────────────────────┘
                            │ Đăng nhập bằng Google
                            ▼
                ┌───────────────────────┐
                │   NextAuth.js (Auth.js) │
                │   Google OAuth 2.0      │
                └───────────┬────────────┘
                            │ Session JWT (httpOnly cookie)
                            ▼
                ┌───────────────────────┐
                │   Next.js App Router    │
                │   (Vercel, domain thật) │
                └───────────┬────────────┘
                            │ Upsert Employee, ghi AuditLog
                            ▼
        ┌───────────────────┴───────────────────┐
        ▼                                        ▼
┌───────────────────┐                  ┌───────────────────┐
│  PostgreSQL (Neon)  │                  │  Redis (Upstash)   │
│  Employee, Grant,    │                  │  Session cache,    │
│  AuditLog            │                  │  rate-limit         │
└───────────────────┘                  └───────────────────┘
```

---

## 3. MÔ HÌNH DỮ LIỆU

```
Employee (id, googleSub, email, name, avatarUrl, role, createdAt)
Grant    (id, employeeId, resourceName, grantedBy, status, createdAt, expiresAt)
AuditLog (id, actorId, action, targetId, metadata, createdAt)   -- append-only
```

Mở rộng thêm bảng (`AIAccount`, `SecretStore`...) chỉ khi có tích hợp thật cần đến, không thiết kế trước.

---

## 4. TECH STACK

| Tầng | Công nghệ | Lý do |
|---|---|---|
| **Auth** | NextAuth.js (Auth.js v5) + Google Provider | Chuẩn production, không tự chế. |
| **App** | Next.js 14+ App Router | Server Actions đủ dùng ở quy mô này, không cần backend riêng. |
| **Database** | PostgreSQL — Neon hoặc Supabase (free tier) | Managed, có connection string thật. |
| **ORM** | Drizzle hoặc Prisma | Type-safe, migration rõ ràng. |
| **Cache** | Upstash Redis (REST API) | Serverless-friendly, free tier. |
| **Hosting** | Vercel | Deploy trực tiếp từ GitHub, HTTPS mặc định. |

---

## 5. NGOÀI PHẠM VI CHO ĐẾN KHI CÓ NHU CẦU THẬT

- Vault/SecretStore riêng — dùng biến môi trường Vercel cho đến khi có credential bên thứ ba thật cần xoay vòng.
- Tích hợp SSO/SCIM với OpenAI/Google Workspace License API — chỉ làm khi có tài khoản Enterprise/Team thật để test.
- Redis lease mutex, hàng đợi tài khoản dùng chung — chỉ làm khi thật sự có tài khoản dùng chung cần chia sẻ.
- Chrome Extension, WebSocket kill-switch, hash-chain audit — hoãn vô thời hạn, chỉ quay lại nếu có lý do thật (không phải vì "đã thiết kế sẵn trước đó").

---

## 6. LỘ TRÌNH (VIẾT TỪNG PHASE MỘT, KHÔNG VIẾT TRƯỚC)

| Phase | Tên | Điều kiện bắt đầu |
|---|---|---|
| **10** | MVP Real Auth Slice | Đã có Google OAuth Client ID thật |
| **11+** | *(chưa đặt tên)* | Chỉ định nghĩa sau khi Phase 10 deploy ổn định và có ít nhất 1 người ngoài bạn từng đăng nhập thành công |

---

## 7. ĐỊNH NGHĨA HOÀN THÀNH TOÀN HỆ THỐNG (Ở TRẠNG THÁI HIỆN TẠI)

- [ ] 1 URL public, người lạ bấm vào được.
- [ ] Đăng nhập Google thật thành công.
- [ ] Dữ liệu nằm trong Postgres thật, truy vấn được qua dashboard Neon/Supabase.
- [ ] README có link demo sống.
- [ ] `grep -r "Mock" src/` không trả về kết quả nào.

---

## 8. LIÊN KẾT TÀI LIỆU

- [README.md](../README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [PHASE-0-IMPLEMENTATION-REPORT.md](./reports/PHASE-0-IMPLEMENTATION-REPORT.md)  
- [PHASE-1-IMPLEMENTATION-REPORT.md](./reports/PHASE-1-IMPLEMENTATION-REPORT.md)