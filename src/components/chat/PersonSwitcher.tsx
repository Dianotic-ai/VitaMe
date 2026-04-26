// file: src/components/chat/PersonSwitcher.tsx — chat header 当前咨询对象切换器
//
// 显示当前 active person + 下拉切换 + "添加家人"入口
'use client';

import { useState, useRef, useEffect } from 'react';
import { useProfileStore } from '@/lib/profile/profileStore';
import type { Person, Relation } from '@/lib/profile/types';

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

function personEmoji(rel: Relation): string {
  return rel === 'self' ? '👤' : rel === 'mother' ? '👩' : rel === 'father' ? '👨' : rel === 'spouse' ? '💑' : rel === 'child' ? '🧒' : '👥';
}

export function PersonSwitcher() {
  const profile = useProfileStore((s) => s.profile);
  const setActivePersonId = useProfileStore((s) => s.setActivePersonId);
  const addPerson = useProfileStore((s) => s.addPerson);

  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState<Relation>('mother');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const active = profile.people.find((p) => p.id === profile.activePersonId) ?? profile.people[0]!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowAdd(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim() || RELATION_LABEL[newRelation];
    addPerson(name, newRelation);
    setNewName('');
    setNewRelation('mother');
    setShowAdd(false);
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-emerald-800 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
        title="切换咨询对象（每个人有独立健康档案）"
      >
        <span>{personEmoji(active.relation)}</span>
        <span className="font-medium">{active.name}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" className="opacity-60"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 text-sm py-1">
          {profile.people.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setActivePersonId(p.id); setOpen(false); }}
              className={
                p.id === profile.activePersonId
                  ? 'w-full text-left px-3 py-2 bg-emerald-50 text-emerald-800 flex items-center gap-2'
                  : 'w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2'
              }
            >
              <span>{personEmoji(p.relation)}</span>
              <span className="flex-1">{p.name}</span>
              {p.id === profile.activePersonId && <span className="text-emerald-600">✓</span>}
            </button>
          ))}

          <div className="border-t border-gray-100 my-1" />

          {!showAdd ? (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <span>＋</span>
              <span>添加家人档案</span>
            </button>
          ) : (
            <form onSubmit={handleAddSubmit} className="px-3 py-2 space-y-2">
              <select
                value={newRelation}
                onChange={(e) => setNewRelation(e.target.value as Relation)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              >
                {RELATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`显示名（默认"${RELATION_LABEL[newRelation]}"）`}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              />
              <div className="flex gap-1">
                <button type="submit" className="flex-1 text-xs px-2 py-1 bg-emerald-600 text-white rounded">添加</button>
                <button type="button" onClick={() => setShowAdd(false)} className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-600">取消</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
