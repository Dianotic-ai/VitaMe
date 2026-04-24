// file: next.config.mjs — Next.js 16 App Router 配置（SSR 模式，Node runtime）

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
