import React from "react";
import Link from "next/link";
import {
  HelpCircle,
  ShieldCheck,
  Zap,
  Users,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ChevronRight,
  Clock,
  Coins,
  FileCheck2,
} from "lucide-react";

export const metadata = {
  title: "Hệ Thống & Hướng Dẫn Sử Dụng | AI Access Gateway",
  description: "Tìm hiểu cách AI Access Gateway hoạt động, cách dùng công cụ AI dùng chung an toàn và giải đáp thắc mắc.",
};

export default function HeThongPage() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-16">
      {/* --------------------------------------------------------------------- */}
      {/* 1. Header Hero                                                        */}
      {/* --------------------------------------------------------------------- */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-mint-50 text-mint-700 border border-mint-200">
          <Sparkles className="w-3.5 h-3.5 text-mint-600" />
          <span>Hướng Dẫn Toàn Diện Dành Cho Thành Viên</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900 tracking-tight">
          Hệ Thống Hoạt Động Như Thế Nào?
        </h1>
        <p className="text-sm sm:text-base text-ink-600 max-w-2xl mx-auto leading-relaxed">
          Tất cả những gì bạn cần biết về cổng truy cập AI dùng chung: cơ chế vận hành,
          cách bắt đầu làm việc, bảo mật dữ liệu và giải đáp các câu hỏi thường gặp.
        </p>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. Tổng Quan 3 Trụ Cột Đơn Giản                                       */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card-cream p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-mint-50 border border-mint-200 text-mint-600 flex items-center justify-center shadow-sm">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-ink-900 text-base">Không Cần Nhớ Mật Khẩu</h3>
          <p className="text-xs text-ink-600 leading-relaxed">
            Bạn đăng nhập bằng email công ty một lần duy nhất. Nền tảng tự động mở phiên làm việc bản quyền mà bạn không cần biết hoặc lưu mật khẩu gốc.
          </p>
        </div>

        <div className="card-cream p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cream-200 border border-cream-300 text-ink-700 flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-ink-900 text-base">Chia Sẻ Ghế Thông Minh</h3>
          <p className="text-xs text-ink-600 leading-relaxed">
            Các gói công cụ cao cấp (ChatGPT Plus/Team, Claude Pro, Cursor Pro) được dùng chung linh hoạt, tự động sắp xếp chỗ để không ai bị xung đột tài khoản.
          </p>
        </div>

        <div className="card-cream p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-mint-50 border border-mint-200 text-mint-600 flex items-center justify-center shadow-sm">
            <Coins className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-ink-900 text-base">Tối Ưu Ngân Sách Công Ty</h3>
          <p className="text-xs text-ink-600 leading-relaxed">
            Mỗi phòng ban có hạn mức chi phí rõ ràng. Doanh nghiệp tiết kiệm hơn 70% ngân sách bản quyền AI mà nhân sự vẫn luôn có công cụ mạnh nhất để làm việc.
          </p>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. Quy Trình 3 Bước Dành Cho Nhân Viên                                */}
      {/* --------------------------------------------------------------------- */}
      <div className="card-cream p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-cream-300 pb-4">
          <div className="w-9 h-9 rounded-xl bg-mint-500 text-white flex items-center justify-center font-bold text-sm shadow-mint">
            1-2-3
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Cách Bắt Đầu Làm Việc</h2>
            <p className="text-xs text-ink-500">Chỉ mất chưa đầy 30 giây để bắt đầu sử dụng AI</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-cream-50 border border-cream-200">
            <span className="w-7 h-7 rounded-lg bg-mint-100 text-mint-800 text-xs font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-ink-900">
                Đăng nhập bằng tài khoản Google công ty
              </h4>
              <p className="text-xs text-ink-600 leading-relaxed">
                Truy cập cổng và bấm <strong>"Đăng nhập với Google Workspace"</strong>. Hệ thống sẽ tự động nhận diện phòng ban và các công cụ bạn được cấp quyền.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-cream-50 border border-cream-200">
            <span className="w-7 h-7 rounded-lg bg-mint-100 text-mint-800 text-xs font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-ink-900">
                Bấm "Mở công cụ ngay"
              </h4>
              <p className="text-xs text-ink-600 leading-relaxed">
                Trên thẻ công cụ bạn muốn dùng (như ChatGPT hoặc Claude), bấm nút mở. Cổng AI Gateway sẽ cấp cho bạn một chỗ ngồi làm việc ngay lập tức.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-cream-50 border border-cream-200">
            <span className="w-7 h-7 rounded-lg bg-mint-100 text-mint-800 text-xs font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-ink-900">
                Bấm "Trả lại chỗ" khi xong việc
              </h4>
              <p className="text-xs text-ink-600 leading-relaxed">
                Sau khi làm việc xong, bạn chỉ cần bấm nút <strong>"Trả lại chỗ"</strong> trên trang chủ để nhường ghế cho đồng nghiệp cùng dự án. Nếu quên, phiên cũng sẽ tự động hết hạn an toàn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. Cách Xin Cấp Thêm Công Cụ Mới                                       */}
      {/* --------------------------------------------------------------------- */}
      <div className="card-cream p-8 space-y-5 bg-gradient-to-br from-white via-cream-50 to-mint-50/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-mint-50 border border-mint-200 text-mint-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Cần Sử Dụng Thêm Công Cụ Mới?</h2>
            <p className="text-xs text-ink-500">Quy trình yêu cầu tự phục vụ cực kỳ nhanh chóng</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
          Nếu trong danh mục công cụ có dịch vụ AI bạn đang cần phục vụ công việc (ví dụ: Cursor Pro để viết code hoặc Midjourney để thiết kế ảnh) nhưng chưa được cấp:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-white border border-cream-300 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-ink-900">
              <CheckCircle2 className="w-4 h-4 text-mint-600" />
              <span>1 Cú Click Gửi Yêu Cầu</span>
            </div>
            <p className="text-xs text-ink-500">
              Kéo xuống phần <strong>"Danh Mục Công Cụ AI"</strong> trên trang chủ và bấm nút <em>"Yêu Cầu Cấp Quyền"</em>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-cream-300 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-ink-900">
              <Clock className="w-4 h-4 text-mint-600" />
              <span>Duyệt Nhanh Trực Tiếp</span>
            </div>
            <p className="text-xs text-ink-500">
              Quản trị viên nhận thông báo và có thể phê duyệt ngay trên Cổng Quản Trị mà không cần làm thủ tục giấy tờ phức tạp.
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 5. Bảo Mật & Quyền Riêng Tư (Giải thích dễ hiểu)                       */}
      {/* --------------------------------------------------------------------- */}
      <div className="card-cream p-8 space-y-5">
        <div className="flex items-center gap-3 border-b border-cream-300 pb-4">
          <div className="w-9 h-9 rounded-xl bg-cream-200 border border-cream-300 text-ink-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">An Toàn & Quyền Riêng Tư Của Bạn</h2>
            <p className="text-xs text-ink-500">Bảo vệ thông tin doanh nghiệp và người dùng tối đa</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div className="space-y-1.5">
            <h4 className="font-bold text-ink-900 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-mint-600" />
              <span>Mã hóa bảo vệ mật khẩu</span>
            </h4>
            <p className="text-ink-600 leading-relaxed">
              Thông tin đăng nhập tài khoản bản quyền của công ty được cất giữ trong kho mã hóa nhiều lớp. Không ai (kể cả nhân viên hay người ngoài) có thể đọc trộm mật khẩu thô.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-ink-900 flex items-center gap-2">
              <FileCheck2 className="w-3.5 h-3.5 text-mint-600" />
              <span>Ghi nhận lượt dùng minh bạch</span>
            </h4>
            <p className="text-ink-600 leading-relaxed">
              Hệ thống chỉ lưu lại nhật ký thời gian bạn bắt đầu và kết thúc làm việc để tính toán chi phí và phân bổ ghế, hoàn toàn minh bạch và có thể tra cứu ở trang Nhật Ký.
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 6. Các Câu Hỏi Thường Gặp (FAQ)                                       */}
      {/* --------------------------------------------------------------------- */}
      <div className="card-cream p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-cream-300 pb-4">
          <div className="w-9 h-9 rounded-xl bg-mint-50 border border-mint-200 text-mint-600 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">Câu Hỏi Thường Gặp (FAQ)</h2>
            <p className="text-xs text-ink-500">Giải đáp các thắc mắc phổ biến</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 space-y-1.5">
            <h4 className="font-bold text-sm text-ink-900">
              Công ty có đọc được các đoạn chat của tôi với AI không?
            </h4>
            <p className="text-xs text-ink-600 leading-relaxed">
              <strong>Không.</strong> Cổng AI Gateway chỉ làm nhiệm vụ cấp vé vào cửa và mở ứng dụng cho bạn. Nội dung trao đổi của bạn với AI được bảo mật trực tiếp theo chính sách quyền riêng tư của từng nhà cung cấp (OpenAI, Anthropic, Google).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 space-y-1.5">
            <h4 className="font-bold text-sm text-ink-900">
              Tôi nên làm gì khi công cụ báo "Tài khoản đang có đủ người dùng"?
            </h4>
            <p className="text-xs text-ink-600 leading-relaxed">
              Điều đó có nghĩa là các đồng nghiệp khác trong công ty đang sử dụng hết số ghế đồng thời của gói dịch vụ đó. Bạn có thể đợi vài phút để có ghế trống, hoặc liên hệ quản trị viên để mở rộng số ghế nếu nhu cầu dự án tăng cao.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 space-y-1.5">
            <h4 className="font-bold text-sm text-ink-900">
              Tôi có thể dùng tài khoản này ở nhà hoặc trên điện thoại không?
            </h4>
            <p className="text-xs text-ink-600 leading-relaxed">
              Bạn có thể truy cập cổng AI Gateway từ bất kỳ trình duyệt nào (trên máy tính hoặc điện thoại) chỉ cần đăng nhập đúng tài khoản Google công ty được cấp phép.
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 7. Bottom CTA                                                         */}
      {/* --------------------------------------------------------------------- */}
      <div className="p-6 rounded-2xl bg-cream-200 border border-cream-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-ink-900">Bạn đã sẵn sàng làm việc?</h3>
          <p className="text-xs text-ink-600 mt-0.5">
            Quay lại trang chủ để bắt đầu mở các công cụ AI được cấp phép của bạn.
          </p>
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-mint-500 hover:bg-mint-600 text-white font-semibold text-xs transition-all shadow-mint flex items-center gap-2 shrink-0"
        >
          <span>Vào Không Gian Làm Việc</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
