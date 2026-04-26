// file: tailwind.config.ts — Seed Within design system（v0.3 polish #5，落地 Claude design PR-PLAN.md §2）

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
        serif: ['var(--font-serif)', 'Noto Serif SC', 'Georgia', 'PingFang SC', 'serif'],
      },
      colors: {
        // §2.1 brand spine — Seed Within
        forest: { DEFAULT: '#2D5A3D', 2: '#3E7350', soft: '#E1EAE2' },
        seed: { DEFAULT: '#8B6B4A', 2: '#6F533A', soft: '#EDE5D8' },
        stream: { DEFAULT: '#4A90B8', soft: '#DDE8EF' },

        // §2.1b risk — 仅用于明确风险标签（禁忌/超量），不再作为视觉脊柱
        'risk-red': '#C25B42',
        'risk-amber': '#C68A3E',

        // §2.3 neutral
        'bg-warm': '#FAF7F2',
        'bg-warm-2': '#F0EBE0',
        surface: '#FFFFFF',
        'text-primary': '#1C1C1C',
        'text-secondary': '#4A4A48',
        'text-tertiary': '#8A8680',
        'border-subtle': '#E8E1D4',
        'border-strong': '#D4CBB8',

        // §2.4 accent & ui — 收敛到 stream 体系
        link: '#4A90B8',

        // §2.5 disclaimer (保留)
        'disclaimer-bg': '#F5F1E8',
        'disclaimer-border': '#C9AE7B',
        'disclaimer-text': '#6B5332',
      },
      borderRadius: {
        // §6.1 — 卡 12 / chip 3（书脊小直角）
        card: '12px',
        chip: '3px',
      },
      boxShadow: {
        // §6 — 整体降一档，更纸感
        'elev-1': '0 1px 2px rgba(45, 45, 30, 0.03)',
        'elev-2': '0 2px 8px rgba(45, 45, 30, 0.06)',
        'elev-3': '0 8px 24px rgba(45, 60, 45, 0.10)',
      },
      keyframes: {
        sprout: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-1px) scale(1.04)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        sprout: 'sprout 1.4s ease-in-out infinite',
        breathe: 'breathe 1.4s ease-in-out infinite',
        'slide-up': 'slideUp 260ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
