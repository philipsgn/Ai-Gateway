# Plan Architecture v2.0 — Hệ thống quản lý tài khoản & quyền truy cập dịch vụ AI doanh nghiệp

**Phiên bản:** 2.0 (Vertical Slice Real-World Strategy)
**Ngày cập nhật:** 21/09/2026
**Thay thế cho:** `Plan_architecture.md` v1.0 (16/09/2026) — bản v1.0 được giữ lại nguyên vẹn tại `docs/archive/Plan_architecture-v1.md` làm tài liệu tư duy kiến trúc, không xoá.

---

## 0. LÝ DO TÁI CẤU TRÚC (CONTEXT CHO PHIÊN BẢN 2.0)

Sau 16+ phase triển khai (Phase 0 → Phase 16), dự án đã chứng minh được **năng lực thiết kế kiến trúc** ở mức rất cao: phân tách Identity/Vault/SSO/Broker, fail-closed security, immutable audit hash-chain, RBAC/ABAC, canary rollout có gate pháp lý...

Tuy nhiên, toàn bộ các phase đó chạy trên:
- `InMemoryDatabase` thay vì PostgreSQL thật
- `MockSecretStore` thay vì HashiCorp Vault thật
- `MockAiServiceDriver` thay vì OpenAI/Google API thật
- `localhost:3000` thay vì domain public thật

Đây là điều **hoàn toàn bình thường** cho một personal project — nhưng nó đồng nghĩa với việc chưa có bất kỳ phần nào của hệ thống từng chạy trong điều kiện thật, có thể click-to-verify bởi người ngoài.

**Quyết định kiến trúc v2.0:** Tách dự án thành **2 track song song**, không track nào xoá bỏ track kia:

| Track | Vai trò | Trạng thái code |
|---|---|---|
| **Track B — Enterprise Design Vision** | Toàn bộ 16 phase hiện có (`Phases.md` v1.0). Là tài liệu chứng minh năng lực tư duy hệ thống ở quy mô doanh nghiệp: SSO broker, Redis lease mutex, Vault, hash-chain audit, canary rollout. | **Đóng băng** — không phát triển thêm cho đến khi Track A hoàn thành DoD. Giữ nguyên trong repo, dùng để phỏng vấn/thuyết trình kiến trúc. |
| **Track A — Real MVP Vertical Slice** | Một lát cắt dọc nhỏ, chạy thật 100%: OAuth thật, DB thật, Redis thật, deploy thật, ai cũng bấm được. | **Đang phát triển (Phase 10 trở đi).** Đây là phần được prompt & implement từ tài liệu này. |

---

## 1. NGUYÊN TẮC THIẾT KẾ CHO TRACK A

1. **Real over Mock:** Không viết thêm bất kỳ `Mock*` class mới nào cho Track A. Nếu chưa có credential/API thật cho một dịch vụ, tính năng đó **không nằm trong scope**, không giả lập.
2. **Minimal scope, maximal honesty:** Track A chỉ làm những gì có thể verify được bằng cách bấm vào 1 link. Không quản lý seat pool ảo, không kill-switch giả lập, không hash-chain khi chưa có audit log thật để chain.
3. **Managed infra, free tier, production-grade:** Dùng dịch vụ managed thật (Neon/Supabase, Upstash, Vercel) thay vì tự host Docker để đảm bảo uptime 24/7 mà không cần bạn mở máy.
4. **Public verifiable deploy:** Mọi phase của Track A phải kết thúc bằng 1 URL public, không phải `localhost`.
5. **Không lùi bảo mật:** Dù scope nhỏ, các nguyên tắc Zero-Trust của Track B vẫn áp dụng đúng mức độ tương xứng — không lưu password thô, không log secret, không seed dữ liệu giả trông như dữ liệu thật.

---

## 2. KIẾN TRÚC TỔNG THỂ TRACK A

```
┌─────────────────────────────────────────────────────────────┐
│                  Employee (Google Account thật)               │
└───────────────────────────┬─────────────────────────────────┘
                            │ 1. Click "Đăng nhập bằng Google"
                            ▼
                ┌───────────────────────┐
                │   NextAuth.js (Auth.js) │  ← thay thế "Mock SAML Broker"
                │   Google OAuth 2.0      │
                └───────────┬────────────┘
                            │ 2. Callback + session JWT (httpOnly cookie)
                            ▼
                ┌───────────────────────┐
                │   Next.js App Router    │
                │   (Vercel, domain thật) │
                └───────────┬────────────┘
                            │ 3. Upsert Employee, ghi AuditLog
                            ▼
        ┌───────────────────┴───────────────────┐
        ▼                                        ▼
┌───────────────────┐                  ┌───────────────────┐
│  PostgreSQL (Neon)  │                  │  Redis (Upstash)   │
│  Employee, Grant,    │                  │  Session cache,    │
│  AuditLog (thật)     │                  │  rate-limit (thật) │
└───────────────────┘                  └───────────────────┘
```

**Khác biệt cốt lõi so với Track B:** không còn lớp `IAiServiceDriver` giả lập provisioning vào ChatGPT/Gemini — Track A dừng ở việc chứng minh danh tính thật + phân quyền thật + audit thật. Việc "mở dịch vụ AI thật" là **Phase 11+**, chỉ thêm khi Track A đã public và ổn định.

---

## 3. MÔ HÌNH DỮ LIỆU TỐI GIẢN (TRACK A)

