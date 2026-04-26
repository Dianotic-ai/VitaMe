// file: src/app/profile/page.tsx — 健康档案查看 / 编辑 / 一键清空
//
// CLAUDE.md §9.8 硬要求：
// - 仅显示客户端 LocalStorage 数据，永不上传服务端
// - 必须有"一键清空"按钮
'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useProfileStore } from '@/lib/profile/profileStore';
import type { AgeRange, Sex } from '@/lib/profile/types';

const AGE_OPTIONS: AgeRange[] = ['<18', '18-30', '30-45', '45-60', '60+'];

export default function ProfilePage() {
  const profile = useProfileStore((s) => s.profile);
  const addCondition = useProfileStore((s) => s.addCondition);
  const removeCondition = useProfileStore((s) => s.removeCondition);
  const addMedication = useProfileStore((s) => s.addMedication);
  const removeMedication = useProfileStore((s) => s.removeMedication);
  const addAllergy = useProfileStore((s) => s.addAllergy);
  const removeAllergy = useProfileStore((s) => s.removeAllergy);
  const setBasic = useProfileStore((s) => s.setBasic);
  const clearAll = useProfileStore((s) => s.clearAll);

  const [newCond, setNewCond] = useState('');
  const [newMed, setNewMed] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

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

  function handleClearAll() {
    if (typeof window !== 'undefined' && window.confirm('确定要清空全部健康档案吗？此操作不可撤回。')) {
      clearAll();
    }
  }

  return (
    <div className="min-h-screen bg-bg-warm pb-20">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-text-primary">我的健康档案</h1>
          <p className="text-[11px] text-gray-500">仅存本机 · 不上传服务器</p>
        </div>
        <Link
          href="/chat"
          className="text-xs text-emerald-700 px-2 py-1 rounded-full border border-emerald-200 hover:bg-emerald-50"
        >
          ← 返回对话
        </Link>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-5">
        {/* 基础信息 */}
        <Section title="基础信息">
          <div className="space-y-3">
            <Row label="年龄段">
              <div className="flex gap-2 flex-wrap">
                {AGE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBasic({ ageRange: profile.ageRange === opt ? undefined : opt })}
                    className={
                      profile.ageRange === opt
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
                    onClick={() => setBasic({ sex: profile.sex === opt ? undefined : opt })}
                    className={
                      profile.sex === opt
                        ? 'px-3 py-1 text-xs rounded-full bg-emerald-600 text-white'
                        : 'px-3 py-1 text-xs rounded-full bg-white border border-gray-300 text-gray-700'
                    }
                  >
                    {opt === 'M' ? '男' : '女'}
                  </button>
                ))}
              </div>
            </Row>
          </div>
        </Section>

        {/* 疾病 / 病史 */}
        <Section title="疾病 / 病史">
          {profile.conditions.length === 0 && <p className="text-xs text-gray-400 mb-2">暂无</p>}
          <ul className="space-y-1.5 mb-3">
            {profile.conditions.map((c, i) => (
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
              placeholder="如：糖尿病 / 肾结石"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg">添加</button>
          </form>
        </Section>

        {/* 长期用药 */}
        <Section title="长期用药">
          {profile.medications.length === 0 && <p className="text-xs text-gray-400 mb-2">暂无</p>}
          <ul className="space-y-1.5 mb-3">
            {profile.medications.map((m, i) => (
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
              placeholder="如：二甲双胍 / 优甲乐"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg">添加</button>
          </form>
        </Section>

        {/* 过敏 */}
        <Section title="过敏">
          {profile.allergies.length === 0 && <p className="text-xs text-gray-400 mb-2">暂无</p>}
          <ul className="space-y-1.5 mb-3">
            {profile.allergies.map((a, i) => (
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
              placeholder="如：甲壳类 / 花粉"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg">添加</button>
          </form>
        </Section>

        {/* 特殊人群 */}
        {profile.specialGroups.length > 0 && (
          <Section title="特殊人群">
            <div className="flex gap-2 flex-wrap">
              {profile.specialGroups.map((g) => (
                <span key={g} className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {g === 'pregnancy' ? '孕期' : g === 'breastfeeding' ? '哺乳期' : g === 'infant' ? '婴幼儿' : '老年'}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* 历史摘要 */}
        {profile.conversationSummaries.length > 0 && (
          <Section title="对话历史摘要">
            <ul className="space-y-1.5 text-sm">
              {profile.conversationSummaries.slice(-5).reverse().map((s) => (
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
            <div>Session ID: <span className="font-mono">{profile.sessionId.slice(0, 12)}...</span></div>
            <div>最后更新: {profile.updatedAt.slice(0, 16).replace('T', ' ')}</div>
          </div>
          <button
            onClick={handleClearAll}
            className="px-3 py-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
          >
            🗑 一键清空所有档案
          </button>
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
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 min-w-16">{label}</span>
      {children}
    </div>
  );
}
