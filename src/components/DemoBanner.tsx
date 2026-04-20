interface Props {
  className?: string;
}

const DEMO_TEXT =
  '本 Demo 为原型展示，禁忌规则由产品团队基于 NIH ODS（美国国立卫生研究院膳食补充剂办公室）、Linus Pauling Institute（美国俄勒冈州立大学微量营养素信息中心）、SUPP.AI（美国 补剂-药物相互作用数据库）、中国营养学会 DRIs（中国居民膳食营养素参考摄入量）等公开权威数据整理，尚未经执业药师临床复核，不构成医疗建议。';

export function DemoBanner({ className }: Props) {
  return (
    <div
      role="note"
      className={[
        'border-l-4 border-amber-400 bg-amber-50 p-3 text-sm leading-6 text-amber-950',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p>⚠︎ {DEMO_TEXT}</p>
    </div>
  );
}

export default DemoBanner;
