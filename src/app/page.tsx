// file: src/app/page.tsx — 根路由直接重定向到 /chat（v0.3 RAG chatbot 主入口）
//
// v0.2 老入口 /query 仍保留可访问（但首页不再指向它）

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/chat');
}
