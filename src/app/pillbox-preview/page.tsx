// file: src/app/pillbox-preview/page.tsx — 临时对比页
// 给 Sunny 选 A vs B vs C，决定后即可删本文件
'use client';

const PILL_BROWN = '#8B6B4A';
const PILL_GREEN = '#2D5A3D';
const CELL_BG = '#FAF7F2';
const FRAME = '#2D5A3D';
const LABEL = '#1C1C1C';

const SLOTS = [
  { key: 'morning', label: '早' },
  { key: 'midday', label: '中' },
  { key: 'evening', label: '晚' },
  { key: 'bedtime', label: '睡前' },
] as const;

type SlotKey = (typeof SLOTS)[number]['key'];

// 三种场景
type Scenario = {
  name: string;
  filledSlots: SlotKey[];
};
const SCENARIOS: Scenario[] = [
  { name: '场景 1：只设 1 颗（早 8 点）', filledSlots: ['morning'] },
  { name: '场景 2：设 2 颗（早 + 晚）', filledSlots: ['morning', 'evening'] },
  { name: '场景 3：4 颗全填', filledSlots: ['morning', 'midday', 'evening', 'bedtime'] },
];

// ---- 共享 SVG 子件 ----

function SoilPattern({ id }: { id: string }) {
  return (
    <pattern id={id} x="0" y="0" width="22" height="14" patternUnits="userSpaceOnUse">
      <path d="M 2 5 L 5 6" stroke="#5C4A2E" strokeOpacity="0.08" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M 8 9 L 11 8.5" stroke="#5C4A2E" strokeOpacity="0.07" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M 14 4 L 16.5 5" stroke="#5C4A2E" strokeOpacity="0.08" strokeWidth="0.65" strokeLinecap="round" />
      <path d="M 18 11 L 20 11.5" stroke="#5C4A2E" strokeOpacity="0.06" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M 3 12 Q 5 11 7 12" stroke="#5C4A2E" strokeOpacity="0.05" strokeWidth="0.45" fill="none" />
    </pattern>
  );
}