```
Employee (id, googleSub, email, name, avatarUrl, role, createdAt)
Grant    (id, employeeId, resourceName, grantedBy, status, createdAt, expiresAt)
AuditLog (id, actorId, action, targetId, metadata, createdAt)   -- append-only, không WORM/hash-chain ở phase này
```

Không có `AIAccount`, không có `vaultSecretRef`, không có `SecretStore` ở Track A — vì chưa có secret nào của bên thứ ba cần quản lý (Google OAuth chỉ trả về identity token, không phải mật khẩu tài khoản dùng chung).

---

## 4. TECH STACK QUYẾT ĐỊNH (TRACK A)

| Tầng | Công nghệ | Lý do chọn |
|---|---|---|
| **Auth** | NextAuth.js (Auth.js v5) + Google Provider | Thư viện chuẩn production, không tự chế JWT/SAML giả lập như Track B. |
| **Frontend/Backend** | Next.js 14+ App Router (giữ nguyên từ Track B) | Tái sử dụng kiến thức đã có, Server Actions thay cho NestJS riêng biệt ở scope nhỏ này. |
| **Database** | PostgreSQL managed — Neon hoặc Supabase (free tier) | Connection string thật, không cần tự host, có branching cho dev/preview. |
| **ORM** | Drizzle ORM hoặc Prisma | Migration rõ ràng, type-safe, dễ review trong portfolio. |
| **Cache/Rate-limit** | Upstash Redis (REST API, free tier) | Không cần server Redis riêng, hoạt động tốt trên serverless (Vercel). |
| **Hosting** | Vercel (free tier) | Deploy trực tiếp từ GitHub, domain public, HTTPS mặc định. |
| **Secrets (giai đoạn này)** | Vercel Environment Variables | Đủ an toàn cho scope OAuth-only; **không** dùng làm lý do để bỏ Vault vĩnh viễn — Vault quay lại ở Phase 12+ khi Track A cần lưu credential bên thứ ba thật. |

---

## 5. NHỮNG GÌ **KHÔNG** LÀM Ở TRACK A (NON-GOALS, TẠM THỜI)

Ghi rõ non-goals để tránh trôi scope trở lại như Track B:

- ❌ Không giả lập ChatGPT/Gemini login popup.
- ❌ Không seat pool, không JIT provisioning.
- ❌ Không Redis distributed lease mutex (chưa có tài khoản dùng chung nào cần khoá).
- ❌ Không Chrome Extension.
- ❌ Không hash-chain audit log (chỉ append-only đơn giản, có thể nâng cấp sau khi đã có dữ liệu thật để chain).
- ❌ Không MFA/TOTP nội bộ (Google OAuth đã gánh phần xác thực mạnh).

Mỗi non-goal ở trên là một **Phase tương lai có điều kiện**: chỉ mở lại khi Track A đã có ít nhất 1 người dùng thật ngoài bạn từng đăng nhập thành công qua link deploy.

---

## 6. LỘ TRÌNH TRACK A (PHASE 10 TRỞ ĐI)

| Phase | Tên | Mục tiêu chính | Điều kiện bắt đầu |
|---|---|---|---|
| **10** | MVP Real Auth Slice | OAuth thật + DB thật + Redis thật + deploy thật | Đã có Google OAuth Client ID thật |
| **11** | Real Grant & Admin View | Admin (bạn) cấp/thu hồi Grant thật cho Employee thật qua UI thật, audit log hiển thị thật trên trang | Phase 10 deploy ổn định ≥ 1 tuần |
| **12** | Secrets Vault thật (nếu cần) | Chỉ mở nếu Phase 13 cần lưu credential bên thứ ba thật (vd. API key thật của 1 dịch vụ AI thật) | Có nhu cầu thật, không làm trước |
| **13** | 1 Driver thật duy nhất | Tích hợp thật với **một** dịch vụ có API thật (vd. OpenAI Admin API cho seat thật nếu có tài khoản Team) | Phase 11 & 12 xong, có tài khoản thật để test |

Mỗi phase từ 10 trở đi sẽ có **1 prompt riêng, viết tại thời điểm bắt đầu phase đó** — không viết trước prompt chi tiết cho phase chưa tới, để tránh lặp lại sai lầm của Track B (đặc tả quá xa hiện thực).

---

## 7. ĐỊNH NGHĨA HOÀN THÀNH CHO TOÀN BỘ TRACK A

- [ ] Có 1 URL public (không phải localhost) mà người lạ bấm vào được.
- [ ] Đăng nhập bằng Google account thật thành công, không cần bạn cấu hình gì thêm cho họ.
- [ ] Dữ liệu Employee/Grant/AuditLog nằm trong Postgres thật, truy vấn được qua Neon/Supabase dashboard.
- [ ] README có link demo sống + video/gif 90 giây.
- [ ] Không còn dòng code nào chứa `Mock*` trong đường dẫn request chính (OAuth → DB → Audit).

---

## 8. LIÊN KẾT TÀI LIỆU

- [README.md](./README.md) — Tổng quan & hướng dẫn chạy
- [PHASE-17-MVP-REAL-SLICE-PROMPT.md](./PHASE-17-MVP-REAL-SLICE-PROMPT.md) — Prompt triển khai Phase 17
- [docs/archive/Plan_architecture-v1.md] — Kiến trúc Enterprise đầy đủ (Track B, đóng băng)
- [docs/archive/Phases.md] — Roadmap 6 phase gốc (Track B)