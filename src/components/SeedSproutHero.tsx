// file: src/components/SeedSproutHero.tsx — /query landing 主视觉
//
// DESIGN.md §11.1 用户旅程映射：onboarding → seed。落地页用 seed 单画面 +
// 主标题 + 一句副标题，下面横向露出"发芽 / 开花 / 结果"三阶预告（暗示流程）。
// 三阶用 sage green 50% 透明度，弱化为辅助叙事，不抢主角。

import { SeedSproutStage } from './SeedSproutStage';

interface Props {
  className?: string;
}

export function SeedSproutHero({ className }: Props) {
  return (
    <section
      className={[
        'flex flex-col items-center gap-6 rounded-2xl bg-bg-warm px-6 py-10 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <SeedSproutStage stage="seed" size={112} />

      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-semibold leading-tight text-text-primary">
          买之前、吃之前，先查一下。
        </h1>
        <p className="text-sm leading-6 text-text-secondary">
          每一次内在的提问，都是一颗种子。
          <br />
          告诉 VitaMe 你想查什么，我们陪你看清楚再选。
        </p>
      </div>

      <ul
        aria-label="VitaMe 旅程四阶段"
        className="flex w-full items-end justify-between gap-3 px-2 pt-2 opacity-70"
      >
        <li className="flex flex-1 flex-col items-center gap-1">
          <SeedSproutStage stage="seed" size={36} />
          <span className="text-[10px] tracking-wider text-text-secondary">种子</span>
        </li>
        <li className="flex flex-1 flex-col items-center gap-1">
          <SeedSproutStage stage="sprout" size={36} />
          <span className="text-[10px] tracking-wider text-text-secondary">发芽</span>
        </li>
        <li className="flex flex-1 flex-col items-center gap-1">
          <SeedSproutStage stage="bloom" size={36} />
          <span className="text-[10px] tracking-wider text-text-secondary">开花</span>
        </li>
        <li className="flex flex-1 flex-col items-center gap-1">
          <SeedSproutStage stage="fruit" size={36} />
          <span className="text-[10px] tracking-wider text-text-secondary">结果</span>
        </li>
      </ul>
    </section>
  );
}

export default SeedSproutHero;