function CapsulePill({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const capW = r * 2.6;
  const capH = r * 1.05;
  const x = cx - capW / 2;
  const y = cy - capH / 2;
  const ry = capH / 2;
  return (
    <g transform={`rotate(-22 ${cx} ${cy})`}>
      <rect x={x} y={y} width={capW} height={capH} rx={ry} ry={ry} fill={PILL_BROWN} />
      <rect x={x} y={y} width={capW} height={capH / 2} rx={ry} ry={ry} fill="#5C4A2E" opacity={0.1} />
      <line
        x1={x + capW / 2}
        y1={y + ry * 0.45}
        x2={x + capW / 2}
        y2={y + capH - ry * 0.45}
        stroke="#FAF7F2"
        strokeWidth={0.4}
        opacity={0.35}
      />
    </g>
  );
}

// ---- 模式 A：自适应（只渲染有内容的 slot）----

function ModeA({ filledSlots, idx }: { filledSlots: SlotKey[]; idx: number }) {
  const visible = SLOTS.filter((s) => filledSlots.includes(s.key));
  const r = 7;
  const totalW = Math.max(160, visible.length * 80);
  const cellW = (totalW - 8) / visible.length;
  const patternId = `soilA-${idx}`;
  return (
    <svg width="100%" viewBox={`0 0 ${totalW} 76`} preserveAspectRatio="xMidYMid meet" style={{ maxWidth: 360, height: 76 }}>
      <defs>
        <SoilPattern id={patternId} />
      </defs>
      {visible.map((slot, i) => {
        const x = 4 + i * cellW;
        const y = 4;
        const w = cellW - 2;
        const h = 48;
        return (
          <g key={slot.key}>
            <rect x={x} y={y} width={w} height={h} rx={10} ry={10} fill={CELL_BG} />
            <rect x={x} y={y} width={w} height={h} rx={10} ry={10} fill={`url(#${patternId})`} />
            <rect x={x} y={y} width={w} height={h} rx={10} ry={10} fill="none" stroke={FRAME} strokeWidth="1.1" strokeOpacity={0.7} />
            <CapsulePill cx={x + w / 2} cy={y + h / 2} r={r} />
            <text x={x + w / 2} y={y + h + 16} textAnchor="middle" fill={LABEL} fontSize="11" fontFamily="serif" style={{ letterSpacing: '0.05em' }}>
              {slot.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- 模式 B：永远 4 格，空格退场（无边框 / 无标签 / 无 -，仅土壤底）----

function ModeB({ filledSlots, idx }: { filledSlots: SlotKey[]; idx: number }) {
  const r = 7;
  const cellW = (320 - 8) / 4;
  const patternId = `soilB-${idx}`;
  return (
    <svg width="100%" viewBox="0 0 320 76" preserveAspectRatio="xMidYMid meet" style={{ maxWidth: 360, height: 76 }}>
      <defs>
        <SoilPattern id={patternId} />
      </defs>
      {SLOTS.map((slot, i) => {
        const x = 4 + i * cellW;
        const y = 4;
        const w = cellW - 2;
        const h = 48;
        const isFilled = filledSlots.includes(slot.key);

        if (!isFilled) {
          // 空格：仅土壤底（淡），无边框、无 `-` 字符、无标签
          return (
            <g key={slot.key}>
              <rect
                x={x + 4}
                y={y + h * 0.35}
                width={w - 8}
                height={h * 0.3}
                rx={6}
                ry={6}
                fill={`url(#${patternId})`}
                opacity={0.6}
              />
            </g>
          );
        }
        // 活的格子：完整渲染
        return (
          <g key={slot.key}>
            <rect x={x} y={y} width={w} height={h} rx={10} ry={10} fill={CELL_BG} />
            <rect x={x} y={y} width={w} height={h} rx={10} ry={10} fill={`url(#${patternId})`} />
            <rect x={x} y={y} width={w} height={h} rx={10} ry={10} fill="none" stroke={FRAME} strokeWidth="1.1" strokeOpacity={0.75} />
            <CapsulePill cx={x + w / 2} cy={y + h / 2} r={r} />
            <text x={x + w / 2} y={y + h + 16} textAnchor="middle" fill={LABEL} fontSize="11" fontFamily="serif" style={{ letterSpacing: '0.05em' }}>
              {slot.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- 模式 C：当前线上版本（4 格永远 + `-` 占位）----

function ModeC({ filledSlots, idx }: { filledSlots: SlotKey[]; idx: number }) {
  const r = 7;
  const cellW = (320 - 8) / 4;
  const patternId = `soilC-${idx}`;
  return (
    <svg width="100%" viewBox="0 0 320 76" preserveAspectRatio="xMidYMid meet" style={{ maxWidth: 360, height: 76 }}>
      <defs>
        <SoilPattern id={patternId} />
      </defs>
      {SLOTS.map((slot, i) => {
        const x = 4 + i * cellW;
        const y = 4;
        const w = cellW - 2;
        const h = 48;
        const isFilled = filledSlots.includes(slot.key);
        return (
          <g key={slot.key}>
            <rect x={x} y={y} width={w} height={h} rx={10} ry={10} fill={CELL_BG} />
            <rect x={x} y={y} width={w} height={h} rx={10} ry={10} fill={`url(#${patternId})`} />
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={10}
              ry={10}
              fill="none"
              stroke={isFilled ? FRAME : '#8B6B4A'}
              strokeWidth={isFilled ? 1.1 : 0.9}
              strokeOpacity={isFilled ? 0.7 : 0.3}
            />
            {isFilled ? (
              <CapsulePill cx={x + w / 2} cy={y + h / 2} r={r} />
            ) : (
              <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" fill="#8A8278" fontSize="14" fontFamily="sans-serif">
                -
              </text>
            )}
            <text x={x + w / 2} y={y + h + 16} textAnchor="middle" fill={LABEL} fontSize="11" fontFamily="serif" style={{ letterSpacing: '0.05em' }}>
              {slot.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- 页面 ----

export default function PillBoxPreview() {
  return (
    <div className="min-h-screen bg-bg-warm-2 px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-xl font-semibold text-text-primary mb-1">PillBox 三模式对比</h1>
        <p className="text-[12.5px] text-text-tertiary mb-6">
          选择哪种作为正式版。决定后我会替换主路径并删本页。
        </p>

        {SCENARIOS.map((sc, sIdx) => (
          <section key={sc.name} className="mb-8">
            <h2 className="font-serif text-[14.5px] font-semibold text-text-primary mb-3 border-b border-border-subtle pb-1">
              {sc.name}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <ModeRow label="A · 自适应（只渲染有内容的格）">
                <ModeA filledSlots={sc.filledSlots} idx={sIdx} />
              </ModeRow>
              <ModeRow label="B · 永远 4 格，空格退场（仅土壤底）">
                <ModeB filledSlots={sc.filledSlots} idx={sIdx} />
              </ModeRow>
              <ModeRow label="C · 当前线上（4 格 + `-` 占位）">
                <ModeC filledSlots={sc.filledSlots} idx={sIdx} />
              </ModeRow>
            </div>
          </section>
        ))}

        <div className="mt-10 pt-4 border-t border-border-subtle text-[11.5px] text-text-tertiary leading-relaxed">
          注：preview 用静态 SVG，不连 reminderStore；点击胶囊不会变色。
          只看 4 格 vs 自适应 vs 退场 三种「留白」策略。
        </div>
      </div>
    </div>
  );
}

function ModeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border-subtle rounded-card p-3">
      <p className="text-[11.5px] text-text-secondary mb-2 font-mono">{label}</p>
      <div className="flex justify-center">{children}</div>
    </div>
  );
}
