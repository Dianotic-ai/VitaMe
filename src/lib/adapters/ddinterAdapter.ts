// file: src/lib/adapters/ddinterAdapter.ts — L2 判断层第 3 路：DDInter 药物×药物
//
// P0 既定状态：返回空数组（按 spec §Error Handling）。
// partialData=false —— 不是"降级"，是"P0 该来源未激活"；前端不打降级徽章，audit 另行记录。
// P1 激活时读 src/lib/db/ddinter-drug-drug.ts。

import type { LookupRequest, LookupResponse, SafetyAdapter } from '@/lib/types/adapter';

export const ddinterAdapter: SafetyAdapter = {
  name: 'ddinter',
  async lookup(_req: LookupRequest): Promise<LookupResponse> {
    return {
      risks: [],
      partialData: false,
      source: 'ddinter',
    };
  },
};
