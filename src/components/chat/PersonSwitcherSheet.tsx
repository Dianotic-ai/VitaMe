// file: src/components/chat/PersonSwitcherSheet.tsx — 全屏底部 sheet 切换 person
// PR-PLAN.md §4.2 + §6 合规保留点 #4
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useProfileStore } from '@/lib/profile/profileStore';
import type { Person, Relation } from '@/lib/profile/types';
import { PersonMark } from '@/components/brand/PersonMark';
import { CheckLineIcon, CloseLineIcon, PlusLineIcon } from '@/components/brand/Icons';

const RELATION_LABEL: Record<Relation, string> = {
  self: '我自己',
  mother: '妈妈',
  father: '爸爸',
  spouse: '伴侣',
  child: '孩子',
  other: '其他',
};

const RELATION_OPTIONS: { value: Relation; label: string }[] = [
  { value: 'mother', label: '妈妈' },
  { value: 'father', label: '爸爸' },
  { value: 'spouse', label: '伴侣' },
  { value: 'child', label: '孩子' },
  { value: 'other', label: '其他家人' },
];

interface Props {
  onClose: () => void;
}

function summarize(p: Person): string {
  const parts: string[] = [];
  if (p.conditions[0]) parts.push(p.conditions[0].mention);
  if (p.medications[0]) parts.push(p.medications[0].mention);
  if (parts.length === 0) return '暂无健康信息';
  const more = p.conditions.length + p.medications.length - parts.length;
  return parts.join('、') + (more > 0 ? ` +${more}` : '');
}

export function PersonSwitcherSheet({ onClose }: Props) {
  const profile = useProfileStore((s) => s.profile);
  const setActivePersonId = useProfileStore((s) => s.setActivePersonId);
  const addPerson = useProfileStore((s) => s.addPerson);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState<Relation>('mother');

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function handlePick(personId: string) {
    setActivePersonId(personId);
    onClose();
  }

  function handleAddSubmit(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim() || RELATION_LABEL[newRelation];
    addPerson(name, newRelation);
    setNewName('');
    setNewRelation('mother');
    setShowAdd(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* 底部 sheet */}
      <div className="relative mt-auto bg-bg-warm rounded-t-[20px] shadow-elev-3 max-h-[80vh] flex flex-col animate-slide-up">
        {/* drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-border-strong" />
        </div>

        {/* header */}
        <div className="flex items-start justify-between px-5 pt-1 pb-3 border-b border-border-subtle">
          <div>
            <h2 className="font-serif text-base font-semibold text-text-primary">切换咨询对象</h2>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              每人独立档案 · 切换后，对话会基于该家人的健康信息回答
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary p-1 -mr-1"
            aria-label="关闭"
          >
            <CloseLineIcon className="w-4 h-4" />
          </button>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1.5">
            {profile.people.map((p) => {
              const isActive = p.id === profile.activePersonId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(p.id)}
                    className={
                      isActive
                        ? 'w-full flex items-center gap-3 px-3 py-2.5 rounded-card bg-seed-soft border border-seed/30 text-left'
                        : 'w-full flex items-center gap-3 px-3 py-2.5 rounded-card bg-surface border border-border-subtle text-left hover:border-border-strong transition-colors'
                    }
                  >
                    <PersonMark relation={p.relation} size={20} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[14px] font-medium text-text-primary">{p.name}</span>
                        <span className="text-[10px] text-text-tertiary">{RELATION_LABEL[p.relation]}</span>
                      </div>
                      <div className="text-[11px] text-text-secondary truncate mt-0.5">{summarize(p)}</div>
                    </div>
                    {isActive && <CheckLineIcon className="w-4 h-4 text-forest shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 添加家人 */}
          <div className="mt-3">
            {!showAdd ? (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-card border border-dashed border-border-strong text-text-secondary hover:border-forest hover:text-forest transition-colors text-[13px]"
              >
                <PlusLineIcon className="w-3.5 h-3.5" />
                <span>新增家人档案</span>
              </button>
            ) : (
              <form onSubmit={handleAddSubmit} className="bg-surface border border-border-subtle rounded-card p-3 space-y-2">
                <select
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value as Relation)}
                  className="w-full text-[13px] border border-border-subtle rounded-md px-2 py-1.5 bg-bg-warm"
                >
                  {RELATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`显示名（默认"${RELATION_LABEL[newRelation]}"）`}
                  className="w-full text-[13px] border border-border-subtle rounded-md px-2 py-1.5 bg-bg-warm"
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 text-[13px] px-3 py-1.5 bg-forest text-white rounded-md hover:bg-forest-2">
                    添加
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="text-[13px] px-3 py-1.5 border border-border-subtle rounded-md text-text-secondary"
                  >
                    取消
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
