# Enterprise AI Access Management System

> Hệ thống quản lý tài khoản & quyền truy cập dịch vụ AI cho doanh nghiệp. Mỗi tính năng trong repo này đều chạy thật — có credential thật, hạ tầng thật, deploy public thật.

**🟢 Live Demo:** `<điền link Vercel thật sau khi deploy Phase 1>`

---

## Tài Liệu Dự Án

Hệ thống tài liệu chỉ đạo dự án được phân định ranh giới rõ ràng, không trùng lặp:

| Tài Liệu | Mục Đích | Đối Tượng Đọc |
|---|---|---|
| 📋 [**PRD.md**](./docs/PRD.md) | Xây cái gì, giải quyết vấn đề gì, cho ai và tiêu chí thành công đo lường được | Người xem phi kỹ thuật, Reviewer |
| 📐 [**TECH_ARCHITECTURE.md**](./docs/TECH_ARCHITECTURE.md) | Kiến trúc hệ thống, sơ đồ topology, mô hình dữ liệu thật và công nghệ | Kỹ sư phần mềm, Code Reviewer |
| 🗺️ [**PLAN.md**](./docs/PLAN.md) | Lộ trình tổng thể các giai đoạn và điều kiện kích hoạt từng phase | Người điều phối dự án |
| ⚡ [**PHASE.md**](./docs/PHASE.md) | Kế hoạch nhiệm vụ chi tiết (task breakdown) và DoD của **Phase đang chạy** | Kỹ sư thực thi trực tiếp |

---

## Nguyên Tắc Dự Án

Tuyệt đối không giả lập, không tạo tính năng ảo chờ tích hợp thật. Nếu một tính năng chưa có credential/hạ tầng thật đứng sau, nó chưa nằm trong repo. Xem chi tiết tại [TECH_ARCHITECTURE.md](./docs/TECH_ARCHITECTURE.md).

## Chạy Ở Môi Trường Local

```bash
git clone <repo-url>
cd <repo>
npm install

cp .env.example .env.local
# Điền: DATABASE_URL (Neon/Supabase), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET,
#       UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ROOT_ADMIN_EMAIL

npm run db:migrate
npm run dev
```

Mở `http://localhost:3000`, bấm **Đăng nhập bằng Google**.

## Công Nghệ Cốt Lõi (Tech Stack)

- **Xác thực (Auth):** NextAuth.js (Auth.js v5) + Google OAuth 2.0
- **Ứng dụng (App):** Next.js 14+ App Router & Server Actions
- **Cơ sở dữ liệu (Database):** PostgreSQL (Neon / Supabase managed) + Drizzle ORM
- **Bảo vệ tần suất (Rate Limiter):** Upstash Redis (REST API)
- **Triển khai (Hosting):** Vercel Platform

## Trạng Thái Hiện Tại

Hiện tại dự án đang trong **Phase 1: Real Identity, Root Admin & Grants Matrix**. Chi tiết các task công việc và tiêu chí nghiệm thu được cập nhật tại [PHASE.md](./docs/PHASE.md).

---

*Personal project — mục đích học tập & portfolio.*