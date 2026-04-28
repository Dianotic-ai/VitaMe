// file: tests/unit/chat/quickReplies.spec.ts — parseChoiceGroups 多组解析契约
//
// 覆盖：单组、双组、混合无标题、退化场景（无问号 / 单项 / 太多组）
// 来源 bug：用户截图 agent 一条消息抛了「年龄 + 症状」两个 numbered list，
// 旧 parseStrictNumberedList 从尾扫描只命中第二组，第一组被丢弃。
// 修复后 parseChoiceGroups 必须返回两组，且第一组在前、label 抓到对应问句。

import { describe, it, expect } from 'vitest';
import { parseChoiceGroups, parseChoices } from '@/components/chat/QuickReplies';

describe('parseChoiceGroups — 多步 wizard 解析', () => {
  describe('单组场景（保持旧行为）', () => {
    it('返回 1 组、3 选项', () => {
      const text = `先排个优先级，你最想改善哪个？
1. 白天精神
2. 晚上睡眠
3. 都想要`;
      const groups = parseChoiceGroups(text);
      expect(groups).toHaveLength(1);
      expect(groups[0]!.choices.map((c) => c.label)).toEqual(['白天精神', '晚上睡眠', '都想要']);
      expect(groups[0]!.label).toBe('先排个优先级，你最想改善哪个？');
    });

    it('问号缺失 → 不视为选项', () => {
      const text = `今天的清单：
1. 鱼油
2. 维 D`;
      expect(parseChoiceGroups(text)).toHaveLength(0);
    });

    it('单项不算可选项（最少 2 项）', () => {
      const text = `要不要试试？
1. 好`;
      expect(parseChoiceGroups(text)).toHaveLength(0);
    });
  });

  describe('双组场景（修复 bug）', () => {
    it('agent 一条消息抛两个问题 → 返回两组、顺序与文本一致', () => {
      const text = `熬夜伤身确实要重视。你先告诉我两件事，帮你缩小范围：
**你多大年纪？**
1. 20-30岁
2. 31-45岁
3. 45岁以上
**熬夜后你最难受的是？**
1. 白天犯困、精神差
2. 睡不着或睡眠浅
3. 眼睛干涩、视力模糊
4. 脸色差、掉头发
5. 以上好几点都有`;
      const groups = parseChoiceGroups(text);
      expect(groups).toHaveLength(2);
      expect(groups[0]!.choices.map((c) => c.label)).toEqual(['20-30岁', '31-45岁', '45岁以上']);
      expect(groups[1]!.choices.map((c) => c.label)).toEqual([
        '白天犯困、精神差',
        '睡不着或睡眠浅',
        '眼睛干涩、视力模糊',
        '脸色差、掉头发',
        '以上好几点都有',
      ]);
      expect(groups[0]!.label).toContain('多大年纪');
      expect(groups[1]!.label).toContain('最难受');
    });

    it('问句不带 markdown 加粗也能识别', () => {
      const text = `两件事：
你多大年纪？
1. 20-30岁
2. 31-45岁
症状是什么？
1. 困
2. 累`;
      const groups = parseChoiceGroups(text);
      expect(groups).toHaveLength(2);
      expect(groups[0]!.label).toBe('你多大年纪？');
      expect(groups[1]!.label).toBe('症状是什么？');
    });

    it('两组之间夹一段非问句文字 → 第二组 label 取不到（不抓上文段落）', () => {
      const text = `你多大年纪？
1. 20-30岁
2. 31-45岁
这部分需要先了解。
1. 困
2. 累`;
      const groups = parseChoiceGroups(text);
      // 第二组没有问号紧贴上方 → 整个解析也至少要保证不把"这部分需要先了解。"误吃成 label
      // 需求是返回有效组，但第二组应无 label（findQuestionLabel 碰到非问句立即停）
      expect(groups.length).toBeGreaterThanOrEqual(1);
      expect(groups[0]!.label).toBe('你多大年纪？');
      if (groups.length === 2) {
        expect(groups[1]!.label).toBeUndefined();
      }
    });
  });

  describe('退化场景', () => {
    it('超过 4 组 → 返回空（agent 写飞了）', () => {
      const text =
        '问题？\n' +
        Array.from({ length: 5 }, (_, gi) =>
          `Q${gi}？\n1. a\n2. b`
        ).join('\n');
      // 5 组明显失控，整体退化
      expect(parseChoiceGroups(text)).toHaveLength(0);
    });

    it('编号断裂（1, 2, 4）→ 当作两组，第一组只 1 项被丢，第二组从 1 重新算', () => {
      const text = `选哪个？
1. A
2. B
4. C`;
      const groups = parseChoiceGroups(text);
      // 1, 2 → 一组（2 项，合法）；4 → 不接续 expected=3，关组失败再当 1. 重新开但 4 != 1 也开不起来
      expect(groups).toHaveLength(1);
      expect(groups[0]!.choices.map((c) => c.label)).toEqual(['A', 'B']);
    });
  });

  describe('dash / bullet 列表兜底（agent 偶尔违反 prompt）', () => {
    it('整组用 dash 也识别为一组', () => {
      const text = `选哪个？
- A
- B
- C`;
      const groups = parseChoiceGroups(text);
      expect(groups).toHaveLength(1);
      expect(groups[0]!.choices.map((c) => c.label)).toEqual(['A', 'B', 'C']);
      expect(groups[0]!.label).toBe('选哪个？');
    });

    it('星号 * 列表也识别', () => {
      const text = `要哪个？
* X
* Y`;
      const groups = parseChoiceGroups(text);
      expect(groups).toHaveLength(1);
      expect(groups[0]!.choices.map((c) => c.label)).toEqual(['X', 'Y']);
    });

    it('混合：第一组 dash + 第二组 numbered（截图复现）', () => {
      const text = `好，但需要你提供几个基本情况才能给精准方案：
**你的年龄和性别？**
- 35 岁以下男性
- 35 岁以下女性
- 35-50 岁男性
- 35-50 岁女性
- 50 岁以上
**每天/每周大概喝多少？**
1. 每天小酌（1-2 杯）
2. 每周几次、每次较多（3-5 杯+）
3. 经常喝醉（每周 5 次以上）`;
      const groups = parseChoiceGroups(text);
      expect(groups).toHaveLength(2);
      expect(groups[0]!.choices.map((c) => c.label)).toEqual([
        '35 岁以下男性',
        '35 岁以下女性',
        '35-50 岁男性',
        '35-50 岁女性',
        '50 岁以上',
      ]);
      expect(groups[0]!.label).toContain('年龄');
      expect(groups[1]!.choices.map((c) => c.label)).toEqual([
        '每天小酌（1-2 杯）',
        '每周几次、每次较多（3-5 杯+）',
        '经常喝醉（每周 5 次以上）',
      ]);
      expect(groups[1]!.label).toContain('喝多少');
    });

    it('反向混合：第一组 numbered + 第二组 dash', () => {
      const text = `两件事：
你多大？
1. 20-30
2. 31-45
症状？
- 困
- 累`;
      const groups = parseChoiceGroups(text);
      expect(groups).toHaveLength(2);
      expect(groups[0]!.choices.map((c) => c.label)).toEqual(['20-30', '31-45']);
      expect(groups[1]!.choices.map((c) => c.label)).toEqual(['困', '累']);
    });

    it('bullet 不含问号 → 不识别（避免误抓普通无序列表）', () => {
      const text = `今天的清单：
- 鱼油
- 维 D`;
      expect(parseChoiceGroups(text)).toHaveLength(0);
    });

    it('**X** → ... 加粗箭头不被误识别为 bullet（走单独 BoldArrow 策略）', () => {
      const text = `你想要哪种？
**鱼油** → omega-3 高
**维 D** → 阳光替代`;
      const groups = parseChoiceGroups(text);
      // BoldArrow 策略只产单组
      expect(groups).toHaveLength(1);
      expect(groups[0]!.choices.map((c) => c.label)).toEqual(['鱼油', '维 D']);
    });
  });

  describe('parseChoices 兼容旧 API', () => {
    it('多组场景返回第一组', () => {
      const text = `年纪？
1. 20
2. 30
症状？
1. 困
2. 累`;
      const choices = parseChoices(text);
      expect(choices).not.toBeNull();
      expect(choices!.map((c) => c.label)).toEqual(['20', '30']);
    });

    it('无可识别选项返回 null', () => {
      expect(parseChoices('你好')).toBeNull();
      expect(parseChoices('')).toBeNull();
    });
  });
});
