// file: src/app/profile/page.tsx — Seed Within 多 Person 健康档案
// PR-PLAN.md §4 + §6 合规保留点 #3 #5
'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useProfileStore } from '@/lib/profile/profileStore';
import type { AgeRange, Person, Relation, Sex } from '@/lib/profile/types';
import { VitaMeLogo } from '@/components/brand/VitaMeLogo';
import { PersonMark } from '@/components/brand/PersonMark';
import { ChevronLeftLineIcon, PlusLineIcon, TrashLineIcon } from '@/components/brand/Icons';

const AGE_OPTIONS: AgeRange[] = ['<18', '18-30', '30-45', '45-60', '60+'];

const RELATION_LABEL: Record<Relation, string> = {
  self: '我自己',
  mother: '妈妈',
  father: '爸爸',
  spouse: '伴侣',
  child: '孩子',
  other: '其他',
};

export default function ProfilePage() {
  const profile = useProfileStore((s) => s.profile);
  const setActivePersonId = useProfileStore((s) => s.setActivePersonId);
  const addPerson = useProfileStore((s) => s.addPerson);
  const removePerson = useProfileStore((s) => s.removePerson);
  const renamePerson = useProfileStore((s) => s.renamePerson);

  const addCondition = useProfileStore((s) => s.addCondition);
  const removeCondition = useProfileStore((s) => s.removeCondition);
  const addMedication = useProfileStore((s) => s.addMedication);
  const removeMedication = useProfileStore((s) => s.removeMedication);
  const addAllergy = useProfileStore((s) => s.addAllergy);
  const removeAllergy = useProfileStore((s) => s.removeAllergy);
  const setBasic = useProfileStore((s) => s.setBasic);
  const clearActivePerson = useProfileStore((s) => s.clearActivePerson);
  const clearAll = useProfileStore((s) => s.clearAll);

  const active: Person = profile.people.find((p) => p.id === profile.activePersonId) ?? profile.people[0]!;

  const [newCond, setNewCond] = useState('');
  const [newMed, setNewMed] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonRelation, setNewPersonRelation] = useState<Relation>('mother');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  function submitCondition(e: FormEvent) {
    e.preventDefault();
    if (!newCond.trim()) return;
    addCondition(newCond.trim());
    setNewCond('');
  }
  function submitMedication(e: FormEvent) {
    e.preventDefault();
    if (!newMed.trim()) return;
    addMedication(newMed.trim(), true);
    setNewMed('');
  }
  function submitAllergy(e: FormEvent) {
    e.preventDefault();
    if (!newAllergy.trim()) return;
    addAllergy(newAllergy.trim());
    setNewAllergy('');
  }

  function handleAddPerson(e: FormEvent) {
    e.preventDefault();
    const name = newPersonName.trim() || RELATION_LABEL[newPersonRelation];
    addPerson(name, newPersonRelation);
    setNewPersonName('');
    setNewPersonRelation('mother');
    setShowAddPerson(false);
  }

  function handleRemovePerson(personId: string) {
    if (profile.people.length <= 1) {
      window.alert('至少保留 1 个档案。如要全部清空数据，请用页面底部"销毁全部档案"。');
      return;
    }
    const target = profile.people.find((p) => p.id === personId);
    if (window.confirm(`删除 "${target?.name}" 的档案？该家人的所有健康信息将永久清除。`)) {
      removePerson(personId);
    }
  }

  function startRename() {
    setNameDraft(active.name);
    setEditingName(true);
  }
  function commitRename() {
    if (nameDraft.trim()) renamePerson(active.id, nameDraft.trim());
    setEditingName(false);
  }

  function handleClearActive() {
    if (window.confirm(`清空 "${active.name}" 档案的全部健康条目？该 Person 本身保留。`)) {
      clearActivePerson();
    }
  }
  function handleClearAll() {
    if (window.confirm('销毁全部档案（所有家人 + 你自己），不可撤回。继续？')) {
      clearAll();
    }
  }

  return (
    <div className="min-h-screen bg-bg-warm-2 pb-20">
      {/* Header — 合规保留点 #3：LOCAL 标 + "仅存本机·不上传服务器" */}
      <header className="bg-surface border-b border-border-subtle px-4 py-2.5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="w-8 h-8 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-warm flex items-center justify-center transition-colors"
              aria-label="返回对话"
            >
              <ChevronLeftLineIcon className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif text-base font-semibold text-text-primary leading-tight">
                  健康档案
                </h1>
                <span className="text-[9px] font-mono font-bold text-seed bg-seed-soft px-1 py-px rounded-sm tracking-wider">
                  LOCAL
                </span>
              </div>
              <p className="text-[10.5px] text-text-tertiary mt-0.5">仅存本机 · 不上传服务器</p>
            </div>
          </div>
          <VitaMeLogo size={20} withWordmark={false} />
        </div>
      </header>

      {/* Person tabs — 渐变根须 active 态 */}
      <div className="bg-surface border-b border-border-subtle px-3 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {profile.people.map((p) => {
            const isActive = p.id === active.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePersonId(p.id)}
                className="shrink-0 flex flex-col items-stretch group"
              >
                <span
                  className={
                    isActive
                      ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest text-white text-[12.5px] font-medium'
                      : 'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-warm border border-border-subtle text-text-secondary text-[12.5px] hover:border-border-strong transition-colors'
                  }
                >
                  <PersonMark
                    relation={p.relation}
                    size={14}
                    className={isActive ? '[&_path]:stroke-white [&_circle]:fill-white' : ''}
                  />
                  <span>{p.name}</span>
                </span>
                {isActive && (
                  <div className="flex justify-center mt-1.5 px-2">
                    <div className="relative w-full h-3">
                      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-2 bg-gradient-to-b from-forest/60 to-seed" />
                      <div className="absolute left-1/2 -translate-x-1/2 top-2 w-1 h-1 rounded-full bg-seed" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowAddPerson((v) => !v)}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface border border-dashed border-border-strong text-text-tertiary hover:border-forest hover:text-forest text-[12.5px]"
          >
            <PlusLineIcon className="w-3 h-3" />
            <span>添加家人</span>
          </button>
        </div>
      </div>

      {showAddPerson && (
        <form onSubmit={handleAddPerson} className="bg-seed-soft/50 border-b border-seed-soft px-4 py-3 flex gap-2 items-center">
          <select
            value={newPersonRelation}
            onChange={(e) => setNewPersonRelation(e.target.value as Relation)}
            className="text-[12.5px] border border-border-subtle rounded-md px-2 py-1.5 bg-surface"
          >
            <option value="mother">妈妈</option>
            <option value="father">爸爸</option>
            <option value="spouse">伴侣</option>
            <option value="child">孩子</option>
            <option value="other">其他</option>
          </select>
          <input
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            placeholder={`显示名（默认"${RELATION_LABEL[newPersonRelation]}"）`}
            className="flex-1 text-[12.5px] border border-border-subtle rounded-md px-2 py-1.5 bg-surface"
          />
          <button type="submit" className="text-[12.5px] px-3 py-1.5 bg-forest text-white rounded-md">
            添加
          </button>
          <button
            type="button"
            onClick={() => setShowAddPerson(false)}
            className="text-[12.5px] px-3 py-1.5 border border-border-subtle rounded-md text-text-secondary"
          >
            取消
          </button>
        </form>
      )}

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-5">
        {/* Person Header Card — 顶部 14×3 corner mark */}
        <div className="relative bg-surface border border-border-subtle rounded-card px-4 py-3.5 shadow-elev-1">
          <div className="absolute top-0 left-4 w-3.5 h-[3px] bg-seed rounded-b-sm" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <PersonMark relation={active.relation} size={22} />
              {editingName ? (
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  autoFocus
                  className="font-serif text-[17px] border-b border-forest outline-none bg-transparent"
                />
              ) : (
                <button
                  onClick={startRename}
                  className="font-serif text-[17px] font-semibold text-text-primary hover:text-forest"
                  title="点击改名"
                >
                  {active.name}
                </button>
              )}
              <span className="text-[10.5px] text-text-tertiary">{RELATION_LABEL[active.relation]}</span>
            </div>
            {active.relation !== 'self' && profile.people.length > 1 && (
              <button
                onClick={() => handleRemovePerson(active.id)}
                className="text-[11px] text-risk-red/80 hover:text-risk-red"
              >
                删除此档案
              </button>
            )}
          </div>
        </div>

        {/* 基础信息 */}
        <Section title="基础信息" count={(active.ageRange ? 1 : 0) + (active.sex ? 1 : 0)}>
          <Row label="年龄段">
            <div className="flex gap-1.5 flex-wrap">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBasic({ ageRange: active.ageRange === opt ? undefined : opt })}
                  className={
                    active.ageRange === opt
                      ? 'px-2.5 py-1 text-[11.5px] rounded-full bg-forest text-white'
                      : 'px-2.5 py-1 text-[11.5px] rounded-full bg-surface border border-border-subtle text-text-secondary hover:border-border-strong'
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </Row>
          <Row label="性别">
            <div className="flex gap-1.5">
              {(['M', 'F'] as Sex[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBasic({ sex: active.sex === opt ? undefined : opt })}
                  className={
                    active.sex === opt
                      ? 'px-2.5 py-1 text-[11.5px] rounded-full bg-forest text-white'
                      : 'px-2.5 py-1 text-[11.5px] rounded-full bg-surface border border-border-subtle text-text-secondary'
                  }
                >
                  {opt === 'M' ? '男' : '女'}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* 疾病 / 病史 */}
        <Section title="疾病 / 病史" count={active.conditions.length}>
          {active.conditions.length === 0 && <p className="text-[12px] text-text-tertiary mb-2">暂无</p>}
          <ul className="space-y-1.5 mb-2">
            {active.conditions.map((c, i) => (
              <li
                key={`${c.mention}-${i}`}
                className="flex items-center justify-between bg-surface px-3 py-2 rounded-card border border-border-subtle"
              >
                <div>
                  <span className="text-[13.5px] text-text-primary">{c.mention}</span>
                  <span className="text-[10.5px] text-text-tertiary ml-2">{c.firstAt.slice(0, 10)} 提及</span>
                </div>
                <button onClick={() => removeCondition(i)} className="text-text-tertiary hover:text-risk-red p-1" aria-label="删除">
                  <TrashLineIcon className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <AddRow
            value={newCond}
            onChange={setNewCond}
            onSubmit={submitCondition}
            placeholder="如：糖尿病 / 高血压 / 肾结石"
          />
        </Section>

        {/* 长期用药 */}
        <Section title="长期用药" count={active.medications.length}>
          {active.medications.length === 0 && <p className="text-[12px] text-text-tertiary mb-2">暂无</p>}
          <ul className="space-y-1.5 mb-2">
            {active.medications.map((m, i) => (
              <li
                key={`${m.mention}-${i}`}
                className="flex items-center justify-between bg-surface px-3 py-2 rounded-card border border-border-subtle"
              >
                <div>
                  <span className="text-[13.5px] text-text-primary">{m.mention}</span>
                  {m.isLongTerm && (
                    <span className="text-[10px] text-forest bg-forest-soft ml-2 px-1.5 py-0.5 rounded-sm">长期</span>
                  )}
                  <span className="text-[10.5px] text-text-tertiary ml-2">{m.firstAt.slice(0, 10)}</span>
                </div>
                <button onClick={() => removeMedication(i)} className="text-text-tertiary hover:text-risk-red p-1" aria-label="删除">
                  <TrashLineIcon className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <AddRow
            value={newMed}
            onChange={setNewMed}
            onSubmit={submitMedication}
            placeholder="如：二甲双胍 / 优甲乐 / 华法林"
          />
        </Section>

        {/* 过敏 */}
        <Section title="过敏" count={active.allergies.length}>
          {active.allergies.length === 0 && <p className="text-[12px] text-text-tertiary mb-2">暂无</p>}
          <ul className="space-y-1.5 mb-2">
            {active.allergies.map((a, i) => (
              <li
                key={`${a.mention}-${i}`}
                className="flex items-center justify-between bg-surface px-3 py-2 rounded-card border border-border-subtle"
              >
                <div>
                  <span className="text-[13.5px] text-text-primary">{a.mention}</span>
                  <span className="text-[10.5px] text-text-tertiary ml-2">{a.firstAt.slice(0, 10)}</span>
                </div>
                <button onClick={() => removeAllergy(i)} className="text-text-tertiary hover:text-risk-red p-1" aria-label="删除">
                  <TrashLineIcon className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <AddRow
            value={newAllergy}
            onChange={setNewAllergy}
            onSubmit={submitAllergy}
            placeholder="如：甲壳类 / 花粉 / 青霉素"
          />
        </Section>

        {/* 特殊人群 */}
        {active.specialGroups.length > 0 && (
          <Section title="特殊人群" count={active.specialGroups.length}>
            <div className="flex gap-1.5 flex-wrap">
              {active.specialGroups.map((g) => (
                <span
                  key={g}
                  className="px-2 py-1 text-[11.5px] rounded-full bg-disclaimer-bg text-disclaimer-text border border-disclaimer-border"
                >
                  {g === 'pregnancy' ? '孕期' : g === 'breastfeeding' ? '哺乳期' : g === 'infant' ? '婴幼儿' : '老年'}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* 历史摘要 */}
        {active.conversationSummaries.length > 0 && (
          <Section title="对话历史摘要" count={active.conversationSummaries.length}>
            <ul className="space-y-1.5 text-[13px]">
              {active.conversationSummaries.slice(-5).reverse().map((s) => (
                <li key={s.sessionId} className="bg-surface px-3 py-2 rounded-card border border-border-subtle">
                  <div className="text-[10.5px] text-text-tertiary mb-0.5">{s.ts.slice(0, 16).replace('T', ' ')}</div>
                  <div className="text-text-primary leading-relaxed">{s.summary}</div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* 元信息 + 清空 */}
        <Section title="档案管理">
          <div className="text-[11.5px] text-text-secondary space-y-1 mb-3 bg-surface border border-border-subtle rounded-card px-3 py-2.5">
            <div>当前档案: <span className="font-medium text-text-primary">{active.name}</span>（{RELATION_LABEL[active.relation]}）</div>
            <div className="text-text-tertiary">Session ID: <span className="font-mono">{profile.sessionId.slice(0, 12)}...</span></div>
            <div className="text-text-tertiary">最后更新: {active.updatedAt.slice(0, 16).replace('T', ' ')}</div>
            <div className="text-text-tertiary">共 {profile.people.length} 个档案</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClearActive}
              className="px-3 py-2 text-[12px] bg-disclaimer-bg text-disclaimer-text border border-disclaimer-border rounded-md hover:bg-disclaimer-bg/80"
            >
              清空"{active.name}"档案
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-[12px] bg-surface text-risk-red border border-risk-red/40 rounded-md hover:bg-risk-red/5"
            >
              销毁全部档案
            </button>
          </div>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2 px-0.5">
        <h2 className="font-serif text-[14px] font-semibold text-text-primary">{title}</h2>
        {typeof count === 'number' && count > 0 && (
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
            {String(count).padStart(2, '0')}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-[11.5px] text-text-tertiary min-w-16">{label}</span>
      {children}
    </div>
  );
}

function AddRow({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  placeholder: string;
}) {
  return (
    <form onSubmit={onSubmit} className="flex bg-bg-warm border border-border-subtle rounded-card overflow-hidden">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-[13px] bg-transparent outline-none placeholder:text-text-tertiary"
      />
      <button
        type="submit"
        className="flex items-center gap-1 px-3 py-2 text-[12px] text-forest border-l border-border-subtle hover:bg-forest-soft transition-colors"
      >
        <PlusLineIcon className="w-3 h-3" />
        添加
      </button>
    </form>
  );
}
