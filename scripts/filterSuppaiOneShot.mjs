// file: scripts/filterSuppaiOneShot.mjs — 一次性修剪 suppai-interactions.ts（不重跑网络）
//
// 用途：v2.3 阈值调整后（MIN_EVIDENCE=3），对已存在的 suppai-interactions.ts 应用过滤，
// 避免 bakeSuppai 重跑 ~100 min 网络 fetch。跑完即删，长期语义在 bakeSuppai.ts。
//
// 算法：对每个对象块（{ ... }, 结尾），解析出 evidenceCount 字段，< 3 则删掉该块。

import { readFileSync, writeFileSync, statSync } from 'node:fs';

const TARGET = 'src/lib/db/suppai-interactions.ts';
const MIN_EVIDENCE = 3;

const src = readFileSync(TARGET, 'utf-8');

// 定位数组 literal 的开头与结尾
const arrayStart = src.indexOf('= [');
const arrayEnd = src.indexOf('];', arrayStart);
if (arrayStart < 0 || arrayEnd < 0) throw new Error('array literal not found');

const before = src.slice(0, arrayStart + 3); // 含 "= ["
const after = src.slice(arrayEnd);           // 含 "];" 和后续
const body = src.slice(arrayStart + 3, arrayEnd);

// 按 "  },\n" 粗切成对象块。每块以 "  {" 开头
const blocks = body.split(/\n  \{\n/).filter((b) => b.trim().length > 0);

let kept = 0;
let dropped = 0;
const filteredBlocks = [];
for (const b of blocks) {
  const m = b.match(/evidenceCount:\s*(\d+)/);
  if (!m) { dropped++; continue; }
  const ev = parseInt(m[1], 10);
  if (ev >= MIN_EVIDENCE) {
    filteredBlocks.push(b);
    kept++;
  } else {
    dropped++;
  }
}

const newBody = '\n  {\n' + filteredBlocks.join('\n  {\n');

// 同步更新头部注释里的「总条目: N」
let out = before + newBody + after;
out = out.replace(/总条目: \d+/, `总条目: ${kept}`);
out = out.replace(
  /过滤条件：[^\n]*/,
  `过滤条件：另一侧 ent_type='drug' + evidence >= ${MIN_EVIDENCE}（CLAUDE.md §9.3 坑 4 v2.3 阈值）；severity 统一 yellow）`,
);

writeFileSync(TARGET, out, 'utf-8');
const { size } = statSync(TARGET);
console.log(`filterSuppai — kept: ${kept}, dropped: ${dropped}, size: ${(size / 1024).toFixed(1)} KB`);
