// file: src/components/chat/PromptInspector.tsx — 北极星 §8 "LLM 看到什么" 视图
//
// 让用户透明看到：当前发给 AI 的 user_profile snapshot 是什么
// 不展示 retrieved_facts (那是动态的，按 query 不同而不同) — 这版只展示静态 profile 注入
'use client';

import { useEffect } from 'react';
import { useProfileStore } from '@/lib/profile/profileStore';
import { useEventStore } from '@/lib/memory/eventStore';
import { personToSnapshot } from '@/lib/profile/profileInjector';
import type { Person } from '@/lib/profile/types';
import { CloseLineIcon } from '@/components/brand/Icons';

interface Props {
  onClose: () => void;
}

export function PromptInspector({ onClose }: Props) {
  const profile = useProfileStore((s) => s.profile);
  const active: Person = profile.people.find((p) => p.id === profile.activePersonId) ?? profile.people[0]!;
  const eventCount = useEventStore((s) => s.events.filter((e) => e.personId === active.id).length);

  const snapshot = personToSnapshot(active);
  const xml = snapshotToXml(snapshot, active.name);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const fieldCount =
    (snapshot.conditions?.length ?? 0) +
    (snapshot.medications?.length ?? 0) +
    (snapshot.allergies?.length ?? 0) +
    (snapshot.specialGroups?.length ?? 0) +
    (snapshot.ageRange ? 1 : 0) +
    (snapshot.sex ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative mt-auto bg-bg-warm rounded-t-[20px] shadow-elev-3 max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-border-strong" />
        </div>

        <div className="flex items-start justify-between px-5 pt-1 pb-3 border-b border-border-subtle">
          <div>
            <h2 className="font-serif text-base font-semibold text-text-primary flex items-center gap-1.5">
              AI 看到的内容
              <span className="text-[9px] font-mono font-bold text-seed bg-seed-soft px-1 py-px rounded-sm tracking-wider">
                LOCAL
              </span>
            </h2>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              当前是「{active.name}」的档案 · {fieldCount} 条字段会注入 AI 提示词
            </p>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary p-1 -mr-1" aria-label="关闭">
            <CloseLineIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* 解释段 */}
          <div className="text-[12px] text-text-secondary leading-relaxed bg-stream-soft/40 border border-stream/20 rounded-card px-3 py-2">
            <p className="font-medium text-text-primary mb-1">VitaMe 透明度</p>
            <p>
              每次你发送消息，下面这段 XML 会被注入 AI 的提示词中，告诉它你的健康状况。这样它能避免推荐跟你的疾病/用药冲突的补剂。
            </p>
            <p className="mt-1.5 text-text-tertiary">
              所有数据 <strong className="text-seed">仅在你的浏览器</strong>，不上传服务器。
            </p>
          </div>

          {/* 字段汇总 */}
          {fieldCount > 0 ? (
            <FieldSummary snapshot={snapshot} />
          ) : (
            <div className="text-center text-[12px] text-text-tertiary py-4">
              「{active.name}」档案为空 — AI 不会知道任何健康信息
            </div>
          )}

          {/* 原始 XML */}
          <details className="bg-surface border border-border-subtle rounded-card">
            <summary className="px-3 py-2 cursor-pointer text-[12px] text-text-secondary hover:text-text-primary">
              查看原始 XML（开发者视角）
            </summary>
            <pre className="px-3 pb-3 text-[10.5px] text-text-primary overflow-x-auto font-mono leading-relaxed">
              {xml}
            </pre>
          </details>

          {/* 关联事件 */}
          <div className="bg-surface border border-border-subtle rounded-card px-3 py-2.5">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[12px] font-medium text-text-primary">关联 Memory 事件</span>
              <span className="font-mono text-[10.5px] text-text-tertiary">{eventCount}</span>
            </div>
            <p className="text-[11px] text-text-secondary">
              「{active.name}」累计 {eventCount} 条事件（verify / feedback / reminder / observation / correction）。
            </p>
            <p className="text-[10.5px] text-text-tertiary mt-1">
              事件流不直接注入提示词，由 Hermit Agent 周期归纳后生成 observation 再呈现。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldSummary({ snapshot }: { snapshot: ReturnType<typeof personToSnapshot> }) {
  return (
    <div className="space-y-2.5">
      {snapshot.ageRange && (
        <Row label="年龄段" items={[snapshot.ageRange]} />
      )}
      {snapshot.sex && (
        <Row label="性别" items={[snapshot.sex === 'M' ? '男' : '女']} />
      )}
      {snapshot.conditions && snapshot.conditions.length > 0 && (
        <Row label="疾病/病史" items={snapshot.conditions.map((c) => c.mention)} />
      )}
      {snapshot.medications && snapshot.medications.length > 0 && (
        <Row label="长期用药" items={snapshot.medications.map((m) => m.mention)} />
      )}
      {snapshot.allergies && snapshot.allergies.length > 0 && (
        <Row label="过敏" items={snapshot.allergies.map((a) => a.mention)} />
      )}
      {snapshot.specialGroups && snapshot.specialGroups.length > 0 && (
        <Row
          label="特殊人群"
          items={snapshot.specialGroups.map((g) =>
            g === 'pregnancy' ? '孕期' : g === 'breastfeeding' ? '哺乳期' : g === 'infant' ? '婴幼儿' : '老年'
          )}
        />
      )}
      {snapshot.recentTopics && snapshot.recentTopics.length > 0 && (
        <Row label="近期话题" items={snapshot.recentTopics} />
      )}
    </div>
  );
}

function Row({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex items-start gap-3 text-[12.5px]">
      <span className="text-text-tertiary min-w-16 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1">
        {items.map((it, i) => (
          <span key={i} className="px-1.5 py-0.5 bg-forest-soft text-forest rounded-sm border border-forest/20 text-[11.5px]">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function snapshotToXml(snap: ReturnType<typeof personToSnapshot>, personName: string): string {
  const lines: string[] = [`<user_profile person="${personName}">`];
  if (snap.conditions?.length) {
    lines.push(`  <conditions>${snap.conditions.map((c) => `${c.mention}(${c.firstAt.slice(0, 10)})`).join('、')}</conditions>`);
  }
  if (snap.medications?.length) {
    lines.push(`  <medications>${snap.medications.map((m) => `${m.mention}${m.isLongTerm ? '(长期)' : ''}`).join('、')}</medications>`);
  }
  if (snap.allergies?.length) {
    lines.push(`  <allergies>${snap.allergies.map((a) => a.mention).join('、')}</allergies>`);
  }
  if (snap.specialGroups?.length) {
    lines.push(`  <special_groups>${snap.specialGroups.join('、')}</special_groups>`);
  }
  if (snap.ageRange) lines.push(`  <age_range>${snap.ageRange}</age_range>`);
  if (snap.sex) lines.push(`  <sex>${snap.sex}</sex>`);
  if (snap.recentTopics?.length) {
    lines.push(`  <recent_topics>${snap.recentTopics.join('；')}</recent_topics>`);
  }
  lines.push('</user_profile>');
  return lines.join('\n');
}
