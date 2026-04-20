// file: tailwind.config.ts — 主题（对齐 DESIGN.md §2.1 的 4 色 risk token）

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'risk-red': '#C8472D',
        'risk-amber': '#D4933A',
        'risk-gray': '#8A8278',
        'risk-green': '#5B8469',
      },
    },
  },
  plugins: [],
};

export default config;
