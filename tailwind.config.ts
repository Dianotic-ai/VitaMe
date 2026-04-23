// file: tailwind.config.ts — 主题（对齐 DESIGN.md §2 全部 token / §6 elevation / D7 v2.6）

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // §2.2 — 中文衬线主标题；变量来自 src/app/layout.tsx next/font/google 注入
        serif: ['var(--font-serif)', 'Noto Serif SC', 'Georgia', 'PingFang SC', 'serif'],
      },
      colors: {
        // §2.1 risk — 产品视觉脊柱
        'risk-red': '#C8472D',
        'risk-amber': '#D4933A',
        'risk-gray': '#8A8278',
        'risk-green': '#5B8469',

        // §2.3 neutral
        'bg-warm': '#FAF9F6',
        surface: '#FFFFFF',
        'text-primary': '#2B2A27',
        'text-secondary': '#6B6862',
        'text-disabled': '#A8A49C',
        'border-subtle': '#E8E4DD',
        'border-strong': '#C9C2B5',

        // §2.4 accent & ui
        'vita-brown': '#8B5A2B',
        link: '#4A5D7E',
        'error-red': '#DC2626',
        info: '#4A7C9E',

        // §2.5 disclaimer
        'disclaimer-bg': '#F5F1E8',
        'disclaimer-border': '#C9AE7B',
        'disclaimer-text': '#6B5332',
      },
      boxShadow: {
        // §6 elevation
        'elev-1': '0 1px 2px rgba(43, 42, 39, 0.04)',
        'elev-2': '0 4px 16px rgba(43, 42, 39, 0.08)',
        'elev-3': '0 8px 24px rgba(43, 42, 39, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
