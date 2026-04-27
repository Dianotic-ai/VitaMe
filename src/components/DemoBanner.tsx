// file: src/components/DemoBanner.tsx — §11.11 红线：未经药师复核的硬编码规则必带此条
//
// 视觉用 risk-amber 谱系（不是 amber-50/400 raw 色）；不抢 RiskBadge 的"留意"语义，
// 用左竖条 + 较弱的背景透明度区分：这是"产品声明"不是"成分留意"。

interface Props {
  className?: string;
}

const DEMO_TEXT =
  '本 Demo 为原型展示，禁忌规则由产品团队基于 NIH ODS（美国国立卫生研究院膳食补充剂办公室）、Linus Pauling Institute（美国俄勒冈州立大学微量营养素信息中心）、SUPP.AI（美国 保健品-药物相互作用数据库）、中国营养学会 DRIs（中国居民膳食营养素参考摄入量）等公开权威数据整理，尚未经执业药师临床复核，不构成医疗建议。';

export function DemoBanner({ className }: Props) {
  return (
    <div
      role="note"
      aria-label="Demo 阶段说明"
      className={[
        'border-l-[3px] border-risk-amber bg-risk-amber/10 px-3 py-2.5 text-xs leading-6 text-text-secondary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p>
        <span className="mr-1 font-medium text-risk-amber">原型说明</span>
        {DEMO_TEXT}
      </p>
    </div>
  );
}

export default DemoBanner;
