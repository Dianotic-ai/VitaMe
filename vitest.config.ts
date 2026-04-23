// file: vitest.config.ts — 单测 runner（默认 node env；compliance 等需 DOM 的测试文件头部用 `// @vitest-environment jsdom` 逐文件覆盖）

import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` 包在 Next.js 外抛错（它的唯一职责）；vitest node env 下必须打桩
      // 防护语义仍由 Next.js build 时保障；测试只是绕开 runtime guard
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/unit/**/*.spec.ts', 'tests/compliance-audit.spec.ts', 'tests/seed-questions.spec.ts'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
