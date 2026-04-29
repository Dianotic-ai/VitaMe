// file: src/components/brand/VitaMeLogo.tsx — VitaMe 品牌 logo (Concept A: Seed Check)
//
// 资产为透明 PNG，从 2024-4-28彩蛋ui设计/logo设计/参考图.png 裁剪 + ffmpeg colorkey 去米底：
//   - public/brand/vitame-mark.png            512×512  纯 sprout+seed icon
//   - public/brand/vitame-logo-horizontal.png 1500×550 mark + VitaMé 字标
//
// 100% 还原品牌板水彩笔触、纸纹、特色 é 衬线 — 矢量重画做不到的部分都在 PNG 里。
//
// API 兼容：
//   - size: 'sm' | 'md' | 'lg' | number  (number 直接作为高度 px，向后兼容旧调用)
//   - variant: 'mark' | 'horizontal'      (默认 horizontal)
//   - withWordmark?: boolean              (deprecated；false 等价 variant='mark')
'use client';

const SIZE_MAP = { sm: 20, md: 28, lg: 40 } as const;
const HORIZONTAL_ASPECT = 1500 / 550; // ≈ 2.727

interface Props {
  size?: 'sm' | 'md' | 'lg' | number;
  variant?: 'mark' | 'horizontal';
  /** @deprecated 用 variant='mark' 取代；仍兼容老调用 */
  withWordmark?: boolean;
  className?: string;
}

function resolvePx(size: Props['size']): number {
  if (typeof size === 'number') return size;
  return SIZE_MAP[size ?? 'md'];
}

export function VitaMeLogo({ size = 'md', variant, withWordmark, className }: Props) {
  const px = resolvePx(size);
  const showHorizontal = variant === 'horizontal' || (variant === undefined && withWordmark !== false);

  const commonStyle = {
    display: 'block',
    objectFit: 'contain' as const,
  };

  if (!showHorizontal) {
    return (
      <span className={`inline-flex items-center ${className ?? ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/vitame-mark.png"
          alt="VitaMe"
          width={px}
          height={px}
          style={commonStyle}
        />
      </span>
    );
  }

  const width = Math.round(px * HORIZONTAL_ASPECT);
  return (
    <span className={`inline-flex items-center ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/vitame-logo-horizontal.png"
        alt="VitaMe"
        width={width}
        height={px}
        style={commonStyle}
      />
    </span>
  );
}
