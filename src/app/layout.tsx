// file: src/app/layout.tsx — App Router 根布局；token / 字体 / safe-area 见 DESIGN.md §2 §11

import type { Metadata } from 'next';
import { Noto_Serif_SC } from 'next/font/google';
import './globals.css';

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-serif',
});

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
    <html lang="zh-CN" className={notoSerifSC.variable}>
      <body className="min-h-screen bg-bg-warm text-text-primary antialiased">
        <div className="min-h-screen pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
          {children}
        </div>
      </body>
    </html>
  );
}
