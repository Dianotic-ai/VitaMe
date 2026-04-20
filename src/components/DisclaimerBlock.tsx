interface Props {
  className?: string;
}

const DISCLAIMER_TEXT =
  'VitaMe 提供补剂安全信息和决策辅助,不提供疾病诊断、医疗结论或处方建议。如有疾病、持续症状或高风险情况,请及时咨询医生。';

export function DisclaimerBlock({ className }: Props) {
  return (
    <div
      role="note"
      className={[
        'rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-600',
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
