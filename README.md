# Enterprise AI Access Management System

> Hệ thống quản lý tài khoản & quyền truy cập dịch vụ AI cho doanh nghiệp. Mỗi tính năng trong repo này đều chạy thật — có credential thật, hạ tầng thật, deploy public thật.

**🟢 Live Demo:** `<điền link Vercel thật sau khi deploy>`
**📐 Kiến trúc chi tiết:** [`docs/Plan_architecture.md`](./docs/Plan_architecture.md)
**📚 Kiến trúc mở rộng (Enterprise):** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

---

## Nguyên tắc dự án

Không mock, không giả lập, không shell chờ tích hợp thật. Nếu một tính năng chưa có credential/hạ tầng thật đứng sau, nó chưa nằm trong repo — không nằm dưới dạng mock. Xem chi tiết tại [`Plan_architecture.md` §0](./docs/Plan_architecture.md#0-nguyên-tắc-duy-nhất).

## Chạy ở local

```bash
git clone <repo-url>
cd <repo>
npm install

cp .env.example .env.local
# Điền: DATABASE_URL (Neon/Supabase), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET,
#       UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

npm run db:migrate
npm run dev
```

Mở `http://localhost:3000`, bấm **Đăng nhập bằng Google**.

## Tech Stack

- **Auth:** NextAuth.js (Auth.js v5) + Google OAuth 2.0
- **App:** Next.js 14+ App Router
- **Database:** PostgreSQL (Neon / Supabase, free tier)
- **Cache:** Upstash Redis (REST API)
- **Hosting:** Vercel

## Trạng thái hiện tại

| Phase | Trạng thái |
|---|---|
| Phase 10 — MVP Real Auth Slice | 🚧 Đang triển khai |

Xem prompt triển khai tại [`PHASE-10-MVP-REAL-SLICE-PROMPT.md`](./PHASE-10-MVP-REAL-SLICE-PROMPT.md). Mỗi phase tiếp theo có 1 file prompt riêng, viết ngay trước khi bắt đầu phase đó — không viết trước.

---

*Personal project — mục đích học tập & portfolio.*