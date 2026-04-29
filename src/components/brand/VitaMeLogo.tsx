// file: src/components/brand/VitaMeLogo.tsx — VitaMe 品牌 logo (Concept A: Seed Check)
//
// 设计契约（用户 2026-04-29 拍板，参考图：2024-4-28彩蛋ui设计/logo设计/参考图.png）：
//   - 一颗椭圆种子（轻棕水彩 #8B6B4A）+ 内嵌 check 线
//   - 顶部细茎 + 双叶（深绿 #2D5A3D）
//   - 极少量蓝色露珠点缀（#4A90B8）
//   - 透明背景，禁加白底块
//   - 不要医疗十字 / 盾牌 / 药丸 / 机器人
//
// API 兼容：
//   - size: 'sm' | 'md' | 'lg' | number  (number 直接作为图标 px 高度，向后兼容老调用)
//   - variant: 'mark' | 'horizontal'      (默认 horizontal = 图标+VitaMe 字标)
//   - withWordmark?: boolean              (deprecated，仍兼容旧调用；false 等价 variant='mark')
'use client';

const SIZE_MAP = { sm: 20, md: 28, lg: 40 } as const;

interface Props {
  size?: 'sm' | 'md' | 'lg' | number;
  variant?: 'mark' | 'horizontal';
  /** @deprecated 用 variant='mark' 取代；保留兼容老页面 */
  withWordmark?: boolean;
  className?: string;
}

function resolvePx(size: Props['size']): number {
  if (typeof size === 'number') return size;
  return SIZE_MAP[size ?? 'md'];
}

function Mark({ px }: { px: number }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      {/* 种子水彩底色 */}
      <ellipse cx="32" cy="44" rx="11" ry="9.5" fill="#8B6B4A" fillOpacity="0.16" />
      {/* 种子轮廓 */}
      <ellipse cx="32" cy="44" rx="11" ry="9.5" stroke="#8B6B4A" strokeWidth="1.8" />
      {/* check */}
      <path
        d="M 26 44 L 30.5 48.5 L 38 40"
        stroke="#8B6B4A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 茎 */}
      <path
        d="M 32 34.5 C 31.5 28, 31.8 22, 32 16"
        stroke="#2D5A3D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* 左叶 */}
      <path
        d="M 32 22 C 25 21, 19 16, 19 9 C 26 11, 31 16, 32 22 Z"
        fill="#2D5A3D"
        fillOpacity="0.78"
        stroke="#2D5A3D"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* 右叶 */}
      <path
        d="M 32 22 C 39 21, 45 16, 45 9 C 38 11, 33 16, 32 22 Z"
        fill="#2D5A3D"
        fillOpacity="0.78"
        stroke="#2D5A3D"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* 叶脉 */}
      <path d="M 21 11 C 25 14, 29 18, 31.5 21" stroke="#2D5A3D" strokeWidth="0.6" strokeOpacity="0.55" strokeLinecap="round" />
      <path d="M 43 11 C 39 14, 35 18, 32.5 21" stroke="#2D5A3D" strokeWidth="0.6" strokeOpacity="0.55" strokeLinecap="round" />
      {/* 蓝色露珠点缀 */}
      <circle cx="44" cy="10.5" r="1.2" fill="#4A90B8" fillOpacity="0.8" />
    </svg>
  );
}

export function VitaMeLogo({ size = 'md', variant, withWordmark, className }: Props) {
  const px = resolvePx(size);
  const showWordmark = variant === 'horizontal' || (variant === undefined && withWordmark !== false);

  if (!showWordmark) {
    return (
      <span className={`inline-flex items-center ${className ?? ''}`}>
        <Mark px={px} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <Mark px={px} />
      <span
        className="leading-none"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: Math.round(px * 0.86),
          fontWeight: 600,
          color: '#2D5A3D',
          letterSpacing: '0.01em',
        }}
      >
        VitaMe
      </span>
    </span>
  );
}
