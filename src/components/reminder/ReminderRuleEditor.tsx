// file: src/components/reminder/ReminderRuleEditor.tsx — /profile 里编辑某 supplement 的 reminder rules
'use client';

import { useState, type FormEvent } from 'react';
import { useReminderStore } from '@/lib/reminder/store';
import type { ReminderRule } from '@/lib/reminder/types';
import { TrashLineIcon, PlusLineIcon } from '@/components/brand/Icons';

interface Props {
  personId: string;
  supplementId: string;
  supplementName: string;
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export function ReminderRuleEditor({ personId, supplementId, supplementName }: Props) {
  const rules = useReminderStore((s) => s.rules.filter((r) => r.supplementId === supplementId));
  const addRule = useReminderStore((s) => s.addRule);
  const removeRule = useReminderStore((s) => s.removeRule);
  const updateRule = useReminderStore((s) => s.updateRule);

  const [showAdd, setShowAdd] = useState(false);
  const [newTime, setNewTime] = useState('08:00');
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  function toggleDay(d: number) {
    setNewDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newTime || newDays.length === 0) return;
    addRule({
      personId,
      supplementId,
      timeOfDay: newTime,
      daysOfWeek: newDays,
    });
    setShowAdd(false);
    setNewTime('08:00');
    setNewDays([1, 2, 3, 4, 5, 6, 7]);
  }

  return (
    <div className="bg-bg-warm border border-border-subtle rounded-card px-3 py-2 mt-1.5">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] font-medium text-text-secondary">提醒规则</span>
        <span className="text-[10px] text-text-tertiary">{rules.length} 条</span>
      </div>

      {rules.length > 0 && (
        <ul className="space-y-1 mb-1.5">
          {rules.map((r) => (
            <RuleRow
              key={r.ruleId}
              rule={r}
              onPause={() => updateRule(r.ruleId, { paused: !r.paused })}
              onDelete={() => removeRule(r.ruleId)}
            />
          ))}
        </ul>
      )}

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[11.5px] text-stream border border-dashed border-stream/40 rounded-card hover:bg-stream/5"
        >
          <PlusLineIcon className="w-3 h-3" />
          加提醒
        </button>
      ) : (
        <form onSubmit={handleAdd} className="space-y-1.5 bg-surface border border-border-subtle rounded-card px-2.5 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-tertiary">每天</span>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="text-[12px] border border-border-subtle rounded px-1.5 py-0.5 bg-bg-warm font-mono"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-text-tertiary mr-1">周</span>
            {DAY_LABELS.map((label, i) => {
              const d = i + 1;
              const sel = newDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={
                    sel
                      ? 'w-5 h-5 rounded-full bg-stream text-white text-[10px] font-medium'
                      : 'w-5 h-5 rounded-full bg-bg-warm border border-border-subtle text-text-tertiary text-[10px]'
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            <button type="submit" className="flex-1 text-[11.5px] px-2 py-1 bg-stream text-white rounded">
              添加 {supplementName ? `· ${supplementName}` : ''}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-[11.5px] px-2 py-1 border border-border-subtle rounded text-text-secondary"
            >
              取消
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function RuleRow({
  rule,
  onPause,
  onDelete,
}: {
  rule: ReminderRule;
  onPause: () => void;
  onDelete: () => void;
}) {
  const dayLabels = rule.daysOfWeek.map((d) => DAY_LABELS[d - 1]).join('');
  return (
    <li className="flex items-center justify-between bg-surface px-2.5 py-1.5 rounded text-[12px]">
      <div className="flex items-center gap-2">
        <span className={`font-mono ${rule.paused ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>{rule.timeOfDay}</span>
        <span className="text-text-tertiary text-[10.5px]">周{dayLabels}</span>
        {rule.frequencyMultiplier < 1.0 && (
          <span className="text-[9.5px] text-disclaimer-text bg-disclaimer-bg px-1 rounded-sm" title="连续无响应自动降频">
            降频
          </span>
        )}
        {rule.paused && (
          <span className="text-[9.5px] text-text-tertiary bg-bg-warm px-1 rounded-sm">已暂停</span>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        <button onClick={onPause} className="text-[10.5px] text-text-tertiary hover:text-text-primary px-1.5">
          {rule.paused ? '启用' : '暂停'}
        </button>
        <button onClick={onDelete} className="text-text-tertiary hover:text-risk-red p-1" aria-label="删除">
          <TrashLineIcon className="w-3 h-3" />
        </button>
      </div>
    </li>
  );
}
