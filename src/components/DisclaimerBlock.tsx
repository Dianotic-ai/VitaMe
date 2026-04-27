// file: src/components/DisclaimerBlock.tsx — DESIGN.md §4.2：top-border-only + disclaimer-* token
//
// §11.1 合规红线 1：每个 AI 输出页都必须可见 DisclaimerBlock。
// 视觉锚点：上边框 1.5px disclaimer-border，背景 disclaimer-bg，文字 disclaimer-text。
// 不用圆框 — 在页面底部以"信封封条"形态出现，不抢主内容。

interface Props {
  className?: string;
}

const DISCLAIMER_TEXT =
  'VitaMe 提供保健品安全信息和决策辅助，不提供疾病诊断、医疗结论或处方建议。如有疾病、持续症状或高风险情况，请及时咨询医生。';

export function DisclaimerBlock({ className }: Props) {
  return (
    <div
      role="note"
      aria-label="VitaMe 免责声明"
      className={[
        'border-t-[1.5px] border-disclaimer-border bg-disclaimer-bg px-4 py-3 text-xs leading-6 text-disclaimer-text',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {DISCLAIMER_TEXT}
    </div>
  );
}

export default DisclaimerBlock;
