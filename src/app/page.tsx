// file: src/app/page.tsx — 根路由直接重定向到 /query landing（P0 主入口）

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/query');
}
