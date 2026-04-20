// file: src/app/layout.tsx — App Router 根布局占位；正式样式见 DESIGN.md §2

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VitaMe — 补剂安全翻译',
  description: '买之前、吃之前，先问 VitaMe：能不能吃，为什么，避开什么。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
