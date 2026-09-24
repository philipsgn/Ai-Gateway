export interface ResourceInfo {
  name: string;
  provider: string;
  category: "Coding" | "Writing" | "Chat" | "Design";
  officialUrl: string;
  description: string;
  badgeColor: string;
  costPerLaunch: number;
}

export const RESOURCE_CATALOG: Record<string, ResourceInfo> = {
  "ChatGPT Team": {
    name: "ChatGPT Team",
    provider: "OpenAI",
    category: "Chat",
    officialUrl: "https://chatgpt.com",
    description: "Mô hình ngôn ngữ GPT-4o đa năng, hỗ trợ phân tích dữ liệu và workspace doanh nghiệp.",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    costPerLaunch: 0.10,
  },
  "Claude 3.5 Sonnet Pro": {
    name: "Claude 3.5 Sonnet Pro",
    provider: "Anthropic",
    category: "Writing",
    officialUrl: "https://claude.ai",
    description: "AI phân tích tài liệu chuyên sâu, viết lách và suy luận logic hàng đầu của Anthropic.",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    costPerLaunch: 0.15,
  },
  "Gemini Advanced": {
    name: "Gemini Advanced",
    provider: "Google",
    category: "Chat",
    officialUrl: "https://gemini.google.com",
    description: "Mô hình Gemini 1.5 Pro với ngữ cảnh 1 triệu token, tích hợp hệ sinh thái Google.",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    costPerLaunch: 0.08,
  },
  "Cursor Pro / Business": {
    name: "Cursor Pro / Business",
    provider: "Anysphere",
    category: "Coding",
    officialUrl: "https://cursor.com",
    description: "IDE lập trình tích hợp AI thông minh, hỗ trợ sinh mã và sửa lỗi toàn codebase.",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    costPerLaunch: 0.20,
  },
  "GitHub Copilot Enterprise": {
    name: "GitHub Copilot Enterprise",
    provider: "GitHub / Microsoft",
    category: "Coding",
    officialUrl: "https://github.com/features/copilot",
    description: "Trợ lý lập trình thông minh trong editor và pull request của GitHub.",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    costPerLaunch: 0.12,
  },
  "Midjourney Organization": {
    name: "Midjourney Organization",
    provider: "Midjourney",
    category: "Design",
    officialUrl: "https://www.midjourney.com",
    description: "Hệ thống tạo ảnh nghệ thuật và thiết kế sáng tạo hàng đầu thế giới.",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    costPerLaunch: 0.25,
  },
};

export function getResourceDetails(name: string): ResourceInfo {
  return (
    RESOURCE_CATALOG[name] || {
      name,
      provider: "Enterprise AI",
      category: "Chat",
      officialUrl: "https://chatgpt.com",
      description: "Dịch vụ AI doanh nghiệp được cấp quyền truy cập.",
      badgeColor: "bg-slate-500/10 text-slate-400 border-slate-500/30",
      costPerLaunch: 0.10,
    }
  );
}

export function getAllResources(): ResourceInfo[] {
  return Object.values(RESOURCE_CATALOG);
}


