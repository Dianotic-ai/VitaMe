// file: src/app/profile/page.tsx — v0.3 多 Person 健康档案 UI
//
// 顶部 person tabs 切换 → 下方显示当前 active person 的档案
// CLAUDE.md §9.8: 仅本机 + 一键清空
'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useProfileStore } from '@/lib/profile/profileStore';
import type { AgeRange, Person, Relation, Sex } from '@/lib/profile/types';

const AGE_OPTIONS: AgeRange[] = ['<18', '18-30', '30-45', '45-60', '60+'];

const RELATION_LABEL: Record<Relation, string> = {
  self: '我自己', mother: '妈妈', father: '爸爸', spouse: '伴侣', child: '孩子', other: '其他',
};

function personEmoji(rel: Relation): string {
  return rel === 'self' ? '👤' : rel === 'mother' ? '👩' : rel === 'father' ? '👨' : rel === 'spouse' ? '💑' : rel === 'child' ? '🧒' : '👥';
}

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
  const [editingNameForId, setEditingNameForId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

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
    if (window.confirm(`删除 "${profile.people.find((p) => p.id === personId)?.name}" 的档案？该家人的所有健康信息将永久清除。`)) {
      removePerson(personId);
    }
  }

  function startRename(person: Person) {
    setEditingNameForId(person.id);
    setEditingNameValue(person.name);
  }
  function commitRename() {
    if (editingNameForId && editingNameValue.trim()) {
      renamePerson(editingNameForId, editingNameValue.trim());
    }
    setEditingNameForId(null);
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
    <div className="min-h-screen bg-bg-warm pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-base font-semibold text-text-primary">健康档案</h1>
          <p className="text-[11px] text-gray-500">仅存本机 · 不上传服务器</p>
        </div>
        <Link href="/chat" className="text-xs text-emerald-700 px-2 py-1 rounded-full border border-emerald-200 hover:bg-emerald-50">
          ← 返回对话
        </Link>
      </header>

      {/* Person tabs */}
      <div className="bg-white border-b border-gray-200 px-2 py-2 flex gap-1.5 overflow-x-auto">
        {profile.people.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePersonId(p.id)}
            className={
              p.id === active.id
                ? 'shrink-0 px-3 py-1.5 rounded-full text-xs bg-emerald-600 text-white flex items-center gap-1'
                : 'shrink-0 px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-700 flex items-center gap-1 hover:bg-gray-200'
            }
          >
            <span>{personEmoji(p.relation)}</span>
            <span>{p.name}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowAddPerson((v) => !v)}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs bg-white border border-dashed border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-700"
        >
          ＋ 添加家人
        </button>
      </div>

      {showAddPerson && (
        <form onSubmit={handleAddPerson} className="bg-emerald-50 border-b border-emerald-100 px-4 py-3 flex gap-2 items-center">
          <select
            value={newPersonRelation}
            onChange={(e) => setNewPersonRelation(e.target.value as Relation)}
            className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white"
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
            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5"
          />
          <button type="submit" className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded">添加</button>
          <button type="button" onClick={() => setShowAddPerson(false)} className="text-xs px-3 py-1.5 border border-gray-300 rounded text-gray-600">取消</button>
        </form>
      )}

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-5">
        {/* 当前 Person 标题 */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{personEmoji(active.relation)}</span>
            {editingNameForId === active.id ? (
              <input
                value={editingNameValue}
                onChange={(e) => setEditingNameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingNameForId(null); }}
                autoFocus
                className="text-base border-b border-emerald-400 outline-none bg-transparent"
              />
            ) : (
              <button onClick={() => startRename(active)} className="text-base font-medium hover:text-emerald-700" title="点击改名">
                {active.name}
              </button>
            )}
            <span className="text-[11px] text-gray-400 ml-1">{RELATION_LABEL[active.relation]}</span>
          </div>
          {active.relation !== 'self' && profile.people.length > 1 && (
            <button onClick={() => handleRemovePerson(active.id)} className="text-xs text-red-500 hover:text-red-700">
              删除此档案
            </button>
          )}
        </div>

        {/* 基础信息 */}
        <Section title="基础信息">
          <Row label="年龄段">
            <div className="flex gap-2 flex-wrap">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBasic({ ageRange: active.ageRange === opt ? undefined : opt })}
                  className={
                    active.ageRange === opt
                      ? 'px-3 py-1 text-xs rounded-full bg-emerald-600 text-white'
                      : 'px-3 py-1 text-xs rounded-full bg-white border border-gray-300 text-gray-700'
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </Row>
          <Row label="性别">
            <div className="flex gap-2">
              {(['M', 'F'] as Sex[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBasic({ sex: active.sex === opt ? undefined : opt })}
                  className={
                    active.sex === opt
                      ? 'px-3 py-1 text-xs rounded-full bg-emerald-600 text-white'
                      : 'px-3 py-1 text-xs rounded-full bg-white border border-gray-300 text-gray-700'
                  }
                >
                  {opt === 'M' ? '男' : '女'}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* 疾病 / 病史 */}
        <Section title="疾病 / 病史">
          {active.conditions.length === 0 && <p className="text-xs text-gray-400 mb-2">暂无</p>}
          <ul className="space-y-1.5 mb-3">
            {active.conditions.map((c, i) => (
              <li key={`${c.mention}-${i}`} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200">
                <div>
                  <span className="text-sm">{c.mention}</span>
                  <span className="text-[11px] text-gray-400 ml-2">{c.firstAt.slice(0, 10)} 提及</span>
                </div>
                <button onClick={() => removeCondition(i)} className="text-xs text-red-500 hover:text-red-700">删除</button>
              </li>
            ))}
          </ul>
          <form onSubmit={submitCondition} className="flex gap-2">
            <input
              value={newCond}
              onChange={(e) => setNewCond(e.target.value)}
              placeholder="如：糖尿病 / 高血压 / 肾结石"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg">添加</button>
          </form>
        </Section>

        {/* 长期用药 */}
        <Section title="长期用药">
          {active.medications.length === 0 && <p className="text-xs text-gray-400 mb-2">暂无</p>}
          <ul className="space-y-1.5 mb-3">
            {active.medications.map((m, i) => (
              <li key={`${m.mention}-${i}`} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200">
                <div>
                  <span className="text-sm">{m.mention}</span>
                  {m.isLongTerm && <span className="text-[10px] text-emerald-600 ml-2">长期</span>}
                  <span className="text-[11px] text-gray-400 ml-2">{m.firstAt.slice(0, 10)}</span>
                </div>
                <button onClick={() => removeMedication(i)} className="text-xs text-red-500 hover:text-red-700">删除</button>
              </li>
            ))}
          </ul>
          <form onSubmit={submitMedication} className="flex gap-2">
            <input
              value={newMed}
              onChange={(e) => setNewMed(e.target.value)}
              placeholder="如：二甲双胍 / 优甲乐 / 华法林"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg">添加</button>
          </form>
        </Section>

        {/* 过敏 */}
        <Section title="过敏">
          {active.allergies.length === 0 && <p className="text-xs text-gray-400 mb-2">暂无</p>}
          <ul className="space-y-1.5 mb-3">
            {active.allergies.map((a, i) => (
              <li key={`${a.mention}-${i}`} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200">
                <div>
                  <span className="text-sm">{a.mention}</span>
                  <span className="text-[11px] text-gray-400 ml-2">{a.firstAt.slice(0, 10)}</span>
                </div>
                <button onClick={() => removeAllergy(i)} className="text-xs text-red-500 hover:text-red-700">删除</button>
              </li>
            ))}
          </ul>
          <form onSubmit={submitAllergy} className="flex gap-2">
            <input
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              placeholder="如：甲壳类 / 花粉 / 青霉素"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg">添加</button>
          </form>
        </Section>

        {/* 特殊人群 */}
        {active.specialGroups.length > 0 && (
          <Section title="特殊人群">
            <div className="flex gap-2 flex-wrap">
              {active.specialGroups.map((g) => (
                <span key={g} className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {g === 'pregnancy' ? '孕期' : g === 'breastfeeding' ? '哺乳期' : g === 'infant' ? '婴幼儿' : '老年'}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* 历史摘要 */}
        {active.conversationSummaries.length > 0 && (
          <Section title="对话历史摘要">
            <ul className="space-y-1.5 text-sm">
              {active.conversationSummaries.slice(-5).reverse().map((s) => (
                <li key={s.sessionId} className="bg-white px-3 py-2 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-400 mb-0.5">{s.ts.slice(0, 16).replace('T', ' ')}</div>
                  <div>{s.summary}</div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* 元信息 + 清空 */}
        <Section title="档案管理">
          <div className="text-xs text-gray-500 space-y-1 mb-3">
            <div>当前档案: <span className="font-medium">{active.name}</span>（{RELATION_LABEL[active.relation]}）</div>
            <div>Session ID: <span className="font-mono">{profile.sessionId.slice(0, 12)}...</span></div>
            <div>最后更新: {active.updatedAt.slice(0, 16).replace('T', ' ')}</div>
            <div>共 {profile.people.length} 个档案</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClearActive}
              className="px-3 py-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100"
            >
              🗑 清空"{active.name}"档案
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
            >
              ⚠ 销毁全部档案
            </button>
          </div>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-text-primary mb-2">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs text-gray-500 min-w-16">{label}</span>
      {children}
    </div>
  );
}
